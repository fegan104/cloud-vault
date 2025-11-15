'use client';

import { createUser } from '@/actions/createUser';
import { useAuth } from '@/context/AuthContext';
import { deriveKeypair } from '@/lib/clientCrypto';
import { useState } from 'react';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { privateKey, setPrivateKey } = useAuth()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    // 1) Generate salt
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = btoa(String.fromCharCode(...saltBytes));

    // 2) Derive key from password+salt


    // 3) Generate Ed25519 key pair
    const { publicKey, privateKey } = await deriveKeypair(password, saltBytes)
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
    setPrivateKey(privateKey)
    // 4) Send to your server (via RSC action) to create the user
    await createUser({ email, salt, publicKey: publicKeyBase64 });

    // 5) Keep privateKey client-side for signing login challenges
    // console.log('Private key:', privateKey);
  }

  return (
    <form onSubmit={handleSignUp}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Master password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
