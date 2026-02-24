# 🤿 Centro Sub — Gestionale

Applicazione web per la gestione di un centro sub: soci, brevetti e log ricariche compressore.

## Stack
- **Next.js 14** (App Router + Server Components)
- **Supabase** (database + autenticazione)
- **Tailwind CSS** + design system ocean
- **TypeScript**

## Setup locale

### 1. Clona il repository
```bash
git clone https://github.com/TUO_USERNAME/centro-sub.git
cd centro-sub
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configura le variabili d'ambiente
```bash
cp .env.example .env.local
```
Apri `.env.local` e inserisci le credenziali Supabase:
- Vai su [Supabase Dashboard](https://supabase.com) → tuo progetto → Settings → API
- Copia `Project URL` e `anon public key`

### 4. Avvia il server di sviluppo
```bash
npm run dev
```
Apri [http://localhost:3000](http://localhost:3000)

## Deploy su Vercel

1. Pusha il progetto su GitHub
2. Vai su [vercel.com](https://vercel.com) → "Add New Project"
3. Importa il repository GitHub
4. In **Environment Variables** aggiungi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy** → fatto!

Ogni push su `main` triggera un deploy automatico.

## Struttura progetto

```
app/
├── login/          → pagina di accesso
├── (app)/
│   ├── dashboard/  → statistiche e riepilogo
│   ├── soci/       → gestione soci e brevetti
│   └── compressore/→ log ricariche compressore
components/
├── Sidebar.tsx     → navigazione laterale
lib/
└── supabase/
    ├── client.ts   → client browser
    └── server.ts   → client server (SSR)
types/
└── database.ts     → tipi TypeScript dal DB
```

## Tabelle Supabase utilizzate

| Tabella | Descrizione |
|---------|-------------|
| `BP_soci` | Anagrafica soci |
| `UT_Brevetti` | Lookup brevetti |
| `UT_TipoSocio` | Lookup tipi socio |
| `AT_RicaricheCompressore` | Log ricariche |
