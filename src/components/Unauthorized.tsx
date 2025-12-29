"use client"
import React from "react";
import { ShieldAlert } from "lucide-react";
import { TonalButton, TextButton } from "./Buttons";
import { deleteSessionToken } from "@/lib/session/deleteSessionsToken";
import { useRouter } from "next/navigation";
import { Card } from "./Card";

const Unauthorized: React.FC = () => {
  const router = useRouter();

  const handleAction = async (path: string) => {
    await deleteSessionToken();
    router.push(path);
  };

  return (
    <div className="flex items-center justify-center h-full w-full p-6">
      <div className="flex flex-col items-center justify-center bg-surface p-6 text-center rounded-md max-w-3xl">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-error" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Session Expired</h1>
        <p className="text-on-surface-variant max-w-md mb-8">
          Your session has expired or you are not authorized to view this page. Please sign in again to access your vault.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <TonalButton
            className="w-full sm:w-auto px-8 py-3"
            onClick={() => handleAction("/signin")}
          >
            Sign In
          </TonalButton>
          <TextButton
            className="w-full sm:w-auto px-8 py-3"
            onClick={() => handleAction("/signup")}
          >
            Sign Up
          </TextButton>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
