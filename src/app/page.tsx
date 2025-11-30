import Link from "next/link";
import { Key } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--color-primary-container) 0%, var(--color-tertiary-container) 100%)' }}>
      <main className="flex min-h-screen w-full max-w-5xl mx-auto flex-col items-center justify-center py-16 px-6">
        <div className="w-full max-w-2xl">
          {/* Hero Card */}
          <div className="bg-surface rounded-[var(--radius-xl)] p-10 shadow-[--shadow-4] text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-container mb-6">
              <Key className="w-10 h-10 text-on-primary-container" />
            </div>
            <h1 className="text-[--font-display-sm] font-bold text-on-surface mb-4">
              Secure File Encryption
            </h1>
            <p className="text-[--font-body-lg] text-on-surface-variant mb-10 max-w-lg mx-auto">
              Protect your files with end-to-end encryption. Your data stays private and secure with client-side encryption.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-[--font-label-md] font-medium">
                🔒 End-to-End Encrypted
              </div>
              <div className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-[--font-label-md] font-medium">
                🚀 Zero-Knowledge
              </div>
              <div className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container text-[--font-label-md] font-medium">
                ✨ Secure Storage
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-full
                           font-semibold text-[--font-label-lg] shadow-[--shadow-3]
                           hover:shadow-[--shadow-4] hover:brightness-110
                           active:shadow-[--shadow-2]
                           transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href="/signin"
                className="w-full sm:w-auto bg-secondary text-on-secondary px-8 py-4 rounded-full
                           font-semibold text-[--font-label-lg] shadow-[--shadow-2]
                           hover:shadow-[--shadow-3] hover:brightness-110
                           active:shadow-[--shadow-1]
                           transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
