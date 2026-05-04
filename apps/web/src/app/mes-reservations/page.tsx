'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { reservationsApi } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';

interface Reservation {
  id: string;
  vehicle: { brand: string; model: string; images: string[] };
  pickupDate: string;
  returnDate: string;
  status: string;
  totalPrice: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export default function ReservationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }

    const fetchReservations = async () => {
      try {
        const response = await reservationsApi.getAll();
        setReservations(response.data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [isAuthenticated, router]);

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      await reservationsApi.cancel(id);
      setReservations(reservations.map(r =>
        r.id === id ? { ...r, status: 'CANCELLED' } : r
      ));
    } catch (error) {
      alert('Erreur lors de l\'annulation');
    }
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
            <Link href="/mon-compte" className="text-gray-600 hover:text-primary-600">
              Mon compte
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mes réservations</h1>
          <Link
            href="/vehicules"
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Nouvelle réservation
          </Link>
        </div>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🚗</div>
            <h2 className="text-xl font-semibold mb-2">Aucune réservation</h2>
            <p className="text-gray-500 mb-4">Vous n'avez pas encore de réservations</p>
            <Link
              href="/vehicules"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              Louer un véhicule
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-32 bg-gray-200">
                    {reservation.vehicle.images?.[0] ? (
                      <img
                        src={reservation.vehicle.images[0]}
                        alt={`${reservation.vehicle.brand} ${reservation.vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🚗
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {reservation.vehicle.brand} {reservation.vehicle.model}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(reservation.pickupDate)} - {formatDate(reservation.returnDate)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status]}`}>
                        {statusLabels[reservation.status]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(reservation.totalPrice)}
                      </span>
                      <div className="flex gap-2">
                        {reservation.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(reservation.id)}
                            className="px-4 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
                          >
                            Annuler
                          </button>
                        )}
                        {(reservation.status === 'CONFIRMED' || reservation.status === 'ACTIVE') && (
                          <button className="px-4 py-1 text-primary-600 border border-primary-200 rounded hover:bg-primary-50">
                            Voir détails
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}