'use client';

import { createUser } from '../../lib/createUser';
import { deriveKeypair, deriveMasterKey } from '../../lib/clientCrypto';
import { useState } from 'react';
import { useMasterKey } from '../../context/MasterKeyContext';
import { redirect } from 'next/navigation';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setMasterKey } = useMasterKey()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    // 1) Generate salt
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = btoa(String.fromCharCode(...saltBytes));

    // 2) Generate Ed25519 key pair
    const { publicKey } = await deriveKeypair(password, saltBytes)
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
    // 3) Send to your server (via RSC action) to create the user
    await createUser({ email, salt, publicKey: publicKeyBase64 });

    // 4) Keep privateKey client-side for signing login challenges
    const masterKey = await deriveMasterKey(password, saltBytes)
    setMasterKey(masterKey)
    redirect('/dashboard')
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
