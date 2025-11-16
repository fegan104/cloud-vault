// src/app/login/page.tsx
'use client';
import { generateChallenge } from '@/actions/challenge';
import { verifyChallenge } from '@/actions/verifyChallenge';
import { useAuth } from '@/context/AuthContext';
import { base64ToUint8Array, deriveKeypair, signChallenge } from '@/lib/clientCrypto';
import { bufferToBase64 } from '@/lib/crypto';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterKeySalt, setMasterKeySalt] = useState('');
  const { privateKey, setPrivateKey } = useAuth()
  const [challenge, setChallenge] = useState<string>('');

  useEffect(() => {
    const foo = async () => {
      if(password.length <= 0 || masterKeySalt.length <= 0) return
      const saltBytes = base64ToUint8Array(masterKeySalt)
      const { publicKey, privateKey } = await deriveKeypair(password, saltBytes)
      // const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
      setPrivateKey(privateKey)
    }
    foo()
  }, [masterKeySalt, password, setPrivateKey])

  async function handleRequestChallenge() {
    const { challenge, masterKeySalt } = await generateChallenge(email);
    console.log(`Challenge issued: ${challenge}`)
    setChallenge(challenge);
    setMasterKeySalt(masterKeySalt)
  }

  async function handleSignChallenge() {
    if (!privateKey || !challenge) return;

    const signature = await signChallenge(password, masterKeySalt, challenge)
    console.log(`Raw signature ${signature}`)
    // const signatureBase64 = btoa(signature);
    // console.log(`base64 signature ${signatureBase64}`)

    const result = await verifyChallenge(email, challenge, signature);
    if (result) {
      alert('Login successful!')
      redirect("/")
    } else alert('Login failed');

  }

  return (
    <div>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      {privateKey ? (<></>) : (<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />)}
      <button onClick={handleRequestChallenge}>Request Challenge</button>
      <div>Challenge: {challenge}</div>
      {challenge && <button onClick={handleSignChallenge}>Sign & Verify Challenge</button>}
    </div>
  );
}