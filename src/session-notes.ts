import { type Plugin, tool } from "@opencode-ai/plugin"
import { homedir } from "node:os"
import { join } from "node:path"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"

type Note = {
  id: string
  text: string
  created: number
  done?: boolean
  doneAt?: number
}

type DB = Record<string, Note[]>

type PluginOptions = {
  /** Directory where notes are stored (default: ~/.local/share/opencode/tab-note). */
  dir?: string
  /** Custom marker prefix for in-prompt notes (default: "note:", "notes:", "✎", "✍"). */
  marker?: string
  /** Maximum number of notes injected into the system prompt (default: 20). */
  max_notes?: number
}

const DEFAULT_MARKERS = ["note:", "notes:", "✎", "✍"]

const DEFAULT_DIR = () => join(homedir(), ".local", "share", "opencode", "tab-note")

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value)

const newID = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

function readDB(file: string): DB {
  if (!existsSync(file)) return {}
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"))
    if (isObject(parsed)) return parsed as DB
  } catch {
    // Corrupt or unreadable store: start fresh rather than crashing opencode.
  }
  return {}
}

class NoteStore {
  readonly file: string
  private db: DB

  constructor(dir: string) {
    mkdirSync(dir, { recursive: true })
    this.file = join(dir, "notes.json")
    this.db = readDB(this.file)
  }

  private persist() {
    try {
      const tmp = `${this.file}.tmp`
      writeFileSync(tmp, JSON.stringify(this.db, null, 2))
      renameSync(tmp, this.file)
    } catch {
      // Best-effort persistence; keep working with the in-memory copy.
    }
  }

  list(sessionID: string, openOnly = true): Note[] {
    const all = this.db[sessionID] ?? []
    return openOnly ? all.filter((note) => !note.done) : all
  }

  add(sessionID: string, text: string): Note {
    const note: Note = { id: newID(), text, created: Date.now() }
    ;(this.db[sessionID] ??= []).push(note)
    this.persist()
    return note
  }

  markDone(sessionID: string, id: string): Note | undefined {
    const all = this.db[sessionID] ?? []
    const note = all.find((entry) => entry.id === id)
    if (!note) return undefined
    note.done = true
    note.doneAt = Date.now()
    this.persist()
    return note
  }

  clear(sessionID: string): number {
    const count = (this.db[sessionID] ?? []).length
    delete this.db[sessionID]
    this.persist()
    return count
  }
}

export default (async ({ client }, options) => {
  const opts = (options ?? {}) as PluginOptions
  const store = new NoteStore(opts.dir ?? DEFAULT_DIR())
  const markers = opts.marker ? [opts.marker] : DEFAULT_MARKERS
  const maxNotes = opts.max_notes ?? 20
  const markerPattern = new RegExp(`^(?:${markers.map(escapeRegex).join("|")})\\s*([\\s\\S]*)$`, "i")

  const log = (level: "info" | "debug" | "warn" | "error", message: string, extra?: Record<string, unknown>) => {
    try {
      void (client.app as { log: (input: unknown) => Promise<unknown> }).log({
        body: { service: "tab-note", level, message, extra },
      })
    } catch {
      // Logging is best-effort.
    }
  }

  log("info", "Plugin initialized", { store: store.file })

  return {
    tool: {
      notes_add: tool({
        description:
          "Add a tab note: a reminder of work to do in the NEXT run of this session, usually written while the session was busy. Stored per session and re-injected into context on later runs.",
        args: {
          text: tool.schema.string().describe("The note text to store."),
        },
        async execute({ text }, context) {
          const note = store.add(context.sessionID, text.trim())
          return {
            title: "Tab note added",
            output: `Added tab note [${note.id}]: "${truncate(note.text, 200)}". It will be surfaced on the next run of this session.`,
          }
        },
      }),
      notes_list: tool({
        description: "List the pending tab notes for the current session.",
        args: {
          include_done: tool.schema.boolean().optional().describe("Also list completed notes."),
        },
        async execute({ include_done }, context) {
          const all = store.list(context.sessionID, false)
          const pending = all.filter((note) => !note.done)
          const done = all.filter((note) => note.done)
          if (!include_done) {
            if (pending.length === 0)
              return `No pending tab notes for this session${done.length ? ` (${done.length} completed)` : ""}.`
            return `Tab notes (${pending.length} pending):\n${pending.map((n) => `[${n.id}] ${n.text}`).join("\n")}`
          }
          const lines = all.map((n) => `[${n.id}]${n.done ? " ✓ done" : ""} ${n.text}`)
          if (lines.length === 0) return "No tab notes for this session."
          return `Tab notes (${pending.length} pending, ${done.length} done):\n${lines.join("\n")}`
        },
      }),
      notes_mark_done: tool({
        description:
          "Mark a tab note as done so it stops being injected into future runs of this session. Call this once you have acted on the note.",
        args: {
          id: tool.schema.string().describe("The note id shown in brackets, e.g. [abc123]."),
        },
        async execute({ id }, context) {
          const note = store.markDone(context.sessionID, id.trim())
          if (!note) return `Note [${id}] not found in this session. Use notes_list to see valid ids.`
          return `Marked note [${id}] as done.`
        },
      }),
      notes_clear: tool({
        description: "Remove all tab notes for the current session.",
        args: {},
        async execute(_args, context) {
          const count = store.clear(context.sessionID)
          return count === 0
            ? "This session has no tab notes to clear."
            : `Cleared ${count} tab note(s) for this session.`
        },
      }),
    },

    "chat.message": async ({ sessionID }, { parts }) => {
      const first = parts.find(
        (part): part is Extract<(typeof parts)[number], { type: "text" }> =>
          part.type === "text" && typeof part.text === "string" && part.text.trim() !== "",
      )
      if (!first) return
      const match = first.text.match(markerPattern)
      if (!match) return
      const noteText = (match[1] ?? "").trim()
      if (!noteText) return
      const note = store.add(sessionID, noteText)
      const reworded = `[Tab note recorded] Stored as [${note.id}]: "${truncate(noteText, 120)}". No further action needed.`
      const kept: typeof parts = []
      let replaced = false
      for (const part of parts) {
        if (!replaced && part.type === "text") {
          kept.push({ ...part, text: reworded } as (typeof parts)[number])
          replaced = true
        } else if (part.type !== "text") {
          kept.push(part)
        }
      }
      parts.splice(0, parts.length, ...kept)
    },

    "experimental.chat.system.transform": async ({ sessionID }, { system }) => {
      const notes = store.list(sessionID ?? "", true)
      if (notes.length === 0) return
      const block = [
        `## Tab notes for this session (${notes.length} pending)`,
        ...notes.slice(0, maxNotes).map((note) => `- [${note.id}] ${truncate(note.text, 300)}`),
        "The user wrote these while you were busy. Address them when the current task is complete or when relevant, then mark each one done with notes_mark_done(id=...).",
      ].join("\n")
      system.push(block)
    },
  }
}) satisfies Plugin
