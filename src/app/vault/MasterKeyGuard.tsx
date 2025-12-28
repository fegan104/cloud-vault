"use client";
import { importKeyFromExportKey } from "@/lib/util/clientCrypto";
import { useMasterKey } from "../../components/MasterKeyContext";
import { useState } from "react";
import CircularProgress from "../../components/CircularProgress";
import { Key } from "lucide-react";
import { PasswordInput } from "@/components/TextInput";
import { TonalButton } from "@/components/Buttons";
import { Card } from "../../components/Card";
import { createSignInResponseForSession, verifyPasswordForSession } from "./actions";
import { createFinishSignInRequest, createStartSignInRequest } from "@/lib/opaque/opaqueClient";



type MasterKeyGuardProps = {
  children: React.ReactNode;
};

export default function MasterKeyGuard({ children }: MasterKeyGuardProps) {
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { masterKey, setMasterKey } = useMasterKey();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
  };

  /**
   * Handles the submission of the password using OPAQUE protocol.
   * The export key from OPAQUE is used directly as the master key.
   */
  const handleSubmitPassword = async () => {
    try {
      setIsLoading(true);

      // Step 1: Client starts OPAQUE login
      const { clientLoginState, startLoginRequest } = createStartSignInRequest({
        password,
      });

      // Step 2: Server starts login
      const loginStart = await createSignInResponseForSession(startLoginRequest);
      if (!loginStart) {
        setError("Failed to verify password");
        setIsLoading(false);
        return;
      }

      const { loginResponse } = loginStart;

      // Step 3: Client finishes login - get export key
      const loginResult = createFinishSignInRequest({
        clientLoginState,
        loginResponse,
        password,
      });

      if (!loginResult) {
        setError("Incorrect password");
        setIsLoading(false);
        return;
      }

      const { finishLoginRequest, exportKey } = loginResult;

      // Step 4: Server verifies
      const verified = await verifyPasswordForSession(finishLoginRequest);

      if (verified) {
        // Use OPAQUE export key as master key
        const newMasterKey = await importKeyFromExportKey(exportKey);
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
              <h2 className="text-2xl font-semibold text-on-surface mb-2">
                Unlock Your Vault
              </h2>
              <p className="text-on-surface-variant">
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
                <div className="p-3 rounded-md bg-error-container">
                  <p className="text-sm text-on-error-container">{error}</p>
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
