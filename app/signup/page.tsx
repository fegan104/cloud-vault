import { adminAuth } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function signupAction(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  await adminAuth.createUser({ email, password });
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCPxcrC5pNqdk08uhFR05Zs_3wZ1AB2uvI`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const { idToken } = await response.json();

  const session = await adminAuth.createSessionCookie(idToken, { expiresIn: 5 * 24 * 60 * 60 * 1000 });

  (await cookies()).set("session", session, { httpOnly: true, secure: true, path: "/" });
  redirect("/");
}

export default function SignupPage() {
  return (
    <form action={signupAction} className="p-6 space-y-4">
      <input name="email" type="email" placeholder="Email" className="border p-2 w-full" />
      <input name="password" type="password" placeholder="Password" className="border p-2 w-full" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Sign Up
      </button>
    </form>
  );
}