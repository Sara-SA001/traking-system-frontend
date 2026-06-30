'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { clearAuthSession } from '../lib/axios';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    clearAuthSession();
    router.push('/logout');
  }

  return (
    <Button type="button" variant="outline" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
