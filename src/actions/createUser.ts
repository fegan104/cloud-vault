"use server"
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createUser({ email, salt, publicKey }: { email: string; salt: string; publicKey: string }) {
  await prisma.user.create({
    data: { email, masterKeySalt: salt, publicKey },
  });
}