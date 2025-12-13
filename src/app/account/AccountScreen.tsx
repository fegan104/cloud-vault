"use client";
import { User } from "@prisma/client";
import { signOut, updateEmail } from "./actions";
import { Card } from "@/components/Card";
import { TonalButton } from "@/components/Buttons";
import { PasswordInput, TextInput } from "@/components/TextInput";
import { useState } from "react";
import { Mail, Lock, LogOut, Check } from "lucide-react";

export default function AccountScreen({ user }: { user: User }) {
  const [email, setEmail] = useState(user.email);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="flex flex-col gap-4 overflow-hidden h-full items-center bg-background p-4">
      <div className="flex flex-col gap-1 w-full max-w-2xl">

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
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          {expandedSection === 'email' && (
            <div className="px-6 pb-6 border-t border-gray-100 mt-2 pt-4">
              <form action={async () => {
                await updateEmail(email);
                setExpandedSection(null);
              }}>
                <div className="flex items-end gap-2">
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
            <div className="px-6 pb-6 border-t border-gray-100 mt-2 pt-4 opacity-50" title="Coming soon">
              <div className="flex flex-col gap-2 pointer-events-none">
                <PasswordInput
                  label="Current Password"
                  value=""
                  onChange={() => { }}
                />
                <PasswordInput
                  label="New Password"
                  value=""
                  onChange={() => { }}
                />
                <TonalButton disabled className="btn-neutral w-full mt-2">Update Master Password</TonalButton>
              </div>
              <p className="text-xs mt-2 text-center">This feature is currently disabled.</p>
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