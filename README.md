# TimeTo Web

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env`:
```bash
VITE_FIREBASE_PROJECT_ID=timeto-69867
VITE_USE_EMULATOR=true
```

3. Start Firebase emulators:
```bash
# Terminal 1: Start emulators with local data
firebase emulators:start

# Terminal 2: Start development server
npm run dev
```

4. Access the app at http://localhost:5173

## Test Account
```
Email: samz@timeto.gg
Password: test123
```

## Emulator Ports
- Firestore: 8080
- Auth: 9099
- Functions: 5001
- UI: 4000
