#!/bin/sh
# tab-note installer for opencode (global scope)
#   ./install.sh            copy plugin + command into ~/.config/opencode
#   ./install.sh --force    overwrite existing files
#   ./install.sh uninstall  remove files installed by this script
set -eu

SRC_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PLUGIN_SRC="$SRC_DIR/src/tab-note.ts"
COMMAND_SRC="$SRC_DIR/commands/note.md"

OPENCODE_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
PLUGIN_DST="$OPENCODE_CONFIG_DIR/plugins/tab-note.ts"
COMMAND_DST="$OPENCODE_CONFIG_DIR/commands/note.md"

FORCE=0
MODE=install
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    uninstall) MODE=uninstall ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

if [ "$MODE" = "uninstall" ]; then
  rm -f -- "$PLUGIN_DST" "$COMMAND_DST"
  echo "Removed:"
  echo "  $PLUGIN_DST"
  echo "  $COMMAND_DST"
  echo "Note: notes already stored under ~/.local/share/opencode/tab-note are kept."
  exit 0
fi

copy_file() {
  src=$1
  dst=$2
  if [ -e "$dst" ]; then
    if [ "$FORCE" = "1" ]; then
      cp -- "$src" "$dst"
      echo "Overwrote $dst"
    else
      echo "Skipped  $dst (already exists; use --force to overwrite)"
    fi
  else
    cp -- "$src" "$dst"
    echo "Installed $dst"
  fi
}

mkdir -p "$OPENCODE_CONFIG_DIR/plugins" "$OPENCODE_CONFIG_DIR/commands"
copy_file "$PLUGIN_SRC" "$PLUGIN_DST"
copy_file "$COMMAND_SRC" "$COMMAND_DST"

# Ensure the config directory declares the runtime dependency so opencode can
# resolve `@opencode-ai/plugin` for the plugin (opencode auto-installs config deps).
if command -v node >/dev/null 2>&1; then
  node - "$OPENCODE_CONFIG_DIR/package.json" <<'EOF'
const fs = require("fs")
const file = process.argv[2]
const exists = fs.existsSync(file)
let pkg = {}
try { if (exists) pkg = JSON.parse(fs.readFileSync(file, "utf8")) } catch {}
pkg.dependencies = pkg.dependencies || {}
pkg.dependencies["@opencode-ai/plugin"] = pkg.dependencies["@opencode-ai/plugin"] || "1.18.15"
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n")
console.log("Ensured dependency @opencode-ai/plugin in " + file)
EOF
else
  echo "Warning: node not found; add '@opencode-ai/plugin' to $OPENCODE_CONFIG_DIR/package.json manually." >&2
fi

# Best-effort: make sure the dependency is actually installed.
if [ ! -d "$OPENCODE_CONFIG_DIR/node_modules/@opencode-ai/plugin" ]; then
  if command -v npm >/dev/null 2>&1; then
    echo "Installing config dependencies with npm..."
    (cd "$OPENCODE_CONFIG_DIR" && npm install --no-audit --no-fund)
  else
    echo "Warning: @opencode-ai/plugin not installed in $OPENCODE_CONFIG_DIR; opencode will try to install it on startup." >&2
  fi
fi

echo
echo "Done. Restart opencode for the plugin to load."
echo
echo "Usage in a tab:"
echo "  /note add <text>   store a reminder for the next run"
echo "  /note list         list pending notes"
echo "  /note done <id>    mark a note done"
echo "  /note clear        remove all notes for this tab"
echo
echo "Or start a prompt with 'note:' (or 'notes:', '\u270e', '\u270d') to record a note."
echo "Notes are stored per session in ~/.local/share/opencode/tab-note/notes.json."
