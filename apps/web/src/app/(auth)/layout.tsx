export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/80 p-4 sm:p-6 text-slate-900">
      <div className="max-w-xl w-full">{children}</div>
    </div>
  );
}