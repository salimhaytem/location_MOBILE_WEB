'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await usersApi.getProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            CarLoc
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mes-reservations" className="text-gray-600 hover:text-primary-600">
              Mes réservations
            </Link>
            <button onClick={handleLogout} className="text-gray-600 hover:text-primary-600">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mon compte</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Nom complet</label>
                <p className="font-medium">{profile?.firstName} {profile?.lastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Téléphone</label>
                <p className="font-medium">{profile?.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Permis de conduire</label>
                <p className="font-medium">
                  {profile?.profile?.drivingLicenseNumber || 'Non enregistré'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Pièce d'identité</label>
                <p className="font-medium">
                  {profile?.profile?.idCardNumber || 'Non enregistré'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Statut du profil</label>
                <p className={`font-medium ${profile?.profile?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                  {profile?.profile?.isVerified ? 'Vérifié' : 'En attente de vérification'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <Link
                href="/mes-reservations"
                className="block w-full text-center py-2 px-4 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
              >
                Mes réservations
              </Link>
              <Link
                href="/vehicules"
                className="block w-full text-center py-2 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Louer un véhicule
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}