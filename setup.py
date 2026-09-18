import os

BASE = "/home/alvee/Documents/antigravity/goofy-pascal/apps/web"

files = {
    "package.json": """{
  "name": "@talentflow/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.0.0",
    "@radix-ui/react-avatar": "^1.0.0",
    "@radix-ui/react-checkbox": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-label": "^2.0.0",
    "@radix-ui/react-popover": "^1.0.0",
    "@radix-ui/react-select": "^1.2.0",
    "@radix-ui/react-separator": "^1.0.0",
    "@radix-ui/react-slot": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-toast": "^1.1.0",
    "@talentflow/shared": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "axios": "^1.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^3.0.0",
    "lucide-react": "^0.300.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.0.0",
    "recharts": "^2.10.0",
    "sonner": "^1.0.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss": "^3.3.0",
    "zod": "^3.22.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "postcss": "^8.4.0",
    "typescript": "^5.0.0"
  }
}""",

    "tsconfig.json": """{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}""",

    "next.config.js": """/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@talentflow/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
module.exports = nextConfig;""",

    "postcss.config.js": """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};""",

    "tailwind.config.ts": """import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

export default config;""",

    "src/styles/globals.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --radius: 0.5rem;
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}""",

    "src/providers/query-provider.tsx": """"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}""",

    "src/providers/theme-provider.tsx": """"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}""",

    "src/providers/auth-provider.tsx": """"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => {
      setUser({ id: 1, name: "Admin User", role: "admin" });
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && pathname && !pathname.includes("/login")) {
      router.push("/login");
    }
  }, [isLoading, user, pathname, router]);

  const login = async (data: any) => {
    setUser({ id: 1, name: "Admin User", role: "admin" });
    router.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);""",

    "src/app/layout.tsx": """import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TalentFlow",
  description: "Talent Acquisition Coordination System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}""",

    "src/app/page.tsx": """import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}""",

    "src/app/(auth)/layout.tsx": """export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="max-w-md w-full">{children}</div>
    </div>
  );
}""",

    "src/app/(auth)/login/page.tsx": """"use client";

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
}""",

    "src/app/(auth)/forgot-password/page.tsx": """export default function ForgotPasswordPage() {
  return (
    <div className="bg-card p-8 rounded-lg shadow-sm border text-card-foreground">
      <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
      <p className="text-center text-muted-foreground mb-4">Coming soon.</p>
    </div>
  );
}""",

    "src/app/(dashboard)/layout.tsx": """"use client";

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
}""",

    "src/app/(dashboard)/page.tsx": """export default function DashboardHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to TalentFlow</h1>
      <p className="text-muted-foreground">Select an option from the sidebar to get started.</p>
    </div>
  );
}""",

    "src/components/layout/sidebar.tsx": """"use client";
export function Sidebar() { return <aside>Sidebar</aside>; }""",

    "src/components/layout/header.tsx": """"use client";
export function Header() { return <header>Header</header>; }""",

    "src/components/layout/mobile-nav.tsx": """"use client";
export function MobileNav() { return <nav>MobileNav</nav>; }""",

    "src/components/layout/breadcrumbs.tsx": """export function Breadcrumbs() { return <div>Breadcrumbs</div>; }""",

    "src/components/layout/page-header.tsx": """export function PageHeader({ title }: { title: string }) { return <h2 className="text-xl font-semibold mb-4">{title}</h2>; }""",

    "src/components/ui/button.tsx": """import { forwardRef } from "react";
export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => <button ref={ref} {...props} />);
Button.displayName = "Button";""",

    "src/components/ui/input.tsx": """import { forwardRef } from "react";
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => <input ref={ref} {...props} />);
Input.displayName = "Input";""",

    "src/components/ui/card.tsx": """export function Card({ children }: { children: React.ReactNode }) { return <div className="rounded-xl border bg-card text-card-foreground shadow">{children}</div>; }""",

    "src/components/ui/badge.tsx": """export function Badge({ children }: { children: React.ReactNode }) { return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{children}</span>; }""",

    "src/components/ui/skeleton.tsx": """export function Skeleton() { return <div className="animate-pulse rounded-md bg-muted" />; }""",

    "src/components/ui/avatar.tsx": """export function Avatar() { return <div className="h-10 w-10 rounded-full bg-muted" />; }""",

    "src/components/ui/dialog.tsx": """export function Dialog() { return <div>Dialog</div>; }""",

    "src/components/ui/dropdown-menu.tsx": """export function DropdownMenu() { return <div>DropdownMenu</div>; }""",

    "src/components/ui/select.tsx": """export function Select() { return <div>Select</div>; }""",

    "src/components/ui/tabs.tsx": """export function Tabs() { return <div>Tabs</div>; }""",

    "src/components/ui/table.tsx": """export function Table() { return <table>Table</table>; }""",

    "src/components/ui/toast.tsx": """export function Toast() { return <div>Toast</div>; }""",

    "src/components/ui/label.tsx": """export function Label() { return <label>Label</label>; }""",

    "src/components/ui/separator.tsx": """export function Separator() { return <hr />; }""",

    "src/components/ui/data-table.tsx": """export function DataTable() { return <div>DataTable</div>; }""",

    "src/components/shared/empty-state.tsx": """export function EmptyState() { return <div>EmptyState</div>; }""",

    "src/components/shared/loading-state.tsx": """export function LoadingState() { return <div>Loading...</div>; }""",

    "src/components/shared/error-boundary.tsx": """"use client";
import React from "react";
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { if (this.state.hasError) return <div>Something went wrong.</div>; return this.props.children; }
}""",

    "src/components/shared/confirm-dialog.tsx": """export function ConfirmDialog() { return <div>ConfirmDialog</div>; }""",

    "src/components/shared/status-badge.tsx": """export function StatusBadge() { return <div>StatusBadge</div>; }""",

    "src/components/shared/user-avatar.tsx": """export function UserAvatar() { return <div>UserAvatar</div>; }""",

    "src/components/shared/auto-save-indicator.tsx": """export function AutoSaveIndicator() { return <div>AutoSaveIndicator</div>; }""",

    "src/components/shared/permission-gate.tsx": """export function PermissionGate({ children }: { children: React.ReactNode }) { return <>{children}</>; }""",

    "src/hooks/use-auth.ts": """import { useAuth as useAuthContext } from "@/providers/auth-provider"; export const useAuth = () => useAuthContext();""",

    "src/hooks/use-permissions.ts": """export const usePermissions = () => ({ hasPermission: () => true, hasRole: () => true });""",

    "src/hooks/use-debounce.ts": """import { useState, useEffect } from "react"; export function useDebounce(value: any, delay: number) { const [debounced, setDebounced] = useState(value); useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]); return debounced; }""",

    "src/hooks/use-auto-save.ts": """export function useAutoSave() { return {}; }""",

    "src/hooks/use-pagination.ts": """import { useState } from "react"; export function usePagination() { return { page: 1, setPage: () => {} }; }""",

    "src/hooks/use-media-query.ts": """import { useState } from "react"; export function useMediaQuery() { return false; }""",

    "src/hooks/use-toast.ts": """import { toast } from "sonner"; export const useToast = () => ({ toast });""",

    "src/lib/api-client.ts": """import axios from "axios"; export const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });""",

    "src/lib/utils.ts": """import { clsx, type ClassValue } from "clsx"; import { twMerge } from "tailwind-merge"; export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }""",

    "src/lib/constants.ts": """export const APP_NAME = "TalentFlow";""",

    "src/lib/api/auth.api.ts": """export const authApi = {};""",
    "src/lib/api/requisitions.api.ts": """export const requisitionsApi = {};""",
    "src/lib/api/candidates.api.ts": """export const candidatesApi = {};""",
    "src/lib/api/interviews.api.ts": """export const interviewsApi = {};""",
    "src/lib/api/messages.api.ts": """export const messagesApi = {};""",
    "src/lib/api/tasks.api.ts": """export const tasksApi = {};""",
    "src/lib/api/joining.api.ts": """export const joiningApi = {};""",
    "src/lib/api/dashboard.api.ts": """export const dashboardApi = {};""",
    "src/lib/api/admin.api.ts": """export const adminApi = {};""",

    "src/lib/validations/auth.schema.ts": """import { z } from "zod"; export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });""",
    "src/lib/validations/requisition.schema.ts": """import { z } from "zod"; export const requisitionSchema = z.object({});""",
    "src/lib/validations/candidate.schema.ts": """import { z } from "zod"; export const candidateSchema = z.object({});""",

    "src/stores/sidebar.store.ts": """import { create } from "zustand"; export const useSidebarStore = create((set) => ({ isCollapsed: false, toggle: () => set((state: any) => ({ isCollapsed: !state.isCollapsed })) }));""",
    "src/stores/notification.store.ts": """import { create } from "zustand"; export const useNotificationStore = create((set) => ({ notifications: [] }));""",
}

STUBS = [
    "src/app/(dashboard)/tasks/page.tsx",
    "src/app/(dashboard)/requisitions/page.tsx",
    "src/app/(dashboard)/requisitions/new/page.tsx",
    "src/app/(dashboard)/requisitions/[id]/page.tsx",
    "src/app/(dashboard)/candidates/page.tsx",
    "src/app/(dashboard)/candidates/[id]/page.tsx",
    "src/app/(dashboard)/candidates/import/page.tsx",
    "src/app/(dashboard)/interviews/page.tsx",
    "src/app/(dashboard)/interviews/[id]/page.tsx",
    "src/app/(dashboard)/messages/page.tsx",
    "src/app/(dashboard)/messages/[id]/page.tsx",
    "src/app/(dashboard)/joining/page.tsx",
    "src/app/(dashboard)/joining/[id]/page.tsx",
    "src/app/(dashboard)/reports/page.tsx",
    "src/app/(dashboard)/admin/users/page.tsx",
    "src/app/(dashboard)/admin/roles/page.tsx",
    "src/app/(dashboard)/admin/organization/page.tsx",
    "src/app/(dashboard)/admin/templates/page.tsx",
    "src/app/(dashboard)/admin/evaluation-forms/page.tsx",
    "src/app/(dashboard)/admin/approval-flows/page.tsx"
]

for stub in STUBS:
    title = stub.split('/')[-2]
    if title.startswith('['):
        title = stub.split('/')[-3] + " Details"
    files[stub] = f'''import {{ PageHeader }} from "@/components/layout/page-header";

export default function StubPage() {{
  return (
    <div>
      <PageHeader title="{title.capitalize()}" />
      <p className="text-muted-foreground mt-4">Coming soon.</p>
    </div>
  );
}}'''

for filepath, content in files.items():
    full_path = os.path.join(BASE, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)

print("Created all files.")
