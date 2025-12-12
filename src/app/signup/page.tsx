'use client';

import { createUser } from '../../lib/createUser';
import { deriveKeypair, deriveMasterKey, generateSalt, uint8ToBase64 } from '../../lib/clientCrypto';
import { useState } from 'react';
import { useMasterKey } from '../../components/MasterKeyContext';
import { redirect } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { TextInput, PasswordInput } from '@/components/TextInput';
import { TonalButton } from '@/components/Buttons';
import { Card } from '@/components/Card';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()

  /**
   * Handles the sign up process by creating a new user on the server and storing the master key in memory client-side.
   * @param event The form event.
   */
  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // 1) Generate salt
    const saltBytes = generateSalt();
    const salt = uint8ToBase64(saltBytes);

    // 2) Generate Ed25519 key pair
    const { publicKey } = await deriveKeypair(password, saltBytes)
    const publicKeyBase64 = uint8ToBase64(publicKey);

    // 3) Send to your server (via RSC action) to create the user
    await createUser({ email, salt, publicKey: publicKeyBase64 });

    // 4) Keep privateKey client-side for signing login challenges
    const masterKey = await deriveMasterKey(password, saltBytes)
    setMasterKey(masterKey)
    redirect('/vault')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full flex justify-center">
        {/* Card Container */}
        <Card className="w-full md:w-[512px] p-8 space-y-4">
          <div className="">
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
              <TextInput
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
              />

              {/* Password Input */}
              <PasswordInput
                label="Master Password"
                value={password}
                onChange={setPassword}
                placeholder="Choose a strong password"
              />

              {/* Confirm Password Input */}
              <PasswordInput
                label="Confirm Master Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your password"
                error={confirmPassword.length > 0 && password !== confirmPassword ? 'Passwords do not match' : null}
              />
              <p className="text-[--font-body-sm] text-on-surface-variant">
                Choose a strong password. You cannot recover it if lost.
              </p>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-[var(--radius-md)] bg-error-container">
                  <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <TonalButton
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword || password !== confirmPassword}
                className="w-full py-3"
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </TonalButton>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-[--font-body-sm] text-on-surface-variant">
                Already have an account?{' '}
                <Link
                  href="/signin"
                  className="text-primary font-medium hover:underline transition-all"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
