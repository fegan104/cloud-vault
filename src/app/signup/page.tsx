'use client';

import { createUser } from '../../lib/createUser';
import { deriveKeypair, deriveMasterKey } from '../../lib/clientCrypto';
import { useState } from 'react';
import { useMasterKey } from '../../components/MasterKeyContext';
import { redirect } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
    redirect('/vault')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-surface-variant)' }}>
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-surface rounded-[--radius-xl] p-8 shadow-[--shadow-3]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-container mb-4">
              <UserPlus className="w-8 h-8 text-on-secondary-container" />
            </div>
            <h1 className="text-[--font-headline-md] font-semibold text-on-surface mb-2">
              Create Account
            </h1>
            <p className="text-[--font-body-md] text-on-surface-variant">
              Start securing your files with end-to-end encryption
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
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
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-variant border border-outline-variant rounded-[--radius-md] 
                         text-on-surface placeholder:text-on-surface-variant
                         focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary
                         transition-all duration-200"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[--font-label-lg] font-medium text-on-surface"
              >
                Master Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-variant border border-outline-variant rounded-[--radius-md] 
                         text-on-surface placeholder:text-on-surface-variant
                         focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary
                         transition-all duration-200"
              />
              <p className="text-[--font-body-sm] text-on-surface-variant">
                Choose a strong password. You cannot recover it if lost.
              </p>
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
              className="w-full bg-secondary text-on-secondary py-3 px-6 rounded-full
                       font-medium text-[--font-label-lg] shadow-[--shadow-2]
                       hover:shadow-[--shadow-3] hover:brightness-110
                       active:shadow-[--shadow-1]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-[--font-body-sm] text-on-surface-variant">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-secondary font-medium hover:underline transition-all"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
