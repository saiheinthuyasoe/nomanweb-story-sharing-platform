'use client';

import { usePathname } from 'next/navigation';

interface ConditionalMainContentProps {
  children: React.ReactNode;
}

export default function ConditionalMainContent({ children }: ConditionalMainContentProps) {
  const pathname = usePathname();
  
  // Apply admin-content class for admin routes to prevent navbar padding
  const isAdminRoute = pathname?.startsWith('/admin');
  const mainContentClass = isAdminRoute 
    ? 'main-content admin-content' 
    : 'main-content';
  
  return (
    <main className={mainContentClass}>
      {children}
    </main>
  );
} 