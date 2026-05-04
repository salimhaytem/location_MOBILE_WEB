# SPEC.md - Application de Location de Voitures MVP

## 1. Project Overview

- **Project Name**: CarLoc - Location de Voitures
- **Type**: Application Web & Mobile (Monorepo)
- **Core Functionality**: Plateforme complète de gestion de location de voitures avec 3 rôles utilisateurs
- **Target Users**: Clients (locataires), Personnel (agents), Administrateur (propriétaire)

## 2. Architecture

### 2.1 Structure du Monorepo

```
location/
├── apps/
│   ├── backend/        # NestJS API
│   ├── web/            # Next.js Web App
│   └── mobile/         # React Native App
├── packages/
│   └── shared/         # Types, utils, constants partagés
├── turbo.json          # Turborepo config
└── package.json        # Root package.json
```

### 2.2 Stack Technique

| Layer | Technology |
|-------|------------|
| Backend | Node.js + NestJS |
| Frontend Web | React + Next.js 14 (App Router) |
| Mobile | React Native + Expo |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT + Refresh Tokens |
| Payment | Stripe |
| Storage | AWS S3 / Local (dev) |
| Email | Nodemailer (dev) / SendGrid (prod) |

## 3. Database Schema

### 3.1 Entités Principales

```prisma
// Users
User {
  id, email, password, role (CLIENT|PERSONNEL|ADMIN),
  firstName, lastName, phone, createdAt, updatedAt
}

Profile (Client only) {
  id, userId, address, city, country, postalCode,
  drivingLicenseNumber, drivingLicenseExpiry, idCardNumber,
  idCardExpiry, avatarUrl, isVerified, verifiedAt
}

// Vehicles
Vehicle {
  id, brand, model, category, registrationNumber,
  year, color, transmission (AUTO|MANUAL), fuelType,
  doors, seats, luggage, pricePerDay, pricePerKm,
  deposit, mileage, status (AVAILABLE|MAINTENANCE|RENTED),
  images[], description, features[], createdAt
}

Category {
  id, name, description, basePricePerDay
}

// Reservations
Reservation {
  id, userId, vehicleId, agentId,
  pickupDate, returnDate, pickupLocation, returnLocation,
  status (PENDING|CONFIRMED|ACTIVE|COMPLETED|CANCELLED),
  totalPrice, depositAmount, depositPaid,
  options (insurance, gps, babySeat),
  notes, createdAt
}

CheckIn {
  id, reservationId, agentId,
  pickupDateTime, vehicleCondition (photos, km, fuelLevel),
  notes, signature
}

CheckOut {
  id, reservationId, agentId,
  returnDateTime, vehicleCondition, fuelReturnLevel,
  additionalCharges, notes, signature
}

// Incidents
Incident {
  id, vehicleId, reservationId, agentId,
  type (DAMAGE|ACCIDENT|MECHANICAL), description,
  photos[], status (REPORTED|UNDER_REVIEW|RESOLVED),
  estimatedCost, createdAt
}

// Reviews
Review {
  id, reservationId, userId, rating (1-5),
  comment, response, createdAt
}

// Fleet Management
Maintenance {
  id, vehicleId, type (ROUTINE|REPAIR|INSPECTION),
  description, cost, startDate, endDate,
  status (SCHEDULED|IN_PROGRESS|COMPLETED)
}
```

## 4. API Endpoints

### 4.1 Authentication
- `POST /auth/register` - Inscription client
- `POST /auth/login` - Connexion
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Déconnexion
- `POST /auth/forgot-password` - Mot de passe oublié
- `POST /auth/reset-password` - Réinitialiser mot de passe
- `GET /auth/verify-email/:token` - Vérification email

### 4.2 Users
- `GET /users/me` - Profil actuel
- `PATCH /users/me` - Modifier profil
- `POST /users/profile/documents` - Upload documents (permis, ID)

### 4.3 Vehicles
- `GET /vehicles` - Liste véhicules avec filtres
- `GET /vehicles/:id` - Détails véhicule
- `POST /vehicles` - Ajouter véhicule (Admin)
- `PATCH /vehicles/:id` - Modifier véhicule (Admin)
- `DELETE /vehicles/:id` - Supprimer véhicule (Admin)
- `PATCH /vehicles/:id/status` - Changer statut (Personnel/Admin)

### 4.4 Reservations
- `GET /reservations` - Liste réservations
- `POST /reservations` - Créer réservation
- `GET /reservations/:id` - Détails réservation
- `PATCH /reservations/:id` - Modifier réservation
- `PATCH /reservations/:id/status` - Changer statut
- `POST /reservations/:id/cancel` - Annuler réservation

### 4.5 Check-in/Check-out (Personnel)
- `GET /planning/daily` - Planning journalier
- `POST /checkin` - Enregistrer check-in
- `POST /checkout` - Enregistrer check-out

### 4.6 Admin
- `GET /admin/dashboard` - Dashboard statistiques
- `GET /admin/users` - Liste utilisateurs
- `POST /admin/users` - Créer utilisateur personnel
- `GET /admin/reports/financial` - Rapports financiers
- `GET /admin/reports/export` - Export données (CSV/PDF)
- `PATCH /admin/settings` - Configuration globale

### 4.7 Reviews
- `POST /reviews` - Ajouter avis
- `GET /reviews/vehicle/:id` - Avis d'un véhicule

## 5. Rôles et Permissions

| Feature | Client | Personnel | Admin |
|---------|--------|-----------|-------|
| Recherche véhicule | ✓ | ✓ | ✓ |
| Réservation en ligne | ✓ | ✓ | ✓ |
| Paiement Stripe | ✓ | - | - |
| Planning journalier | - | ✓ | ✓ |
| Check-in/Check-out | - | ✓ | - |
| Gestion flotte | - | - | ✓ |
| Gestion utilisateurs | - | - | ✓ |
| Dashboard analytics | - | - | ✓ |
| Reporting | - | - | ✓ |

## 6. Flux de Location

1. **Recherche**: Client saisit dates, lieu → Liste véhicules disponibles
2. **Réservation**: Sélection véhicule + options → Soumission dossier
3. **Paiement**: Stripe payment + blocage caution
4. **Confirmation**: Email/SMS → Dossier visible par agent
5. **Check-in**: Agent fait état des lieux → Remise clés
6. **Check-out**: Retour véhicule → État des lieux → Libération caution → Facture

## 7. Frontend - Structure des Pages

### Client
- `/` - Page d'accueil avec recherche
- `/vehicules` - Catalogue avec filtres
- `/vehicules/[id]` - Fiche véhicule
- `/reservation/[vehiculeId]` - Formulaire réservation
- `/paiement/[reservationId]` - Paiement Stripe
- `/mon-compte` - Profil et documents
- `/mes-reservations` - Historique locations
- `/reservations/[id]` - Détails réservation

### Personnel
- `/agent/planning` - Planning journalier
- `/agent/checkin/[reservationId]` - Check-in
- `/agent/checkout/[reservationId]` - Check-out
- `/agent/vehicules` - État du parc
- `/agent/incidents` - Signaler incident

### Administrateur
- `/admin/dashboard` - Tableau de bord
- `/admin/flotte` - Gestion véhicules
- `/admin/utilisateurs` - Gestion utilisateurs
- `/admin/reservations` - Toutes réservations
- `/admin/tarifs` - Configuration tarifs
- `/admin/rapports` - Reporting et exports
- `/admin Parametres` - Configuration générale

## 8. Spécifications Non-Fonctionnelles

- **Sécurité**: HTTPS, JWT + refresh, password hashing (bcrypt), RBAC, RGPD
- **Performance**: < 3s chargement, lazy loading, caching
- **UX**: Mobile-first, responsive, i18n (FR/AR/EN)
- **Disponibilité**: 99.5% uptime target

## 9. Phases de Développement

### Phase 1 (6 sem) - Fondations
- Auth + JWT
- Profils utilisateurs
- Gestion flotte (CRUD)
- Réservation basique

### Phase 2 (4 sem) - Opérations
- Paiement Stripe
- Check-in/Check-out
- Planning personnel
- Notifications email

### Phase 3 (3 sem) - Admin & Reporting
- Dashboard admin
- Reporting financier
- Export CSV/PDF
- Avis clients