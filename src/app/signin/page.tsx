'use client';
import { generateChallenge } from '../../lib/challenge';
import { verifyChallenge } from '../../lib/challenge';
import { useMasterKey } from '../../components/MasterKeyContext';
import { base64ToUint8Array, deriveMasterKey, signChallenge } from '../../lib/clientCrypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-surface-variant)' }}>
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-surface rounded-[--radius-xl] p-8 shadow-[--shadow-3]">
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
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[--font-label-lg] font-medium text-on-surface"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-surface-variant border border-outline-variant rounded-[--radius-md] 
                         text-on-surface placeholder:text-on-surface-variant
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                         transition-all duration-200"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[--font-label-lg] font-medium text-on-surface"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-surface-variant border border-outline-variant rounded-[--radius-md] 
                         text-on-surface placeholder:text-on-surface-variant
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                         transition-all duration-200"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-[--radius-md] bg-error-container">
                <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary py-3 px-6 rounded-full
                       font-medium text-[--font-label-lg] shadow-[--shadow-2]
                       hover:shadow-[--shadow-3] hover:brightness-110
                       active:shadow-[--shadow-1]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
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
      </div>
    </div>
  );
}