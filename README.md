# Session-note

> Session-note Context & Notes Plugin for OpenCode

[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-Plugin-blueviolet.svg)](https://github.com/mydigi-code/session-notes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org)

**Session-note** è un plugin di produttività essenziale per **OpenCode** che porta memoria persistente per-tab alle tue sessioni di coding con AI. Metti facilmente in coda reminder, compiti e note per la prossima esecuzione della sessione, anche mentre l'agente OpenCode è attivamente in esecuzione.

## 🎯 Il Problema & La Soluzione

Quando lavori con tool di coding con AI come OpenCode, i compiti a lunga esecuzione possono impedirti di dare al agente la tua prossima istruzione, o il contesto si perde tra i riavvii della sessione.

**Session-note** risolve questo creando una coda di note dedicata per tab:

- **Non interrompere mai il flusso di lavoro:** Aggiungi note mentre l'agente è occupato
- **Zero Perdita di Contesto:** Le note persistono tra i riavvii della sessione e vengono automaticamente iniettate nel prompt di sistema dell'LLM
- **Automazione Trasparente:** L'agente agisce automaticamente sulle note in sospeso non appena l'esecuzione corrente termina

## ✨ Caratteristiche Principali

- 📌 **Isolamento Per-Tab** — Ogni sessione/tab OpenCode gestisce la propria lista di note indipendente
- 🔄 **Iniezione di Contesto Automatica** — Le note in sospeso vengono dinamicamente iniettate nel prompt di sistema ad ogni esecuzione usando i hook di OpenCode
- 📥 **Queueing dei Compiti** — Metti in coda i compiti mentre OpenCode è occupato senza interrompere l'esecuzione corrente
- ⚡ **Zero Dipendenze** — Integrazione pura TypeScript/Node.js che scrive rigorosamente dentro `~/.config/opencode` e `~/.local/share/opencode/Session-note`

## 🚀 Installazione

Installa globalmente nella tua directory di configurazione di OpenCode con un unico comando:

```bash
./install.sh
```

> **Nota:** Richiede solo node/npm (oppure l'auto-installer interno di OpenCode). Nessun virtual environment o pacchetti di sistema esterni necessari.

### Opzioni di Installazione

```bash
# Upgrade / Overwrite
./install.sh --force

# Disinstalla
./install.sh uninstall
```

Dopo l'installazione, riavvia OpenCode per caricare il plugin.

## 💡 Modalità di Utilizzo

Ci sono tre modi per mettere in coda note per la tua sessione OpenCode:

### 1. Slash Commands (Migliore per Queueing Mentre Occupato)

Digita i comandi slash direttamente nell'input della chat. Se l'agente sta attualmente lavorando, il comando viene messo in coda ed eseguito immediatamente dopo l'esecuzione:

```bash
/note add fix the login redirect issue
/note list
/note done ab1cd2
/note clear
```

### 2. Prompt Markers (Note In-line Veloci)

Prefissa qualsiasi messaggio con un marker (`note:`, `notes:`, `✎`, `✍`). Il plugin intercetta il prompt, archivia la nota e impedisce all'agente di trattarla come un turno di compito completo:

```
note: refactor the auth middleware after you finish
```

### 3. Direct Agent Tooling (Conversazionale)

Parla direttamente all'agente durante la conversazione:

```
"Remember to bump the version in package.json before committing."
```

L'agente utilizza lo strumento nativo `notes_add` per persistere la nota per la prossima esecuzione.

## 🛠️ Architettura Tecnica & Come Funziona

### Storage

Le note vengono salvate come JSON in `~/.local/share/opencode/Session-note/notes.json` indicizzate per `sessionID`.

### System Transform Hook

Utilizza `experimental.chat.system.transform` per aggiungere un blocco compatto `## Tab notes` ad ogni richiesta di sessione (limitato a 20 note, max 300 caratteri ciascuno).

### Hooks & Tools

Ascolta l'hook `chat.message` ed espone tool LLM nativi:
- `notes_add`
- `notes_list`
- `notes_mark_done`
- `notes_clear`

## ⚙️ Configurazione Personalizzata

Puoi configurare le opzioni nel tuo `opencode.json` nella tupla del plugin:

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

### Opzioni di Configurazione

| Opzione | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `dir` | string | `~/.local/share/opencode/Session-note` | Percorso assoluto personalizzato per l'archiviazione |
| `marker` | string | `note:` | Prefisso marker per le note in-line |
| `max_notes` | number | `20` | Numero massimo di note da iniettare nel prompt |

## ⚠️ Limitazioni Conosciute

- **Model Turns:** I comandi `/note` e marker consumano un turno minore del modello a causa del design dell'API del plugin di OpenCode (prevenzione di risposte duplicate vuote)

- **Prefix Matching:** L'intercettazione del marker si attiva solo se il messaggio inizia con il prefisso designato (es. `note:`). Le occorrenze a metà frase vengono ignorate

## 👨‍💻 Sviluppo & Contributi

### Setup dello Sviluppo

```bash
# Installa le dipendenze di sviluppo
npm install

# Esegui il typecheck di TypeScript
npm run typecheck
```

### Contribuire

Le pull request sono benvenute! Per cambiamenti importanti, apri prima un issue per discussione.

## 📦 Publishing

Per pubblicare un aggiornamento pubblico su npm:

1. Assicurati che `"private": true` sia rimosso da `package.json`

2. Autentica e pubblica:

```bash
npm login
npm publish
```

## 📄 Licenza

Distribuito sotto la Licenza MIT. Vedi [LICENSE](LICENSE) per maggiori informazioni.

---

## 📚 Risorse

- [Documentazione di OpenCode](https://opencode.ai)
- [Repository GitHub](https://github.com/mydigi-code/session-notes)
- [Node.js Documentation](https://nodejs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 💬 Supporto

Se riscontri problemi o hai domande, apri un [issue su GitHub](https://github.com/mydigi-code/session-notes/issues).
