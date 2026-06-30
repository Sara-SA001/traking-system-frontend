'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthSession } from '../../lib/axios';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearAuthSession();
    router.replace('/login');
    router.refresh();
  }, [router]);

  return <div className="min-h-screen" />;
}
