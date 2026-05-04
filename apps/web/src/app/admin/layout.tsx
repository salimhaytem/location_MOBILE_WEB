'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/flotte', label: 'Flotte', icon: '🚗' },
  { href: '/admin/reservations', label: 'Réservations', icon: '📋' },
  { href: '/admin/personnel', label: 'Personnel', icon: '👥' },
  { href: '/admin/avis', label: 'Avis clients', icon: '⭐' },
  { href: '/admin/incidents', label: 'Incidents', icon: '⚠️' },
  { href: '/admin/rapports', label: 'Rapports', icon: '📈' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connexion');
    } else if (user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <Link href="/admin" className="text-2xl font-bold text-primary-600">
            CarLoc Admin
          </Link>
        </div>
        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 rounded-lg mb-1 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t mt-auto">
          <Link
            href="/mon-compte"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span>👤</span>
            <span>Mon compte</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <span>🏠</span>
            <span>Retour au site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}