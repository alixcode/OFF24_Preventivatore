# OFF24 — Preventivatore Commesse
## Istruzioni per Claude Code

---

## 1. CONTESTO PRODOTTO

Sistema SaaS B2B per la generazione e gestione di preventivi in contesti di
carpenteria metallica tailor-made (officine meccaniche, carpenterie metalliche).
Trasforma richieste vaghe (verbali, foto, schizzi) in stime economiche
difendibili, con controllo margini e apprendimento da consuntivi reali.

**Cliente di riferimento:** Officina24 Srl — https://officina24srl.eu  
**Utenti target:** personale operativo di officina, titolari, commerciali.  
**Obiettivo UX:** preventivo completo in meno di 5 minuti (modalità rapida).

---

## 2. STACK TECNICO

| Layer      | Tecnologia scelta                        |
|------------|------------------------------------------|
| Frontend   | Next.js 14 (App Router) + TypeScript     |
| UI         | Tailwind CSS + shadcn/ui                 |
| Backend    | Node.js + Express (service layer chiaro) |
| Database   | PostgreSQL (Prisma ORM)                  |
| Auth       | JWT (NextAuth.js)                        |
| PDF        | React-PDF o Puppeteer                    |
| Upload     | Multer + storage locale (S3-ready)       |
| Deploy     | Vercel (frontend) + Railway (backend/db) |

**Regole stack:**
- Niente overengineering — pragmatico e vendibile
- Codice sempre commentato in italiano
- Separare sempre business logic in service layer
- Multi-tenant dal giorno 1 (company_id su ogni tabella)

---

## 3. ARCHITETTURA CARTELLE

```
OFF24_Preventivatore/
├── frontend/                  # Next.js app
│   ├── app/
│   │   ├── (auth)/            # login, register
│   │   ├── (dashboard)/       # area protetta
│   │   │   ├── preventivi/
│   │   │   ├── commesse/
│   │   │   ├── materiali/
│   │   │   ├── fornitori/
│   │   │   └── impostazioni/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn components
│   │   ├── preventivo/        # wizard steps
│   │   ├── dashboard/         # KPI cards, charts
│   │   └── shared/            # navbar, sidebar, forms
│   └── lib/
│       ├── api.ts             # client API calls
│       ├── utils.ts
│       └── types.ts           # tipi TypeScript condivisi
│
├── backend/
│   ├── src/
│   │   ├── routes/            # endpoint REST
│   │   ├── services/          # business logic
│   │   ├── middleware/        # auth, validation, logging
│   │   ├── models/            # Prisma schema
│   │   └── utils/
│   └── prisma/
│       └── schema.prisma
│
└── CLAUDE.md                  # questo file
```

---

## 4. MODULI DA SVILUPPARE (in ordine di priorità)

### P1 — Core (sviluppare per primo)
1. **Auth** — login/register, JWT, multi-tenant
2. **Wizard preventivo** — 5 step guidati
3. **Motore costi** — calcolo materiali + manodopera + overhead
4. **Output PDF** — versione cliente pulita

### P2 — Gestione
5. **Listino materiali** — con storico prezzi e alert scadenza
6. **Gestione fornitori** — richieste prezzi, stato, validità
7. **Versionamento preventivi** — V1, V2, V3 con diff

### P3 — Controllo e apprendimento
8. **Motore rischio** — coefficiente automatico
9. **Consuntivo commessa** — ore reali vs stimate
10. **Storico e suggerimenti** — autofill da lavori simili
11. **Dashboard KPI** — margini, scostamenti, trend

---

## 5. SCHEMA DATABASE (tabelle principali)

```sql
companies        -- multi-tenant root
users            -- con company_id e ruolo
clients          -- anagrafica clienti
quotes           -- preventivi (header)
quote_versions   -- V1, V2, V3...
quote_items      -- righe preventivo
materials        -- listino materiali
material_prices  -- storico prezzi con data validità
suppliers        -- fornitori
supplier_quotes  -- offerte ricevute da fornitori
operations       -- lavorazioni (taglio, saldatura, piega...)
cost_rates       -- tariffe manodopera e macchine
overhead_settings -- coefficienti aziendali per tenant
risk_rules       -- regole motore rischio
approvals        -- workflow approvativo
jobs             -- commesse aperte
job_actuals      -- consuntivi reali
attachments      -- file, foto, disegni
```

**Regola:** ogni tabella ha sempre `company_id`, `created_at`, `updated_at`.

---

## 6. API PRINCIPALI

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/quotes
POST   /api/quotes
GET    /api/quotes/:id
PUT    /api/quotes/:id
POST   /api/quotes/:id/version       -- crea nuova versione
GET    /api/quotes/:id/pdf           -- genera PDF

GET    /api/materials
POST   /api/materials
PUT    /api/materials/:id/price      -- aggiorna prezzo

GET    /api/suppliers
POST   /api/supplier-quotes          -- richiesta prezzo

GET    /api/jobs/:id/actuals         -- consuntivo
POST   /api/jobs/:id/actuals

GET    /api/dashboard/kpi
GET    /api/quotes/suggest?similar=  -- suggerimenti da storico
```

---

## 7. LOGICA DI CALCOLO (motore costi)

```
COSTO_TOTALE =
  Σ(materiali × quantità × prezzo_unitario)
  + Σ(ore_manodopera × tariffa_oraria × coefficiente_fase)
  + Σ(ore_macchina × costo_macchina)
  + costi_esterni (zincatura, trasporto, verniciatura)
  + consumabili (% su ore lavorazione)
  + overhead (COSTO_TOTALE × coefficiente_overhead)

COEFFICIENTE_RISCHIO =
  base 0%
  + 15% se mancano disegni tecnici
  + 10% se input verbale/foto
  + 10% se urgenza alta
  + 5%  se cliente nuovo
  + 10% se prevista posa in opera
  + 5%  per ogni dimensione stimata (non misurata)
  MAX: 50%

PREZZO_MINIMO    = COSTO_TOTALE / (1 - margine_minimo)
PREZZO_TECNICO   = COSTO_TOTALE × (1 + margine_target)
PREZZO_CONSIGLIATO = PREZZO_TECNICO × (1 + COEFFICIENTE_RISCHIO)
PREZZO_VALORE    = valutazione commerciale (manuale override)

INDICE_AFFIDABILITA (0-100) =
  100 - (COEFFICIENTE_RISCHIO × 2) - penalità_input_mancanti
```

---

## 8. REGOLE DI SVILUPPO

- **NON** modificare lo schema del database senza mostrare la migration prima
- **NON** toccare il sistema di autenticazione senza approvazione esplicita
- **SEMPRE** aggiungere validazione input lato backend (zod o joi)
- **SEMPRE** gestire errori con try/catch e risposta JSON strutturata
- **SEMPRE** usare transazioni Prisma per operazioni multi-tabella
- Commenti in **italiano**, codice in **inglese** (variabili, funzioni)
- Ogni nuovo endpoint deve avere il middleware auth applicato

---

## 9. DESIGN SYSTEM — Brand Officina24

### Palette colori
```css
--bg-primary:    #0d141a;   /* nero blu — sfondo principale */
--bg-secondary:  #1d1e20;   /* grafite — card, sidebar */
--bg-tertiary:   #211e1b;   /* bruno scuro — sezioni alternate */
--accent:        #cc6333;   /* arancio ruggine — CTA, highlight */
--accent-light:  #ffeacc;   /* crema — testo su accent */
--text-primary:  #ffffff;   /* bianco — titoli su scuro */
--text-secondary:#56585e;   /* grigio — testo secondario */
--text-dark:     #1d1e20;   /* quasi nero — testo su chiaro */
--border:        rgba(255,255,255,0.08);
```

### Tipografia
```
Titoli (H1–H5): "Playfair Display" — serif, elegante, industriale
Body / UI:      "DM Sans" — sans-serif, leggibile, moderno

H1: 96px / 120px  — hero, pagine di presentazione
H3: 64px / 80px   — titoli sezione
H5: 40px / 50px   — titoli card importanti
H6: 28px / 35px   — label sezioni, sottotitoli
Body: 16px / normal
```

Google Fonts import:
```
https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;700&display=swap
```

### Componenti UI — stile
- Sfondi scuri come base (`#0d141a` / `#1d1e20`)
- Card con bordi sottili `rgba(255,255,255,0.08)`, border-radius 4px
- CTA primario: background `#cc6333`, testo `#ffffff`, hover `#b5522a`
- CTA secondario: border `#cc6333`, testo `#cc6333`, background trasparente
- Input: background `rgba(255,255,255,0.05)`, border `rgba(255,255,255,0.15)`
- Focus: border `#cc6333`
- Tabelle: righe alternate `#1d1e20` / `#211e1b`
- Badge stato preventivo: colori semantici su base scura
- Niente border-radius > 6px — stile industriale, non arrotondato

### Tono visivo generale
Industriale, solido, professionale. Ispirato all'estetica della
carpenteria metallica: scuro, preciso, con l'accento arancio ruggine
come unico colore caldo. Niente gradienti pastello o stili SaaS
generici. Deve sembrare uno strumento da officina, non una startup.

---

## 10. STATO AVANZAMENTO

- [x] Setup progetto — monorepo pnpm, Next.js 14, Express, package shared
- [x] Schema Prisma completo (14 tabelle) + seed Officina24
- [x] Auth JWT — login/register, middleware, ruoli (admin/commerciale/operativo)
- [x] Design system Tailwind — palette brand, componenti base, layout sidebar
- [x] Struttura routing Next.js App Router + dashboard scaffold
- [x] Motore rischio — `calculateRisk()` nel package shared (frontend + backend)
- [x] Motore costi — `calculateCosts()` e `calculatePrices()` in shared (frontend + backend)
- [x] API REST — /auth, /quotes, /materials, /clients, /dashboard/kpi
- [x] Wizard preventivo (step 1-5) — UI React interattiva con calcolo live
- [ ] Output PDF — Puppeteer
- [ ] Listino materiali — pagina frontend con aggiornamento prezzi
- [ ] Gestione fornitori
- [ ] Versionamento preventivi — UI diff V1/V2
- [ ] Consuntivo commessa
- [ ] Dashboard KPI — collegamento API reale
- [ ] Storico e suggerimenti AI

---

*Aggiorna la checklist man mano che i moduli vengono completati.*
