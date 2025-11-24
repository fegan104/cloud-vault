"use client";

import { generateChallengeForSession, verifyChallengeForSession } from "../lib/challenge";
import { useMasterKey } from "../context/MasterKeyContext";
import { base64ToUint8Array, deriveMasterKey, signChallenge } from "../lib/clientCrypto";
import { ChangeEvent, useState } from "react";

type MasterKeyGuardProps = {
  masterKeySalt: string;
  children: React.ReactNode;
};

export default function MasterKeyGuard({ masterKeySalt, children }: MasterKeyGuardProps) {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { masterKey, setMasterKey } = useMasterKey();

  const handlePasswordChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
  };

  const submitPassword = async () => {
    try {
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
    }
  };

  if (!masterKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold text-gray-700">Unlock Your Vault</h2>
        <div className="flex flex-col space-y-2 w-full max-w-xs">
          <label htmlFor="password-input" className="text-sm font-medium text-gray-600">
            Enter Password
          </label>
          <input
            id="password-input"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            className={`px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all ${error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              }`}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            onClick={submitPassword}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
