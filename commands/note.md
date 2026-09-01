---
description: Manage tab notes for this session (add <text>, list, done <id>, clear)
---

The user wants to manage TAB NOTES for the current session. Tab notes are short
reminders of work to do at the NEXT run of this session, often written while the
session was busy.

Handle this request using the tools below:

- `notes_add` — store a new note. `/note add <text>`
- `notes_list` — list pending notes. `/note list`
- `notes_mark_done` — mark a note as done once acted on. `/note done <id>`
- `notes_clear` — remove all notes for this session. `/note clear`

Request arguments: $ARGUMENTS

Rules:
- `add <text>` → call `notes_add(text="<text>")`.
- `list` or empty → call `notes_list()`.
- `done <id>` → call `notes_mark_done(id="<id>")`.
- `clear` → call `notes_clear()`.
- Only do what was requested. Reply briefly.
