"use client";
import { signOut, updateEmail, getAllEncryptedFilesKeyDerivationParams, updateEncryptedFilesKeyDerivationParams, createSignUpResponse } from "./actions";
import { Card } from "@/components/Card";
import { TonalButton } from "@/components/Buttons";
import { PasswordInput, TextInput } from "@/components/TextInput";
import { useState } from "react";
import { Mail, Lock, LogOut } from "lucide-react";
import { useMasterKey } from "@/components/MasterKeyContext";
import { rewrapKey, importKeyFromExportKey } from "@/lib/util/clientCrypto";
import CircularProgress from "@/components/CircularProgress";
import { TopAppBar } from "@/components/TopAppBar";
import { createFinishSignUpRequest, createStartSignUpRequest, createStartSignInRequest, createFinishSignInRequest } from "@/lib/opaque/opaqueClient";
import { createSignInResponseForSession, verifyPasswordForSession } from "../vault/actions";


export default function AccountScreen({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setError(null);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleChangeEmail = async () => {
    if (!email) return;

    try {
      await updateEmail(email);
      setExpandedSection(null);
    } catch (err) {
      console.error("Failed to update email:", err);
      setError("Failed to update email. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) return;

    setIsUpdatingPassword(true);
    setError(null);
    try {
      // Step 1: Derive current master key
      const { clientLoginState, startLoginRequest } = createStartSignInRequest({ password: currentPassword });
      const loginStart = await createSignInResponseForSession(startLoginRequest);
      if (!loginStart) {
        setError("Invalid current password");
        return;
      }
      const loginResult = createFinishSignInRequest({
        clientLoginState,
        loginResponse: loginStart.loginResponse,
        password: currentPassword,
      });
      if (!loginResult) {
        setError("Invalid current password");
        return;
      }

      // Step 2: Verify password for session
      const verified = await verifyPasswordForSession(loginResult.finishLoginRequest);
      if (!verified) {
        setError("Invalid current password");
        return;
      }

      // Current master key derived from the OPAQUE export key
      const currentMasterKey = await importKeyFromExportKey(loginResult.exportKey);


      // Create new OPAQUE registration for the new password
      // Step 1: Client starts OPAQUE registration
      const { clientRegistrationState, registrationRequest } = createStartSignUpRequest({ password: newPassword });

      // Step 2: Server creates registration response
      const registrationResponse = await createSignUpResponse(registrationRequest);

      // Step 3: Client finishes registration - get new export key
      const { registrationRecord, exportKey } = createFinishSignUpRequest({
        clientRegistrationState,
        registrationResponse,
        password: newPassword,
      });

      // Convert new export key to CryptoKey
      const newMasterKey = await importKeyFromExportKey(exportKey);

      // Fetch all encrypted file key derivation data
      const files = await getAllEncryptedFilesKeyDerivationParams();

      // Decrypt all wrappedFileKeys and rewrap with new master key
      const updates = await Promise.all(files.map(async (file) => {
        const { wrappedKey: newWrappedFileKey, wrappedKeyNonce: newKeyWrapNonce } = await rewrapKey({
          wrappedKey: file.wrappedFileKey,
          wrappedKeyNonce: file.keyWrapIv,
          unwrappingKey: currentMasterKey,
          wrappingKey: newMasterKey,
        });

        return {
          id: file.id,
          wrappedFileKey: newWrappedFileKey,
          keyWrapNonce: newKeyWrapNonce,
        };
      }));

      // Update all encrypted file key derivation data in database transactionally
      await updateEncryptedFilesKeyDerivationParams(updates, registrationRecord);

      // Update master key in memory
      setMasterKey(newMasterKey);

      // Reset form
      setNewPassword('');
      setConfirmNewPassword('');
      setExpandedSection(null);

    } catch (err) {
      console.error("Failed to change password:", err);
      setError("Failed to change password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden size-full items-center bg-background">
      <div className="flex flex-col w-full pt-1.5 md:pt-0">
        <TopAppBar />
      </div>
      <div className="flex flex-col gap-1 w-full max-w-2xl p-4">

        <h2 className="text-2xl font-bold mb-4 w-full text-center">Account</h2>

        {/* Email Section */}
        <Card className="hover:bg-gray-50 transition-colors rounded-b-none">
          <div
            className="py-4 px-6 cursor-pointer"
            onClick={() => toggleSection('email')}
          >
            <div className="flex items-center gap-4">
              <Mail className="w-6 h-6 text-gray-600" />
              <div className="flex-1">
                <h3 className="text-lg font-medium">Update Account Email</h3>
                <p className="text-sm text-gray-600">{email}</p>
              </div>
            </div>
          </div>

          {expandedSection === 'email' && (
            <div className="px-6 pb-6 border-t border-gray-100 mt-2 pt-4">
              <form action={handleChangeEmail}>
                <div className="flex flex-col md:flex-row md:items-end gap-2">
                  <TextInput
                    label="New Email Address"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    className="w-full"
                  />
                  <TonalButton type="submit" className="mb-[2px]">Update</TonalButton>
                </div>
              </form>
            </div>
          )}
        </Card>

        {/* Master Password Section */}
        <Card className="hover:bg-gray-50 transition-colors rounded-none">
          <div
            className="p-6 cursor-pointer"
            onClick={() => toggleSection('password')}
          >
            <div className="flex items-center gap-4">
              <Lock className="w-6 h-6 text-gray-600" />
              <div className="flex-1">
                <h3 className="text-lg font-medium">Change Master Password</h3>
              </div>
            </div>
          </div>

          {expandedSection === 'password' && (
            <div className="flex flex-col gap-2 px-6 pb-6 border-t border-gray-100 mt-2 pt-4">
              <PasswordInput
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <PasswordInput
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
              />
              <PasswordInput
                label="Confirm New Password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
              />

              <TonalButton
                onClick={handleChangePassword}
                className="btn-neutral w-full mt-2"
                disabled={isUpdatingPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
              >
                {isUpdatingPassword ? <CircularProgress size={20} /> : null}
                {isUpdatingPassword ? 'Updating...' : "Update Master Password"}
              </TonalButton>
            </div>
          )}
        </Card>

        {/* Sign Out Section */}
        <Card className="hover:bg-gray-50 transition-colors rounded-t-none">
          <div className="p-0">
            <form action={signOut} className="w-full">
              <button className="w-full p-6 flex items-center gap-4 text-left cursor-pointer">
                <LogOut className="w-6 h-6 text-gray-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium">Sign Out</h3>
                </div>
              </button>
            </form>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-3 rounded-md bg-error-container">
            <p className="text-on-error-container">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}