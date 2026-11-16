import { SiteHeader } from '@/components/site-header';
import { SignOutButton } from '@/components/sign-out-button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <SiteHeader homeHref="/dashboard">
        <SignOutButton />
      </SiteHeader>
      {children}
    </div>
  );
}
