# 🚗 CarLoc - Location de Voitures

Application complète de location de véhicules avec gestion multi-roles (Client, Personnel, Administrateur).

## 📋 Description

CarLoc est une solution de location de voiture full-stack incluant :

- **Backend API** : NestJS + Prisma + PostgreSQL
- **Web Client** : Next.js (réservation, gestion compte)
- **Web Admin/Staff** : Next.js (dashboard, planification, modération)
- **Mobile Client** : React Native (Expo)
- **Mobile Staff** : React Native (Expo) - Mode hors-ligne

### Fonctionnalités principales

| Module | Features |
|--------|----------|
| Authentification | JWT, register, login, rôles |
| Véhicules | Catégories, disponibilité, filtres |
| Réservations | Création, validation, historique, annulation |
| Check-in/out | Signature digitale, photos, km, carburant |
| Paiements | Stripe (CB), espèces, dépôt |
| Invoices | PDF automatique, download |
| Notifications | Push (Expo), email (SendGrid) |
| Modération | Avis clients, gestion incidents |

---

## 🛠️ Prérequis

- **Node.js** >= 20.x
- **PostgreSQL** >= 14.x
- **npm** ou **yarn**
- **Expo CLI** (pour les apps mobiles)

---

## 📦 Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd carloc

# 2. Installer les dépendances backend
cd apps/backend
npm install

# 3. Générer le client Prisma
npx prisma generate

# 4. Appliquer les migrations
npx prisma db push

# 5. (Optionnel) Charger les données de test
npx prisma db seed

# 6. Installer les dépendances web
cd ../web
npm install

# 7. Installer les dépendances mobile client
cd ../mobile
npm install

# 8. Installer les dépendances mobile staff
cd ../mobile-staff
npm install
```

---

## 🚀 Lancement

### Backend (API)

```bash
cd apps/backend
npm run dev
# API disponible sur http://localhost:4000
```

### Frontend Web

```bash
cd apps/web
npm run dev
# Application sur http://localhost:3000
```

### Mobile Client

```bash
cd apps/mobile
npx expo start
```

### Mobile Staff

```bash
cd apps/mobile-staff
npx expo start
```

---

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@carloc.ma | Admin123! |
| **Staff 1** | staff1@carloc.ma | Staff123! |
| **Staff 2** | staff2@carloc.ma | Staff123! |
| **Staff 3** | staff3@carloc.ma | Staff123! |
| **Client 1** | client1@carloc.ma | Client123! |
| **Client 2** | client2@carloc.ma | Client123! |
| **Client 3** | client3@carloc.ma | Client123! |
| **Client 4** | client4@carloc.ma | Client123! |
| **Client 5** | client5@carloc.ma | Client123! |

---

## 📁 Structure du projet

```
carloc/
├── apps/
│   ├── backend/          # API NestJS
│   │   ├── src/
│   │   │   ├── auth/         # Authentification JWT
│   │   │   ├── users/       # Gestion utilisateurs
│   │   │   ├── vehicles/    # Véhicules et catégories
│   │   │   ├── reservations/# Réservations
│   │   │   ├── checkinout/  # Check-in/out
│   │   │   ├── payments/    # Stripe + cash
│   │   │   ├── invoices/    # Génération PDF
│   │   │   └── admin/       # Dashboard, rapports
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts      # Données test
│   │
│   ├── web/              # Application Next.js
│   │   └── src/app/
│   │       ├── page.tsx              # Home
│   │       ├── connexion/            # Login
│   │       ├── inscription/          # Register
│   │       ├── vehicules/            # Catalogue
│   │       ├── reservation/          # Booking
│   │       ├── mes-reservations/     # Client reservations
│   │       ├── admin/                 # Dashboard admin
│   │       └── staff/                # Planning staff
│   │
│   ├── mobile/           # App client React Native
│   │   ├── app/
│   │   │   ├── (tabs)/   # Home, vehicles, reservations, profile
│   │   │   └── confirmation/[id].tsx
│   │   └── src/store/    # Zustand stores
│   │
│   └── mobile-staff/     # App staff React Native (offline-first)
│       ├── app/
│       │   ├── (tabs)/   # Planning, cash, incidents
│       │   └── auth/login.tsx
│       └── src/store/    # authStore, syncStore
│
├── .env.example          # Template variables d'environnement
└── README.md             # Ce fichier
```

---

## ⚙️ Configuration

Copier `.env.example` vers `.env` et configurez :

```bash
cp .env.example apps/backend/.env
```

Variables principales :
- `DATABASE_URL` - Connexion PostgreSQL
- `JWT_SECRET` - Clé pour les tokens JWT
- `STRIPE_SECRET_KEY` - Clé Stripe (test)
- `SENDGRID_API_KEY` - Clé SendGrid pour les emails

---

## 🔧 Scripts utiles

```bash
# Backend
npm run dev          # Mode développement
npx prisma db push   # Mettre à jour la DB
npx prisma db seed   # Charger les données test

# Web
npm run dev          # Mode développement
npm run build        # Build production

# Mobile
npx expo start       # Lancer Expo
npx expo run:android # Build APK Android
```

---

## 📝 Règles métier

- **Annulation** :
  - >48h avant départ : remboursement total
  - 24-48h avant départ : pénalité 50%
  - <24h avant départ : aucun remboursement

- **Kilomètres** : 200km/jour inclus, 2 MAD/km supplémentaire

- **Dépôt** : Bloqué sur carte + pré-autorisation

---

## 📄 License

Projet développé dans le cadre du MVP CarLoc.