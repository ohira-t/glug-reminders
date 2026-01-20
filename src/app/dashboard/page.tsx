'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from "@/components/layout/MainLayout";
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      if (!supabase) {
        router.replace('/login');
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/login');
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-[#8E8E93]">認証確認中...</p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}
