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
   ```

   Then:
   1. Go to [Firebase Console](https://console.firebase.google.com)
   2. Select your project
   3. Click the gear icon (⚙️) next to "Project Overview" to open Project Settings
   4. Scroll down to "Your apps" section
   5. If no web app exists, click the web icon (</>)
   6. Register app with any nickname
   7. Copy the config values from the provided code snippet:
   ```javascript
   const firebaseConfig = {
     apiKey: "copy-this-value",
     authDomain: "copy-this-value",
     projectId: "copy-this-value",
     storageBucket: "copy-this-value",
     messagingSenderId: "copy-this-value",
     appId: "copy-this-value"
   };
   ```
   8. Update BOTH `.env` and `.env.development` with these values:
   ```bash
   VITE_FIREBASE_API_KEY=paste-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=paste-auth-domain-here
   VITE_FIREBASE_PROJECT_ID=paste-project-id-here
   VITE_FIREBASE_STORAGE_BUCKET=paste-storage-bucket-here
   VITE_FIREBASE_MESSAGING_SENDER_ID=paste-sender-id-here
   VITE_FIREBASE_APP_ID=paste-app-id-here
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

5. Setup Test Authentication:
   ```bash
   # In a new terminal, with emulators running
   node setup-auth.js

   # This creates a test admin user:
   # Email: samz@timeto.gg
   # Password: test123
   ```

6. Development:
   ```bash
   # Terminal 1: Start emulators
   npm run emulator

   # Terminal 2: Start development server
   npm run dev
   ```

7. Open http://localhost:5173 in your browser and login with the test credentials

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
- Test user credentials are created by setup-auth.js
- The test user has system admin privileges

## Firestore Schema

The app expects the following collections:
- `organizations/{orgId}/leads` - Invited members
- `organizations/{orgId}/members` - Registered members
- `users` - User profiles with `referralOrganizations` array

## Common Issues

1. Emulator Connection:
   - Ensure emulators are running before starting dev server
   - Check ports 9099 (Auth) and 8080 (Firestore) are free
   - Run setup-auth.js after emulators are started

2. Environment Variables:
   - Must start with VITE_
   - Must be exact values from Firebase Console
   - Double-check API key for typos
   - Make sure you're using the Web App configuration, not Admin SDK
   - Restart dev server after any changes to .env files

3. Firebase Setup:
   - Enable Email/Password authentication in Firebase Console
   - Set up Firestore rules and indexes
   - Ensure emulators are running before running setup-auth.js
   - Make sure you've created a Web App in Firebase Console
