import { SiteHeader } from '@/components/site-header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50">
      <SiteHeader />
      <div className="flex flex-1 items-start justify-center px-4 py-10 md:items-center">
        <div className="w-full max-w-md rounded-xl border border-leaf bg-white p-6 shadow-sm md:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
