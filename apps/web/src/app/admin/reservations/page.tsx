'use client';
import { useState, useEffect } from 'react';

interface Reservation {
  id: string;
  status: string;
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  paymentMethod: string;
  user: { firstName: string; lastName: string; email: string };
  vehicle: { brand: string; model: string };
}

export default function ReservationsAdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      let filtered = data.data || data;
      if (filter !== 'all') {
        filtered = filtered.filter((r: Reservation) => r.status === filter);
      }
      setReservations(filtered);
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      ACTIVE: 'Active',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des réservations</h1>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'
            }`}
          >
            {status === 'all' ? 'Toutes' : status === 'PENDING' ? 'En attente' : status === 'CONFIRMED' ? 'Confirmées' : status === 'ACTIVE' ? 'Actives' : status === 'COMPLETED' ? 'Terminées' : 'Annulées'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">Chargement...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Aucune réservation</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Véhicule</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Paiement</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{res.user.firstName} {res.user.lastName}</div>
                    <div className="text-xs text-gray-500">{res.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{res.vehicle.brand} {res.vehicle.model}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>{new Date(res.pickupDate).toLocaleDateString('fr-FR')}</div>
                    <div className="text-gray-500">→ {new Date(res.returnDate).toLocaleDateString('fr-FR')}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{res.totalPrice} MAD</td>
                  <td className="px-4 py-3 text-sm">
                    {res.paymentMethod === 'CARD' ? '💳 Carte' : res.paymentMethod === 'CASH' ? '💵 Espèces' : res.paymentMethod}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(res.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}