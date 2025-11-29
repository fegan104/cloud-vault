"use client";

import { generateChallengeForSession, verifyChallengeForSession } from "../lib/challenge";
import { useMasterKey } from "./MasterKeyContext";
import { base64ToUint8Array, deriveMasterKey, signChallenge } from "../lib/clientCrypto";
import { useState } from "react";
import CircularProgress from "./CircularProgress";
import { File } from "lucide-react";
import { PasswordInput } from "@/components/TextInput";
import { TonalButton } from "@/components/Buttons";

type MasterKeyGuardProps = {
  masterKeySalt: string;
  children: React.ReactNode;
};

export default function MasterKeyGuard({ masterKeySalt, children }: MasterKeyGuardProps) {
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { masterKey, setMasterKey } = useMasterKey();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
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
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-variant">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-[--radius-xl] p-8 shadow-[--shadow-4]">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tertiary-container mb-4">
                <File className="w-8 h-8 text-on-tertiary-container" />
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
              <PasswordInput
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                name="password-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitPassword();
                  }
                }}
                error={error}
              />

              {error && (
                <div className="p-3 rounded-[--radius-md] bg-error-container">
                  <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
                </div>
              )}

              <TonalButton
                onClick={submitPassword}
                disabled={isLoading}
                className="w-full py-3 px-6"
              >
                {isLoading ? (
                  <>
                    <CircularProgress color="secondary-on" size={20} />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  'Unlock Vault'
                )}
              </TonalButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
