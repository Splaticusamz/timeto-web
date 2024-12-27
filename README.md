# TimeTo Web

A web application for managing events and organizations, built with React, Firebase, and TailwindCSS.

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (create one at https://console.firebase.google.com)

## Setup

1. Clone and install dependencies:
   ```bash
   git clone <repository-url>
   cd timeto-web
   npm install
   ```

2. Firebase Setup:
   ```bash
   # Login to Firebase
   firebase login

   # Initialize Firebase project
   firebase init
   # Select: Firestore, Hosting, Emulators
   # Choose your project
   # Accept defaults for Firestore rules and indexes
   # For emulators, select: Auth and Firestore
   ```

3. Environment Setup:
   ```bash
   # Copy environment files
   cp .env.example .env
   cp .env.example .env.development

   # Edit .env and .env.development with your Firebase config
   # Get these values from Firebase Console > Project Settings > Web App
   VITE_FIREBASE_API_KEY=xxx
   VITE_FIREBASE_AUTH_DOMAIN=xxx
   VITE_FIREBASE_PROJECT_ID=xxx
   VITE_FIREBASE_STORAGE_BUCKET=xxx
   VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
   VITE_FIREBASE_APP_ID=xxx
   ```

4. Initialize Emulator:
   ```bash
   # Download emulator files
   firebase init emulators

   # Import initial data (if you have firebase-export directory)
   firebase emulators:start --import=firebase-export --export-on-exit

   # Or start fresh
   firebase emulators:start
   ```

5. Development:
   ```bash
   # Terminal 1: Start emulators
   npm run emulator

   # Terminal 2: Start development server
   npm run dev
   ```

6. Open http://localhost:5173 in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run emulator` - Start Firebase emulators
- `npm run init-emulator` - Initialize emulator with test data

## Key Dependencies

- React 18
- Firebase 10
- React Router 6
- HeadlessUI
- TailwindCSS
- FullCalendar
- TypeScript
- Vite

## Development Notes

- The app uses Firebase emulators for local development
- Auth emulator runs on port 9099
- Firestore emulator runs on port 8080
- Data is persisted between emulator sessions if you use --export-on-exit
- Use .env.development for local development settings
- Use .env for production settings

## Firestore Schema

The app expects the following collections:
- `organizations/{orgId}/leads` - Invited members
- `organizations/{orgId}/members` - Registered members
- `users` - User profiles with `referralOrganizations` array

## Common Issues

1. Emulator Connection:
   - Ensure emulators are running before starting dev server
   - Check ports 9099 (Auth) and 8080 (Firestore) are free

2. Environment Variables:
   - Must start with VITE_
   - Restart dev server after changes

3. Firebase Setup:
   - Enable Email/Password authentication in Firebase Console
   - Set up Firestore rules and indexes
