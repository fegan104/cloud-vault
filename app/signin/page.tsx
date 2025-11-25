'use client';
import { generateChallenge } from '../../lib/challenge';
import { verifyChallenge } from '../../lib/challenge';
import { useMasterKey } from '../../components/MasterKeyContext';
import { base64ToUint8Array, deriveMasterKey, signChallenge } from '../../lib/clientCrypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setMasterKey } = useMasterKey()

  async function handleRequestChallenge() {
    const { challenge, masterKeySalt } = await generateChallenge(email);
    const signature = await signChallenge(password, masterKeySalt, challenge)
    const verified = await verifyChallenge(email, challenge, signature);
    if (verified) {
      redirect("/")
    } else {
      alert('Login failed')
    };
    const saltBytes = base64ToUint8Array(masterKeySalt)
    const masterKey = await deriveMasterKey(password, saltBytes)
    setMasterKey(masterKey)
  }

  return (
    <div>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleRequestChallenge}>Sign In</button>
    </div>
  );
}