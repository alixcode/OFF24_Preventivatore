# OFF24 Preventivatore

Sistema SaaS B2B per la generazione e gestione di preventivi in carpenteria metallica.
Trasforma richieste vaghe (verbali, foto, schizzi) in stime economiche difendibili,
con controllo margini e consuntivo commesse.

**Cliente pilota:** Officina24 Srl

---

## Stack

| Layer    | Tecnologia                           |
|----------|--------------------------------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI       | Tailwind CSS                         |
| Backend  | Node.js + Express                    |
| Database | PostgreSQL + Prisma ORM              |
| Auth     | JWT                                  |
| PDF      | Puppeteer                            |

---

## Avvio in locale

### Prerequisiti

- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm install -g pnpm`
- [Git](https://git-scm.com)
- PostgreSQL 15+ oppure Docker

### 1. Clona il repository

```bash
git clone https://github.com/alixcode/OFF24_Preventivatore.git
cd OFF24_Preventivatore
pnpm install
```

### 2. Avvia PostgreSQL (con Docker)

```bash
docker run -d \
  --name off24-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=off24 \
  -p 5432:5432 \
  postgres:16
```

Se hai già PostgreSQL installato, crea manualmente il database `off24`.

### 3. Configura le variabili d'ambiente

Crea il file `packages/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/off24"
JWT_SECRET="off24-dev-secret-cambia-in-prod"
FRONTEND_URL="http://localhost:3000"
```

### 4. Inizializza il database

```bash
pnpm db:migrate   # crea le tabelle
pnpm db:seed      # inserisce Officina24 + dati di esempio
```

### 5. Avvia frontend e backend

```bash
pnpm dev
```

- Frontend → http://localhost:3000
- Backend → http://localhost:3001/api/health

### 6. Login

| Campo    | Valore                             |
|----------|------------------------------------|
| Email    | alice.brocca@axeleragovernance.com |
| Password | password123                        |

---

## Comandi utili

```bash
pnpm dev            # avvia frontend + backend in parallelo
pnpm build          # build di produzione
pnpm db:migrate     # applica le migration Prisma
pnpm db:seed        # popola il database con dati di esempio
pnpm db:studio      # apre Prisma Studio (GUI database)
pnpm db:generate    # rigenera il client Prisma dopo modifiche allo schema
```

---

## Struttura del progetto

```
OFF24_Preventivatore/
├── packages/
│   ├── shared/        # tipi e motori di calcolo condivisi (rischio, costi, prezzi)
│   ├── backend/       # API REST Express + Prisma
│   │   └── prisma/    # schema database e seed
│   └── frontend/      # Next.js 14 App Router
│       └── src/app/
│           ├── (auth)/          # login
│           └── (app)/           # area protetta
│               ├── dashboard/
│               ├── preventivi/  # lista, dettaglio, wizard nuovo preventivo
│               ├── commesse/    # lista, dettaglio con consuntivo
│               └── materiali/   # listino prezzi
└── README.md
```

---

## Funzionalità implementate

- **Wizard preventivo** — 5 step guidati (qualificazione cliente, configuratore, materiali/lavorazioni, prezzi, revisione e PDF)
- **Motore rischio** — coefficiente automatico basato su livello di dettaglio, urgenza, cliente nuovo, dimensioni stimate
- **Motore costi** — calcolo materiali + manodopera + costi esterni + overhead
- **Output PDF** — documento A4 brand Officina24, scaricabile direttamente dal wizard
- **Listino materiali** — con alert prezzi scaduti e aggiornamento inline
- **Gestione preventivi** — lista paginata, filtro per stato, dettaglio con versionamento (Rev.1/Rev.2...)
- **Commesse** — creazione da preventivo approvato, workflow stati, inserimento voci consuntivo, confronto budget vs reale
