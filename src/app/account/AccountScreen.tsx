"use client";
import { User } from "@prisma/client";
import { signOut, updateEmail, getAllEncryptedFilesKeyDerivationParams, updateEncryptedFilesKeyDerivationParams } from "./actions";
import { Card } from "@/components/Card";
import { TonalButton } from "@/components/Buttons";
import { PasswordInput, TextInput } from "@/components/TextInput";
import { useState } from "react";
import { Mail, Lock, LogOut, Check } from "lucide-react";
import { useMasterKey } from "@/components/MasterKeyContext";
import { deriveKeypair, deriveMasterKey, generateIv, generateSalt, rewrapKey } from "@/lib/clientCrypto";
import { base64ToUint8Array, uint8ToBase64 } from "@/lib/arrayHelpers";
import CircularProgress from "@/components/CircularProgress";
import { TopAppBar } from "@/components/TopAppBar";

export default function AccountScreen({ currentEmail, masterKeySalt }: { currentEmail: string, masterKeySalt: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { setMasterKey } = useMasterKey()
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) return;

    setIsUpdatingPassword(true);
    try {
      // derive current master key
      const salt = base64ToUint8Array(masterKeySalt);
      const currentMasterKey = await deriveMasterKey(currentPassword, salt);

      // derive new master key
      const newMasterKeySalt = generateSalt();
      const newMasterKey = await deriveMasterKey(newPassword, newMasterKeySalt);

      // fetch all encrypted file key derivation data
      const files = await getAllEncryptedFilesKeyDerivationParams();

      // decrypt all wrappedFileKeys and rewrap with new master key
      const updates = await Promise.all(files.map(async (file) => {
        const { wrappedKey: newWrappedFileKey, wrappedKeyIv: newKeyWrapIv } = await rewrapKey({
          wrappedKey: file.wrappedFileKey,
          wrappedKeyIv: file.keyWrapIv,
          unwrappingKey: currentMasterKey,
          wrappingKey: newMasterKey,
        });

        return {
          id: file.id,
          wrappedFileKey: newWrappedFileKey,
          keyWrapIv: newKeyWrapIv,
        };
      }));

      // update all encrypted file key derivation data in database transactionally
      const { publicKey } = await deriveKeypair(newPassword, newMasterKeySalt);
      await updateEncryptedFilesKeyDerivationParams(updates, uint8ToBase64(publicKey), uint8ToBase64(newMasterKeySalt));

      // update master key with master key context
      setMasterKey(newMasterKey);

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setExpandedSection(null);

    } catch (err) {
      console.error("Failed to change password:", err);
      // TODO: Handle error (e.g. wrong current password causing unwrap failure)
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden size-full items-center bg-background">
      <div className="flex flex-col w-full pt-1.5">
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
              <form action={async () => {
                await updateEmail(email);
                setExpandedSection(null);
              }}>
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
                disabled={isUpdatingPassword}
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
      </div>
    </div>
  );
}