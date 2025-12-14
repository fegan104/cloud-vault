# Cloud Vault

Cloud Vault is a secure file storage solution where files are encrypted client-side using **AES-GCM**. Encryption keys are derived locally using **Argon2id** and never transmitted to the server, ensuring a **zero-knowledge architecture** where only you can access your data.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

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

- **`src/app`**: Contains the Next.js App Router pages and API routes.
- **`src/components`**: Reusable UI components.
- **`src/lib`**: Utility functions, including client-side crypto logic and server-side session management.
- **`prisma`**: Database schema and configuration.

This project uses [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com).
