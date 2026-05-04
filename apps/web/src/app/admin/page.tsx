'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface DashboardData {
  totalVehicles: number;
  availableVehicles: number;
  totalReservations: number;
  activeReservations: number;
  todayReservations: number;
  monthlyRevenue: number;
  occupancyRate: number;
  pendingCashPayments: number;
}

interface TodayReservation {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  vehicle: { brand: string; model: string };
  pickupDate: string;
  returnDate: string;
  status: string;
}

interface CashTransaction {
  id: string;
  client: string;
  vehicle: string;
  amount: number;
  time: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ACTIVE: 'En cours',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [todayReservations, setTodayReservations] = useState<TodayReservation[]>([]);
  const [cashJournal, setCashJournal] = useState<CashTransaction[]>([]);
  const [revenueChart, setRevenueChart] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [dashboardRes, reservationsRes, cashRes, chartRes] = await Promise.all([
          adminApi.getDashboard(),
          fetch('http://localhost:4000/admin/today-reservations', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          adminApi.getCashJournal('today'),
          fetch('http://localhost:4000/admin/revenue-chart', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
        ]);

        setDashboard(dashboardRes.data);
        const reservationsData = await reservationsRes.json();
        setTodayReservations(reservationsData.data || []);
        setCashJournal(cashRes.data.transactions || []);
        const chartData = await chartRes.json();
        setRevenueChart(chartData.data || []);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement du dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Administrateur</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">Revenus du mois</div>
          <div className="text-3xl font-bold text-green-600">
            {formatPrice(dashboard?.monthlyRevenue || 0)}
          </div>
          <div className="text-sm text-green-500 mt-1">↑ 12% vs mois dernier</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">Réservations actives</div>
          <div className="text-3xl font-bold text-blue-600">
            {dashboard?.activeReservations || 0}
          </div>
          <div className="text-sm text-gray-500 mt-1">{dashboard?.todayReservations || 0 départ aujourd'hui</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">Taux d'occupation</div>
          <div className="text-3xl font-bold text-purple-600">
            {(dashboard?.occupancyRate || 0).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {dashboard?.availableVehicles || 0} / {dashboard?.totalVehicles || 0} véhicules
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-2">Cash en attente</div>
          <div className="text-3xl font-bold text-orange-600">
            {formatPrice(dashboard?.pendingCashPayments || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Paiements espèces à recevoir</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Today's Reservations Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Réservations du jour</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Véhicule</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Heure</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {todayReservations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      Aucune réservation aujourd'hui
                    </td>
                  </tr>
                ) : (
                  todayReservations.slice(0, 5).map((res) => (
                    <tr key={res.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{res.user.firstName} {res.user.lastName}</div>
                        <div className="text-xs text-gray-500">{res.user.email}</div>
                      </td>
                      <td className="py-3 px-2">{res.vehicle.brand} {res.vehicle.model}</td>
                      <td className="py-3 px-2 text-sm">
                        {new Date(res.pickupDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[res.status] || 'bg-gray-100'}`}>
                          {statusLabels[res.status] || res.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash Journal */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Journal de caisse</h2>
          <div className="space-y-3">
            {cashJournal.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune transaction aujourd'hui
              </div>
            ) : (
              cashJournal.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{tx.client}</div>
                    <div className="text-sm text-gray-500">{tx.vehicle}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{formatPrice(tx.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {cashJournal.length > 0 && (
            <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-green-600">
                {formatPrice(cashJournal.reduce((acc, tx) => acc + tx.amount, 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Revenus des 30 derniers jours</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}€`} />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Revenu']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}