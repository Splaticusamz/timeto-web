<!-- # TimeTo Web

A web application for managing events and organizations, built with React, Firebase, and TailwindCSS.

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (create one at https://console.firebase.google.com)
- Git

## Setup (Cross-Platform)

1. Clone and install dependencies:
   ```bash
   git clone <repository-url>
   cd timeto-web
   npm install
   ```

2. Create Required Files:

   Create `.firebaserc`:
   ```json
   {
     "projects": {
       "default": "timeto-69867"
     }
   }
   ```

   Create `firebase.json`:
   ```json
   {
     "firestore": {
       "rules": "firestore.rules",
       "indexes": "firestore.indexes.json"
     },
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     },
     "emulators": {
       "auth": {
         "port": 9099
       },
       "firestore": {
         "port": "8080"
       },
       "hosting": {
         "port": 5001
       },
       "ui": {
         "enabled": true,
         "port": 4000
       },
       "singleProjectMode": true
     }
   }
   ```

   Create `.env.development`:
   ```bash
   VITE_FIREBASE_PROJECT_ID=timeto-69867
   VITE_FIREBASE_API_KEY=demo-key-123
   VITE_FIREBASE_AUTH_DOMAIN=timeto-69867.firebaseapp.com
   VITE_USE_EMULATOR=true
   ```

3. Firebase Setup:
   ```bash
   # Login to Firebase (will open browser)
   firebase login

   # Initialize Firebase project
   firebase init
   # Select: Firestore, Hosting, Emulators (use spacebar to select)
   # Use existing project: timeto-69867
   # Accept defaults for Firestore rules and indexes
   # For emulators, select: Auth and Firestore
   ```

4. Set up Local Backup:

   On Windows (using PowerShell):
   ```powershell
   # Create directories
   New-Item -ItemType Directory -Force -Path local-backup/auth_export
   New-Item -ItemType Directory -Force -Path local-backup/firestore_export

   # Create metadata file
   $metadata = @'
   {
     "version": "11.29.1",
     "firestore": {
       "version": "1.17.4",
       "path": "firestore_export",
       "metadata_file": "firestore_export/metadata.json"
     },
     "auth": {
       "version": "11.29.1",
       "path": "auth_export"
     }
   }
   '@
   $metadata | Out-File -FilePath local-backup/firebase-export-metadata.json -Encoding UTF8
   ```

   On Mac/Linux:
   ```bash
   # Create directories
   mkdir -p local-backup/auth_export
   mkdir -p local-backup/firestore_export

   # Create metadata file
   echo '{
     "version": "11.29.1",
     "firestore": {
       "version": "1.17.4",
       "path": "firestore_export",
       "metadata_file": "firestore_export/metadata.json"
     },
     "auth": {
       "version": "11.29.1",
       "path": "auth_export"
     }
   }' > local-backup/firebase-export-metadata.json
   ```

5. Initialize Emulator with Local Data:
   ```bash
   # Download emulator files (select Java version if prompted)
   firebase init emulators

   # Start emulators with local backup data
   firebase emulators:start --import=local-backup --export-on-exit=local-backup
   ```

6. Setup Test Authentication:
   ```bash
   # In a new terminal, with emulators running
   node setup-auth.js

   # This creates a test admin user:
   # Email: samz@timeto.gg
   # Password: test123
   ```

7. Development:
   ```bash
   # Terminal 1: Start emulators with local data
   firebase emulators:start --import=local-backup --export-on-exit=local-backup

   # Terminal 2: Start development server
   npm run dev
   ```

8. Open http://localhost:5173 in your browser and login with the test credentials

## Platform-Specific Notes

### Windows
- Use PowerShell for best compatibility
- If you get permission errors, run PowerShell as Administrator
- Line endings might need to be converted (git config --global core.autocrlf true)
- Java SDK is required for Firebase emulators

### Mac/Linux
- Terminal commands should work as is
- If you get permission errors, prefix commands with sudo
- Make sure Java is installed (brew install java on Mac)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run emulator` - Start Firebase emulators (without data import)
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
- Data is loaded from and saved to the local-backup directory
- Only .env.development is needed for emulator usage
- The local-backup directory contains test data and auth users
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
   - Make sure you're using --import=local-backup when starting emulators

2. Environment Variables:
   - For emulator development, only VITE_FIREBASE_PROJECT_ID is required
   - Other Firebase config values are only needed for production
   - Restart dev server after any changes to .env files

3. Firebase Setup:
   - The local-backup directory contains all necessary test data
   - No need to set up Firebase Web App for emulator development
   - Ensure emulators are running before running setup-auth.js
   - Use --export-on-exit=local-backup to persist your changes -->
