# Cloud Vault

Cloud Vault is a secure file storage solution where files are encrypted client-side using **AES-GCM**. Encryption keys are derived by the client and server through a password-authenticated key exchange (PAKE), where the password itself is never revealed or stored in plaintext. The server never stores a crackable password hash. Even if the server database is compromised, attackers cannot perform offline brute-force or dictionary attacks to recover your master key.

## Security Features
- End-to-End Encryption: Files are encrypted using AES-GCM before leaving your device.
- Hardened Key Derivation: Cloud Vault uses [Argon2id](https://en.wikipedia.org/wiki/Argon2) for client-side key stretching.

## Getting Started

1. Install the dependencies:

```bash
npm install
```
2. Set up .env file, see `.env.example` to get started.

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To build the project for production:

```bash
npm run build
npm start
```

## Project Structure

- **`src/app`**: Contains the Next.js App Router pages and server actions.
- **`src/components`**: Reusable UI components.
- **`src/lib`**: Utility functions, including client-side crypto logic and server-side session management.
- **`prisma`**: Database schema and configuration.

This project uses [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com). Additional, thank you to [serenity-kit](https://opaque-auth.com/) and [MetaOpenSource](https://github.com/facebook/opaque-ke) for the OPAQUE PAKE implementation.
