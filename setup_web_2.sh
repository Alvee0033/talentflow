#!/bin/bash
set -e
BASE_DIR="/home/alvee/Documents/antigravity/goofy-pascal/apps/web"

cat << 'FILE_EOF' > "$BASE_DIR/src/app/(auth)/layout.tsx"
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="max-w-md w-full">{children}</div>
    </div>
  );
}
FILE_EOF

cat << 'FILE_EOF' > "$BASE_DIR/src/app/(auth)/login/page.tsx"
"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({});
  };

  return (
    <div className="bg-card p-8 rounded-lg shadow-sm border text-card-foreground">
      <h1 className="text-2xl font-bold mb-6 text-center">TalentFlow Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" required className="w-full p-2 border rounded-md bg-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" required className="w-full p-2 border rounded-md bg-transparent" />
        </div>
        <button type="submit" className="w-full bg-primary text-primary-foreground p-2 rounded-md font-medium">
          Sign In
        </button>
      </form>
    </div>
  );
}
FILE_EOF

cat << 'FILE_EOF' > "$BASE_DIR/src/app/(auth)/forgot-password/page.tsx"
export default function ForgotPasswordPage() {
  return (
    <div className="bg-card p-8 rounded-lg shadow-sm border text-card-foreground">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
      <p className="text-center text-muted-foreground mb-4">Coming soon.</p>
    </div>
  );
}
FILE_EOF

cat << 'FILE_EOF' > "$BASE_DIR/src/app/(dashboard)/layout.tsx"
"use client";

import { AuthProvider } from "@/providers/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="w-64 border-r bg-card hidden md:block">
          <div className="p-4 font-bold text-xl border-b">TalentFlow</div>
          <nav className="p-4 space-y-2">
            <a href="/dashboard" className="block p-2 hover:bg-muted rounded-md">Home</a>
            <a href="/dashboard/tasks" className="block p-2 hover:bg-muted rounded-md">My Tasks</a>
            <a href="/dashboard/requisitions" className="block p-2 hover:bg-muted rounded-md">Requisitions</a>
            <a href="/dashboard/candidates" className="block p-2 hover:bg-muted rounded-md">Candidates</a>
            <a href="/dashboard/admin" className="block p-2 hover:bg-muted rounded-md">Administration</a>
          </nav>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center px-6 justify-between">
            <div className="font-medium">Dashboard</div>
            <div>Avatar</div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
FILE_EOF

cat << 'FILE_EOF' > "$BASE_DIR/src/app/(dashboard)/page.tsx"
export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to TalentFlow</h1>
      <p className="text-muted-foreground">Select an option from the sidebar to get started.</p>
    </div>
  );
}
FILE_EOF

