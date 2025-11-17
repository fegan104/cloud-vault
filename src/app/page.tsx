import { prisma } from "@/lib/db";
import { getUser } from "@/lib/getUser";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

async function signoutAction() {
  "use server";
  const requestCookies = await cookies();
  const sessionToken = requestCookies.get("session")?.value;
  await prisma.session.delete({ where: { sessionToken } })
  requestCookies.delete("session");
  redirect("/");
}

export default async function Home() {
  const user = await getUser()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {user ? (
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Welcome, {user.email}
            </h1>
            <form action={signoutAction}>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              You are not signed in.
            </h1>
            <Link href="/signin" className="bg-blue-600 text-white px-4 py-2 rounded">
              Sign In
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
