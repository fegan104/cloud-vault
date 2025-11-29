import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MasterKeyProvider } from '../components/MasterKeyContext';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cloud vault",
  description: "An end-to-end encrypted cloud file storage web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} 
          antialiased bg-background font-mono 
          h-full overflow-hidden flex flex-col`}
      >
        <MasterKeyProvider>{children}</MasterKeyProvider>
      </body>
    </html>
  );
}
