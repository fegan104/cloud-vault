"use client";

import { generateChallengeForSession, verifyChallengeForSession } from "../lib/challenge";
import { useMasterKey } from "./MasterKeyContext";
import { base64ToUint8Array, deriveMasterKey, signChallenge } from "../lib/clientCrypto";
import { ChangeEvent, useState } from "react";
import CircularProgress from "./CircularProgress";

type MasterKeyGuardProps = {
  masterKeySalt: string;
  children: React.ReactNode;
};

export default function MasterKeyGuard({ masterKeySalt, children }: MasterKeyGuardProps) {
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { masterKey, setMasterKey } = useMasterKey();

  const handlePasswordChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };

  const submitPassword = async () => {
    try {
      setIsLoading(true);
      const { challenge } = await generateChallengeForSession();
      const signature = await signChallenge(password, masterKeySalt, challenge);
      const verified = await verifyChallengeForSession(challenge, signature);

      if (verified) {
        const masterKeySaltBytes = base64ToUint8Array(masterKeySalt);
        const newMasterKey = await deriveMasterKey(password, masterKeySaltBytes);
        setMasterKey(newMasterKey);
      } else {
        setError("Incorrect password");
      }
    } catch (e) {
      console.error(e);
      setError("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  if (!masterKey) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-surface-variant)' }}>
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-[--radius-xl] p-8 shadow-[--shadow-4]">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-container mb-4">
                <svg className="w-8 h-8 text-on-tertiary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-[--font-headline-md] font-semibold text-on-surface mb-2">
                Unlock Your Vault
              </h2>
              <p className="text-[--font-body-md] text-on-surface-variant">
                Enter your password to decrypt your files
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="password-input"
                  className="block text-[--font-label-lg] font-medium text-on-surface"
                >
                  Password
                </label>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitPassword();
                    }
                  }}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 bg-surface-variant border rounded-[--radius-md] 
                           text-on-surface placeholder:text-on-surface-variant
                           focus:outline-none focus:ring-2 transition-all duration-200
                           ${error
                      ? "border-error focus:ring-error focus:border-error"
                      : "border-outline-variant focus:ring-tertiary focus:border-tertiary"
                    }`}
                />
              </div>

              {error && (
                <div className="p-3 rounded-[--radius-md] bg-error-container">
                  <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
                </div>
              )}

              <button
                onClick={submitPassword}
                disabled={isLoading}
                className="w-full bg-tertiary text-on-tertiary py-3 px-6 rounded-full
                         font-medium text-[--font-label-lg] shadow-[--shadow-2]
                         hover:shadow-[--shadow-3] hover:brightness-110
                         active:shadow-[--shadow-1]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <CircularProgress color="secondary-on" size={20} />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  'Unlock Vault'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
