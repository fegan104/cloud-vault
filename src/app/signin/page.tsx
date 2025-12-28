'use client';

import { startLogin, finishLogin } from '../../app/signin/actions';
import { useMasterKey } from '../../components/MasterKeyContext';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { TextInput, PasswordInput } from '@/components/TextInput';
import { TonalButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import CircularProgress from '@/components/CircularProgress';
import { importKeyFromExportKey } from '@/lib/util/clientCrypto';
import { createStartSignInRequest, createFinishSignInRequest } from '@/lib/opaque/client';


export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()

  /**
   * Handles the sign in process using OPAQUE protocol.
   * The OPAQUE export key is used directly as the master key for file encryption.
   */
  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Step 1: Client starts OPAQUE login
    const { clientLoginState, startLoginRequest } = createStartSignInRequest({
      password,
    });

    // Step 2: Server starts login and returns response
    const loginStart = await startLogin(email, startLoginRequest);

    if (!loginStart) {
      setError('Invalid email or password');
      setIsLoading(false);
      return;
    }

    const { loginResponse } = loginStart;

    // Step 3: Client finishes login - get export key for encryption
    const loginResult = createFinishSignInRequest({
      clientLoginState,
      loginResponse,
      password,
    });

    if (!loginResult) {
      setError('Invalid email or password');
      setIsLoading(false);
      return;
    }

    const { finishLoginRequest, exportKey } = loginResult;

    // Step 4: Server verifies and creates session
    const verified = await finishLogin(email, finishLoginRequest);

    if (verified) {
      // Use OPAQUE export key as master key (convert hex to CryptoKey)
      const masterKey = await importKeyFromExportKey(exportKey);
      setMasterKey(masterKey);
      redirect("/vault");
    } else {
      setIsLoading(false);
      setError('Invalid email or password');
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
              <h1 className="text-2xl font-semibold text-on-surface mb-2">
                Welcome Back
              </h1>
              <p className="text-on-surface-variant">
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
                <div className="p-3 rounded-md bg-error-container">
                  <p className="text-sm text-on-error-container">{error}</p>
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
              <p className="text-sm text-on-surface-variant">
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