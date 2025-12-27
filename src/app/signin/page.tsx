'use client';

import { startLogin, finishLogin } from '../../app/signin/actions';
import { useMasterKey } from '../../components/MasterKeyContext';
import { deriveMasterKey } from '../../lib/util/clientCrypto';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { TextInput, PasswordInput } from '@/components/TextInput';
import { TonalButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import CircularProgress from '@/components/CircularProgress';
import { base64ToUint8Array } from '@/lib/util/arrayHelpers';
import * as opaque from '@serenity-kit/opaque';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()

  /**
   * Handles the sign in process using OPAQUE protocol.
   * OPAQUE login is a 2-step process:
   * 1. Client starts login → Server creates login response
   * 2. Client finishes login → Server verifies and creates session
   */
  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Client starts OPAQUE login
      const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
        password,
      });

      // Step 2: Server starts login and returns response
      const loginStart = await startLogin(email, startLoginRequest);

      if (!loginStart) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      const { loginResponse, masterKeySalt } = loginStart;

      // Step 3: Client finishes login
      const loginResult = opaque.client.finishLogin({
        clientLoginState,
        loginResponse,
        password,
      });

      if (!loginResult) {
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      const { finishLoginRequest } = loginResult;

      // Step 4: Server verifies and creates session
      const verified = await finishLogin(email, finishLoginRequest);

      if (verified) {
        // Derive the master key from the password and salt
        const saltBytes = base64ToUint8Array(masterKeySalt)
        const masterKey = await deriveMasterKey(password, saltBytes)
        setMasterKey(masterKey)
        redirect("/vault")
      } else {
        setIsLoading(false);
        setError('Invalid email or password')
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An error occurred during sign in. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex md:items-center justify-center px-4 pt-8 bg-background">
      <div className="w-full flex justify-center">
        {/* Card Container */}
        <Card className="w-full md:w-[512px] p-8 space-y-4 h-min">
          <div>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container mb-4">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-[--font-headline-md] font-semibold text-on-surface mb-2">
                Welcome Back
              </h1>
              <p className="text-[--font-body-md] text-on-surface-variant">
                Sign in to access your encrypted vault
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
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
                <div className="p-3 rounded-[var(--radius-md)] bg-error-container">
                  <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <TonalButton
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3"
              >
                {isLoading ? <CircularProgress size={20} /> : null}
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