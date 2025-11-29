'use client';
import { generateChallenge } from '../../lib/challenge';
import { verifyChallenge } from '../../lib/challenge';
import { useMasterKey } from '../../components/MasterKeyContext';
import { base64ToUint8Array, deriveMasterKey, signChallenge } from '../../lib/clientCrypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { TextInput, PasswordInput } from '@/components/TextInput';
import { TonalButton } from '@/components/Buttons';
import { Card } from '@/components/Card';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()

  async function handleRequestChallenge(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { challenge, masterKeySalt } = await generateChallenge(email);
    const signature = await signChallenge(password, masterKeySalt, challenge)
    const verified = await verifyChallenge(email, challenge, signature);
    const saltBytes = base64ToUint8Array(masterKeySalt)
    const masterKey = await deriveMasterKey(password, saltBytes)
    setMasterKey(masterKey)
    setIsLoading(false);
    if (verified) {
      redirect("/vault")
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full flex justify-center">
        {/* Card Container */}
        <Card className="w-full md:w-[512px] p-8 space-y-4">
          <div>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container mb-4">
                <LogIn className="w-8 h-8 text-on-primary-container" />
              </div>
              <h1 className="text-[--font-headline-md] font-semibold text-on-surface mb-2">
                Welcome Back
              </h1>
              <p className="text-[--font-body-md] text-on-surface-variant">
                Sign in to access your encrypted vault
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleRequestChallenge} className="space-y-5">
              {/* Email Input */}
              <TextInput
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
              />

              {/* Password Input */}
              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-[--radius-md] bg-error-container">
                  <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <TonalButton
                type="submit"
                disabled={isLoading}
                className="w-full py-3"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </TonalButton>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-[--font-body-sm] text-on-surface-variant">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-primary font-medium hover:underline transition-all"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}