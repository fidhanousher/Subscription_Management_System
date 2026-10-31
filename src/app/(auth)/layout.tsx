export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Brightloop</p>
          <h1 className="mt-1 text-2xl font-semibold">Subscription billing</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
