# Session-note

> Session-note Context & Notes Plugin for OpenCode

[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-blueviolet.svg)](https://github.com/mydigi-code/session-notes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org)

**Session-note** is an essential productivity plugin for **OpenCode** that brings persistent, per-tab memory to your AI coding sessions. Easily queue reminders, tasks, and notes for your next session run—even while the OpenCode agent is actively executing.

## 🎯 The Problem & The Solution

When working with AI coding tools like OpenCode, long-running tasks can prevent you from giving the agent your next instruction, or context gets lost between session restarts.

**Session-note** solves this by creating a dedicated note queue per tab:

- **Never interrupt your workflow:** Add notes while the agent is busy
- **Zero Context Loss:** Notes persist across session restarts and are automatically injected into the LLM system prompt
- **Seamless Automation:** The agent automatically acts on pending notes as soon as the current run finishes

## ✨ Key Features

- 📌 **Per-Tab Isolation** — Each OpenCode session/tab manages its own independent note list
- 🔄 **Automatic Context Injection** — Pending notes are dynamically injected into the system prompt on every run using OpenCode hooks
- 📥 **Task Queueing** — Queue tasks while OpenCode is busy without interrupting current execution
- ⚡ **Zero Dependencies** — Pure TypeScript/Node.js integration writing strictly inside `~/.config/opencode` and `~/.local/share/opencode/Session-note`

## 🚀 Installation

Install globally into your OpenCode configuration directory with a single command:

```bash
./install.sh
```

> **Note:** Requires only node/npm (or OpenCode's internal auto-installer). No virtual environments or external system packages required.

### Installation Options

```bash
# Upgrade / Overwrite
./install.sh --force

# Uninstall
./install.sh uninstall
```

After installation, restart OpenCode to load the plugin.

## 💡 Usage Modes

There are three ways to queue notes for your OpenCode session:

### 1. Slash Commands (Best for Queueing While Busy)

Type slash commands directly in the chat input. If the agent is currently working, the command is queued and executed immediately after the run:

```bash
/note add fix the login redirect issue
/note list
/note done ab1cd2
/note clear
```

### 2. Prompt Markers (Quick In-line Notes)

Prefix any message with a marker (`note:`, `notes:`, `✎`, `✍`). The plugin intercepts the prompt, stores the note, and prevents the agent from treating it as a full task turn:

```
note: refactor the auth middleware after you finish
```

### 3. Direct Agent Tooling (Conversational)

Tell the agent directly during conversation:

```
"Remember to bump the version in package.json before committing."
```

The agent uses the built-in `notes_add` tool to persist it for the next run.

## 🛠️ Technical Architecture & How It Works

### Storage

Notes are saved as JSON at `~/.local/share/opencode/Session-note/notes.json` keyed by `sessionID`.

### System Transform Hook

Uses `experimental.chat.system.transform` to append a compact `## Tab notes` block to every session request (capped at 20 notes, max 300 characters each).

### Hooks & Tools

Listens on the `chat.message` hook and exposes native LLM tools:
- `notes_add`
- `notes_list`
- `notes_mark_done`
- `notes_clear`

## ⚙️ Custom Configuration

You can configure options in your `opencode.json` plugin tuple:

```json
{
  "plugin": [
    [
      "Session-note",
      {
        "dir": "/custom/abs/path",
        "marker": "todo:",
        "max_notes": 10
      }
    ]
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dir` | string | `~/.local/share/opencode/Session-note` | Custom absolute path for storage |
| `marker` | string | `note:` | Prefix marker for in-line notes |
| `max_notes` | number | `20` | Maximum number of notes to inject into the prompt |

## ⚠️ Known Limitations

- **Model Turns:** `/note` commands and markers consume a minor model turn due to OpenCode's plugin API design (preventing empty duplicate replies)

- **Prefix Matching:** Marker interception only triggers if the message starts with the designated prefix (e.g., `note:`). Mid-sentence occurrences are ignored

## 👨‍💻 Development & Contributing

### Development Setup

```bash
# Install development dependencies
npm install

# Run TypeScript typecheck
npm run typecheck
```

### Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📦 Publishing

To publish a public update to npm:

1. Ensure `"private": true` is removed from `package.json`

2. Authenticate and publish:

```bash
npm login
npm publish
```

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 📚 Resources

- [OpenCode Documentation](https://opencode.ai)
- [GitHub Repository](https://github.com/mydigi-code/session-notes)
- [Node.js Documentation](https://nodejs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 💬 Support

If you encounter issues or have questions, please open an [issue on GitHub](https://github.com/mydigi-code/session-notes/issues).
