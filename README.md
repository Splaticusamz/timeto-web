# Time To Web

A web application for managing events and organizations.

## Features

- User authentication with Firebase Auth
- Organization management
- Event creation and management
- Dark mode support
- Responsive design

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Firebase project

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/timeto-web.git
   cd timeto-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   - Copy `.env.example` to `.env` for production settings
   - Copy `.env.example` to `.env.development` for development settings
   - Update the values in both files with your Firebase configuration

4. Set up Firebase:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Authentication with Email/Password provider
   - Enable Firestore Database
   - Copy your Firebase configuration to the environment files

5. Start the development server:
   ```bash
   # Start the Firestore and Auth emulators
   npm run emulator

   # In another terminal, start the development server
   npm run dev
   ```

6. Open http://localhost:5173 in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run emulator` - Start Firebase emulators
- `npm run init-emulator` - Initialize emulator with test data

## Testing

The application uses Firebase emulators for local development. This allows you to:
- Test authentication without affecting production users
- Use a local Firestore database
- Develop without internet connection

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React context providers
├── pages/         # Page components
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
