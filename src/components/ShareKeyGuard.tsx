"use client";

import { useState } from "react";
import CircularProgress from "./CircularProgress";
import { Key } from "lucide-react";
import { PasswordInput } from "@/components/TextInput";
import { TonalButton } from "@/components/Buttons";
import { Card } from "./Card";
import { base64ToUint8Array, deriveShareKey } from "@/lib/clientCrypto";
import { Share } from "@prisma/client";

export type ShareKeyDerivationParams = {
  publicKey: string;
  name: string;
  keyDerivationSalt: string;
  argon2MemorySize: number;
  argon2Iterations: number;
  argon2Parallelism: number;
  argon2HashLength: number;
};

type ShareKeyGuardProps = {
  shareKeyDerivationParams: ShareKeyDerivationParams;
  share: Share | null;
  onUnlock: (password: string) => Promise<void>;
  children: React.ReactNode;
};

export default function ShareKeyGuard({
  shareKeyDerivationParams,
  share,
  onUnlock,
  children,
}: ShareKeyGuardProps) {
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
  };

  const submitPassword = async () => {
    try {
      setIsLoading(true);
      await onUnlock(password);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  if (!share) {
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
                Unlock Shared File "{shareKeyDerivationParams.name}"
              </h2>
              <p className="text-[--font-body-md] text-on-surface-variant">
                Enter the share password to decrypt this file
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <PasswordInput
                label="Share Password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter the share password"
                name="share-password-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitPassword();
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
                  'Unlock'
                )}
              </TonalButton>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
