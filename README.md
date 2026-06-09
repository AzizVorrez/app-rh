# IZICHANGE · Enquête d'engagement

Plateforme d'enquête d'engagement des collaborateurs — **Next.js 15 + PostgreSQL**, prête pour la
production sur **Vercel**. Design premium « dark glass », questionnaire 100 % configurable depuis
l'espace RH, tableau de bord analytique et exports Excel / PDF.

![stack](https://img.shields.io/badge/Next.js-15-black) ![db](https://img.shields.io/badge/PostgreSQL-Drizzle-blue)

---

## ✨ Fonctionnalités

**Côté collaborateur** (`/`)
- Questionnaire dynamique multi-formats : ressenti emoji, échelle 1–5, choix unique/multiple, NPS 0–10, réponse libre.
- Progression animée, design responsive, 100 % confidentiel.

**Espace RH** (`/admin`, protégé par mot de passe)
- KPIs : nb de réponses, score global, eNPS, ressenti dominant, promoteurs / détracteurs.
- Scores par thématique, répartition par département, ressenti, top motivations.
- **Recommandations** générées automatiquement à partir des scores.
- Réponses libres et tableau **par collaborateur** (avec suppression unitaire).
- **Exports Excel & PDF.**
- **Paramètres entièrement éditables** :
  - Départements (ajout / renommage / activation / suppression)
  - Thématiques notées
  - **Questions** (ajout / édition / réordonnancement / type / options / obligatoire / suppression)
  - Titre, année, intro, ouverture/fermeture de l'enquête
  - Lien de partage, changement de mot de passe, purge des données.

---

## 🧱 Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 · TypeScript |
| Base de données | PostgreSQL via **Drizzle ORM** (`postgres-js`) |
| Auth RH | Mot de passe (bcrypt) + session JWT `jose` en cookie **httpOnly** |
| UI | Tailwind CSS · Framer Motion · Recharts · lucide-react |
| Exports | SheetJS (Excel) · impression navigateur (PDF) |

---

## 🚀 Démarrage local

### 1. Base de données
Créez une base PostgreSQL. **[Neon](https://neon.tech)** est recommandé (gratuit, intégré à Vercel).
Récupérez la **connection string poolée**.

### 2. Variables d'environnement
```bash
cp .env.example .env.local
```
Renseignez dans `.env.local` :
```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
ADMIN_PASSWORD="votre-mot-de-passe-rh"          # mot de passe RH initial
SESSION_SECRET="$(openssl rand -base64 48)"      # secret de session (≥ 32 car.)
```

### 3. Installation & initialisation
```bash
npm install
npm run db:setup     # crée les tables (drizzle-kit push) puis insère départements, thématiques, 27 questions
```

### 4. Lancer
```bash
npm run dev
```
- Questionnaire : <http://localhost:3000>
- Espace RH : <http://localhost:3000/admin> (mot de passe = `ADMIN_PASSWORD`)

---

## ☁️ Déploiement sur Vercel

1. **Poussez le code sur GitHub.**
2. Sur Vercel → **New Project** → importez le dépôt (framework détecté : Next.js).
3. **Settings → Environment Variables**, ajoutez :
   - `DATABASE_URL` (chaîne poolée)
   - `SESSION_SECRET`
   - `ADMIN_PASSWORD`
4. **Initialisez le schéma une seule fois** (depuis votre machine, pointant vers la base de prod) :
   ```bash
   DATABASE_URL="<chaîne-de-prod>" npm run db:setup
   ```
   > Astuce : avec l'intégration **Vercel + Neon**, la variable `DATABASE_URL` est ajoutée
   > automatiquement ; copiez-la localement le temps d'exécuter `db:setup`.
5. **Deploy.** 🎉

> ⚠️ Après le premier déploiement, **changez le mot de passe RH** depuis _Paramètres → Mot de passe RH_
> (il est alors stocké hashé en base et `ADMIN_PASSWORD` n'est plus utilisé).

---

## 🗄️ Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `start` | Build & run production |
| `npm run db:push` | Synchronise le schéma Drizzle vers la base |
| `npm run db:seed` | Insère les données initiales (idempotent) |
| `npm run db:setup` | `db:push` + `db:seed` |
| `npm run db:studio` | Explorateur de base Drizzle Studio |

---

## 🧩 Modèle de données

`departments` · `themes` · `questions` · `responses` · `answers` · `settings`

Le questionnaire est **piloté par la base** : chaque question porte un `type`, des `options`, un
rattachement éventuel à une `theme` (pour le score) et un ordre. Le tableau de bord agrège
dynamiquement les réponses — ajouter/retirer une question ou une thématique recalcule automatiquement
les scores, les exports et les recommandations.

## 🔐 Sécurité

- Routes `/admin/*` protégées par middleware (vérification JWT en edge).
- Toutes les routes `/api/admin/*` re-vérifient la session côté serveur.
- Mot de passe stocké **hashé** (bcrypt) ; session signée en cookie `httpOnly` / `secure` / `sameSite=lax`.
- Définissez impérativement un `SESSION_SECRET` fort en production.
