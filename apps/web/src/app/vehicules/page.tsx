'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { vehiclesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: { name: string };
  transmission: string;
  fuelType: string;
  doors: number;
  seats: number;
  pricePerDay: number;
  images: string[];
  status: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', transmission: '' });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await vehiclesApi.getAll(filters);
        setVehicles(response.data);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            CarLoc
          </Link>
          <nav className="flex gap-4">
            <Link href="/connexion" className="text-gray-600 hover:text-primary-600">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Nos véhicules</h1>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              className="px-4 py-2 border rounded-lg"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Toutes les catégories</option>
              <option value="economique">Économique</option>
              <option value="compact">Compact</option>
              <option value="berline">Berline</option>
              <option value="suv">SUV</option>
            </select>

            <select
              className="px-4 py-2 border rounded-lg"
              value={filters.transmission}
              onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
            >
              <option value="">Toutes transmissions</option>
              <option value="AUTO">Automatique</option>
              <option value="MANUAL">Manuelle</option>
            </select>
          </div>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/vehicules/${vehicle.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-200 relative">
                  {vehicle.images?.[0] ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🚗
                    </div>
                  )}
                  {vehicle.status !== 'AVAILABLE' && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                      Indisponible
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-500">{vehicle.category?.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    <span>🚪 {vehicle.doors}</span>
                    <span>👥 {vehicle.seats}</span>
                    <span>⚙️ {vehicle.transmission === 'AUTO' ? 'Auto' : 'Manuelle'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(vehicle.pricePerDay)}<span className="text-sm font-normal">/jour</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && vehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun véhicule disponible pour les filtres sélectionnés
          </div>
        )}
      </div>
    </div>
  );
}