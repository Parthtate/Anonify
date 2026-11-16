'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { headerGhostClass } from '@/components/site-header';

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: '/' })}
      className={headerGhostClass}
    >
      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
