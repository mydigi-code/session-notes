# tab-note — per-tab notes for opencode

<a href="https://opensource.org/licenses/MIT">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
</a>
<a href="https://nodejs.org">
  <img src="https://img.shields.io/badge/node.js-22+-green.svg" alt="Node.js 22+">
</a>
<a href="https://www.typescript-lang.org">
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue.svg" alt="TypeScript 5.6">
</a>

Write short reminders of work to do at the **next run** of a session, even while
that session is still busy working on a previous command.

## What it does

- Each session/tab has its own list of notes, persisted across restarts.
- Pending notes are automatically injected into the session context on every run,
  so the agent sees them and acts on them as soon as the current work allows.
- Three ways to add a note (see below); notes can be marked done once acted on.

## Install (global)

```sh
./install.sh          # copies plugin + /note command into ~/.config/opencode
```

Requires only `node`/`npm` (or opencode's own auto-install) — no venv, no system
packages. It writes only under `~/.config/opencode` and
`~/.local/share/opencode/tab-note`. Run `./install.sh --force` to overwrite on
upgrades, `./install.sh uninstall` to remove.

Then **quit and restart opencode** for the plugin to load.

## Usage

### 1. Slash command

```
/note add fix the login redirect
/note list
/note done ab1cd2
/note clear
```

Typed while a tab is busy, the desktop app **queues** the command and executes it
as soon as the current run finishes — your "note for the next run" flow.

### 2. Marker in a prompt

Start a normal message with `note:` (also `notes:`, `✎`, `✍`):

```
note: refactor the auth middleware after you finish
```

The marker text is stripped, stored as a tab note, and the agent only sees a
short confirmation instead of treating it as a task.

### 3. Ask the agent directly

During a run, just say e.g. "remember to bump the version before you commit" —
the agent stores it via the `notes_add` tool and it stays available for the next
run.

## How it works

- Storage: `~/.local/share/opencode/tab-note/notes.json`, keyed by `sessionID`.
- Injection: `experimental.chat.system.transform` appends a compact `## Tab notes`
  block to every request of the session (capped at 20 notes, 300 chars each).
- Tools: `notes_add`, `notes_list`, `notes_mark_done`, `notes_clear`.
- Marker capture: `chat.message` hook.

Options (plugin tuple form, e.g. in `opencode.json`):

```jsonc
{ "plugin": [["tab-note", { "dir": "/abs/path", "marker": "todo:", "max_notes": 10 }]] }
```

## Known limits

- `/note` and marker writes each consume one small model turn — opencode's plugin
  API does not allow suppressing a prompt turn entirely (emptying parts would
  cause a duplicate reply).
- The marker method only triggers when the message *starts* with the marker, so
  ordinary messages containing "note:" mid-sentence are unaffected.

## Development

```sh
npm install          # installs dev deps in this directory only
npm run typecheck    # tsc --noEmit
```

## Pubblicazione

Questo plugin può essere pubblicato in due modi principali:

### 1. GitHub (raccomandato per la community opencode)
- Push su un repo pubblico (es. `github.com/tuoutente/tab-note`).
- Apri una segnalazione o una discussione nella sezione **Ecosystem** del sito opencode o sul Discord.
- I mantainer possono linkare il plugin dalla docs ufficiale.

### 2. npm (pubblico)
- Rimuovi `"private": true` da `package.json` oppure cambia nome in `@tuoscope/tab-note` (se lo scope è disponibile).
- Esegui `npm login` e `npm publish`.
- Il `package.json` ha già `@opencode-ai/plugin` come devDep; gli utenti avranno bisogno di opencode con quel plugin installato (già il caso per l'istanza desktop).

#### Esempio `package.json` modificato per npm:
```json
{
  "name": "tab-note",                         // o "@tuocode/tab-note"
  "version": "0.1.0",
  "description": "Per-tab notes for opencode",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@opencode-ai/plugin": "1.18.15",
    "@types/node": "^22.10.0",
    "typescript": "^5.6.0"
  }
}
```
