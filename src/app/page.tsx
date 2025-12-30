import Link from "next/link";
import { Key } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, var(--color-primary-container) 0%, var(--color-secondary-container) 100%)' }}>
      <main className="flex min-h-screen w-full max-w-5xl mx-auto flex-col items-center justify-center py-16 px-6">
        <div className="w-full max-w-2xl">
          {/* Hero Card */}
          <div className="bg-surface rounded-[var(--radius-xl)] p-10 shadow-[--shadow-4] text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-container mb-6">
              <Key className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-[--font-display-sm] font-bold text-on-surface mb-4">
              Cloud Vault
            </h1>
            <p className="text-[--font-body-lg] text-on-surface-variant mb-10 max-w-lg mx-auto text-left">
              Cloud Vault is a secure cloud storage vault where files are encrypted client-side using <a className="text-primary underline" href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard">AES-GCM</a>.

              Encryption keys are derived by the client and server through an asymmetric password-authenticated key exchange (<a className="text-primary underline" href="https://eprint.iacr.org/2018/163.pdf">OPAQUE</a>). Even if the server database is compromised, attackers cannot perform offline brute-force or dictionary attacks to recover your master key.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-full
                           font-semibold shadow-[--shadow-3]
                           hover:shadow-[--shadow-4] hover:brightness-110
                           active:shadow-[--shadow-2]
                           transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href="/signin"
                className="w-full sm:w-auto bg-secondary text-on-secondary px-8 py-4 rounded-full
                           font-semibold shadow-[--shadow-2]
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
