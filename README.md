# Mentality Admin

Interface web d'administration clinique pour les psychiatres et psychologues partenaires de Mentality.

## Stack technique

- **React 18** + **TypeScript** (strict)
- **Vite** — bundler rapide
- **Tailwind CSS** — design médical sobre
- **Supabase** — authentification + base de données PostgreSQL
- **React Router v6** — navigation
- **React Hook Form** + **Zod** — formulaires validés
- **Recharts** — graphiques analytiques
- **@dnd-kit** — drag-and-drop pour le flow des tests

## Prérequis

- Node.js 18+
- npm 9+
- Un projet Supabase (créer sur [supabase.com](https://supabase.com))

## Installation

```bash
# Cloner le repo
git clone https://github.com/votre-org/mentality-admin.git
cd mentality-admin

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase
```

## Configuration

Éditez `.env` avec vos valeurs Supabase :

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=https://mentality-admin.pages.dev
```

## Initialisation de la base de données Supabase

Appliquez le schéma SQL dans le SQL Editor de votre projet Supabase :

```bash
# Option 1 — via Supabase Dashboard
# Ouvrez supabase/migrations/001_admin_schema.sql et collez le contenu
# dans Dashboard > SQL Editor > New query, puis Execute

# Option 2 — via CLI Supabase
supabase db push
```

Ensuite, créez votre premier compte admin directement dans Supabase Auth :
1. Dashboard > Authentication > Users > Invite user
2. Après inscription, dans la table `profiles`, passez le champ `role` à `'admin'`

## Développement local

```bash
npm run dev
# → http://localhost:5173
```

## Build de production

```bash
npm run build
# → dossier dist/ prêt à déployer
```

## Déploiement sur Cloudflare Pages

### Option 1 — Via GitHub (recommandé)

1. Pushez le repo sur GitHub
2. Dans Cloudflare Dashboard > Pages > Create a project
3. Connectez votre repo GitHub `mentality-admin`
4. Paramètres de build :
   - **Framework preset** : None
   - **Build command** : `npm run build`
   - **Build output directory** : `dist`
5. Variables d'environnement : ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
6. Sauvegardez et déployez

### Option 2 — Via Wrangler CLI

```bash
# Installer Wrangler si nécessaire
npm install -g wrangler

# Authentification Cloudflare
wrangler login

# Build + déploiement
npm run build
npx wrangler pages deploy dist --project-name=mentality-admin
```

Le projet sera accessible sur `https://mentality-admin.pages.dev` (ou votre domaine personnalisé).

## Architecture

```
src/
├── lib/
│   └── supabase.ts          # Client Supabase configuré
├── types/
│   └── index.ts             # Types TypeScript + registre WAIS-IV
├── hooks/
│   ├── useAuth.ts           # Auth state (user, profile, isAdmin)
│   └── useSupabase.ts       # Helpers query/mutation
├── services/
│   ├── auth.service.ts      # Gestion comptes cliniciens
│   ├── scoring.service.ts   # Configurations de scoring
│   ├── flow.service.ts      # Flow des tests
│   ├── items.service.ts     # Bibliothèque d'items
│   ├── analytics.service.ts # Statistiques
│   └── collaboration.service.ts  # Commentaires/propositions
├── components/
│   ├── Layout.tsx           # Layout principal (sidebar + header)
│   ├── Sidebar.tsx          # Navigation
│   ├── Header.tsx           # Barre supérieure avec profil
│   ├── ProtectedRoute.tsx   # Garde d'authentification
│   ├── ui/                  # Composants UI réutilisables
│   └── scoring/             # Composants scoring
└── pages/
    ├── LoginPage.tsx        # Connexion
    ├── DashboardPage.tsx    # Tableau de bord
    ├── ScoreConfigPage.tsx  # Configuration scoring
    ├── TestFlowPage.tsx     # Flow des tests (drag & drop)
    ├── ItemsLibraryPage.tsx # Bibliothèque d'items
    ├── AnalyticsPage.tsx    # Analytique
    ├── CollaborationPage.tsx# Espace collaboratif
    └── AdminPage.tsx        # Administration (admin only)
```

## Tables Supabase

| Table | Description |
|-------|-------------|
| `profiles` | Praticiens (étend auth.users) |
| `test_configurations` | Règles scoring WAIS-IV avec versioning |
| `flow_configurations` | Ordre et conditions des tests |
| `items_library` | Items verbaux et non-verbaux |
| `clinical_comments` | Commentaires cliniques threaded |
| `proposals` | Propositions soumises au vote |
| `proposal_votes` | Votes individuels |
| `change_log` | Journal immuable des modifications |

## Sécurité (Row Level Security)

- Cliniciens : lecture de toutes les configurations, écriture de leurs propres commentaires/propositions
- Admin : modification des configurations actives, gestion des comptes, déploiement des propositions
- Toutes les tables ont RLS activé — aucun accès anonyme

## Rôles

| Rôle | Permissions |
|------|-------------|
| `admin` | Tout — gestion comptes, configs, déploiement |
| `clinician` | Lecture configs, commentaires, propositions, votes |

## Séparation du projet principal

Ce repo est **entièrement indépendant** de l'app Flutter Mentality principale :
- Repo GitHub séparé
- Déploiement Cloudflare Pages séparé (`mentality-admin` vs `mentality-flutter-web`)
- Partage uniquement du projet Supabase pour les données
- Zéro dépendance au code Flutter/Dart
