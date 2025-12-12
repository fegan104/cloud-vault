"use client";

import { generateChallengeForSession, verifyChallengeForSession } from "../lib/challenge";
import { useMasterKey } from "./MasterKeyContext";
import { base64ToUint8Array, deriveMasterKey, signChallenge } from "../lib/clientCrypto";
import { useState } from "react";
import CircularProgress from "./CircularProgress";
import { FileText, Key } from "lucide-react";
import { PasswordInput } from "@/components/TextInput";
import { TonalButton } from "@/components/Buttons";
import { Card } from "./Card";

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

  /**
   * Handles the submission of the password to verify the master key.
   */
  const handleSubmitPassword = async () => {
    try {
      setIsLoading(true);
      // 1. Request a challenge from the server
      const { challenge } = await generateChallengeForSession();
      // 2. Sign the challenge with the password
      const signature = await signChallenge(password, masterKeySalt, challenge);
      // 3. Verify the challenge with the signature
      const verified = await verifyChallengeForSession(challenge, signature);
      // 4. If verified, derive the master key and set it in the context
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
      <div className="min-h-screen flex items-start pt-16 justify-center px-4 bg-background">
        <div className="w-full flex justify-center">
          <Card className="w-full md:w-[512px] p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container mb-4">
                <Key className="w-8 h-8 text-primary" />
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
                    handleSubmitPassword();
                  }
                }}
                error={error}
              />

              {error && (
                <div className="p-3 rounded-[var(--radius-md)] bg-error-container">
                  <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
                </div>
              )}

              <TonalButton
                onClick={handleSubmitPassword}
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
          </Card>

        </div >
      </div >
    );
  }

  return <>{children}</>;
}
