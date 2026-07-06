# Daily Games Overview

Compara jogos do Flashscore e 365Scores, com UI web, integração Asana e lembretes Telegram.

## Requisitos

- Node.js 18+
- Playwright (instalado via `npm install`)

## Setup em uma máquina nova

```bash
git clone https://github.com/gbalassiano-lgtm/Cursor-verison-2.git
cd Cursor-verison-2
npm install
npx playwright install chromium
cp .env.example .env
# Edite .env com seus tokens (Asana, Telegram, etc.)
npm run dev
```

Abra `http://localhost:3000` (ou a porta definida em `PORT`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Sobe o servidor web |
| `npm run scan` | Executa todos os scrapers |
| `npm run import:365-catalogs` | Importa catálogos de competições 365 |

## Sincronizar entre máquinas

```bash
git pull          # antes de editar
# ... editar arquivos ...
git add .
git commit -m "descrição da alteração"
git push
```

Na outra máquina: `git pull`.

## Arquivos que não vão para o Git

- `.env` — tokens e segredos (copie manualmente para cada máquina)
- `node_modules/` — rode `npm install` em cada máquina
- `output/` — dados gerados pelos scans
- `db/*.json` — cache local
