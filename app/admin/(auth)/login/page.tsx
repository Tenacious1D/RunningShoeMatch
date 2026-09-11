import Link from "next/link";

import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 block text-center text-lg font-bold tracking-tight text-foreground">
          Running Shoe Match
        </Link>
        <AdminLoginForm />
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Authentication alone does not grant administrator access.
        </p>
      </div>
    </main>
  );
}
