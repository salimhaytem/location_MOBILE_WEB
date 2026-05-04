'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/staff/planning', label: 'Planning', icon: '📅' },
  { href: '/staff/vehicules', label: 'Véhicules', icon: '🚗' },
  { href: '/staff/incidents', label: 'Incidents', icon: '⚠️' },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connexion');
    } else if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || (user?.role !== 'STAFF' && user?.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-56 bg-white shadow-lg">
        <div className="p-4 border-b">
          <Link href="/staff/planning" className="text-xl font-bold text-primary-600">
            CarLoc Staff
          </Link>
        </div>
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg mb-1"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
            <span>🏠</span>
            <span>Retour site</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}