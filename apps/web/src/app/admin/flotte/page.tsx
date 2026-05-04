'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { vehiclesApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUpload } from 'react-icons/fi';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  registrationNumber: string;
  year: number;
  category: { id: string; name: string };
  transmission: string;
  fuelType: string;
  doors: number;
  seats: number;
  pricePerDay: number;
  deposit: number;
  mileage: number;
  status: string;
  images: string[];
}

interface Category {
  id: string;
  name: string;
  basePricePerDay: number;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  RENTED: 'bg-blue-100 text-blue-800',
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  MAINTENANCE: 'Maintenance',
  RENTED: 'Loué',
};

export default function FleetPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    categoryId: '',
    registrationNumber: '',
    transmission: 'MANUAL',
    fuelType: 'PETROL',
    doors: 5,
    seats: 5,
    pricePerDay: 0,
    deposit: 2000,
    mileage: 0,
    images: [] as string[],
    description: '',
    features: [] as string[],
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/connexion');
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [vehiclesRes, categoriesRes] = await Promise.all([
        vehiclesApi.getAll(filters),
        vehiclesApi.getCategories(),
      ]);
      setVehicles(vehiclesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        categoryId: vehicle.category?.id || '',
        registrationNumber: vehicle.registrationNumber,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        doors: vehicle.doors,
        seats: vehicle.seats,
        pricePerDay: vehicle.pricePerDay,
        deposit: vehicle.deposit,
        mileage: vehicle.mileage,
        images: vehicle.images || [],
        description: '',
        features: [],
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        categoryId: categories[0]?.id || '',
        registrationNumber: '',
        transmission: 'MANUAL',
        fuelType: 'PETROL',
        doors: 5,
        seats: 5,
        pricePerDay: 0,
        deposit: 2000,
        mileage: 0,
        images: [],
        description: '',
        features: [],
      });
    }
    setShowModal(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 10) {
      alert('Maximum 10 photos');
      return;
    }
    const newImages = files.map((file) => URL.createObjectURL(file));
    setFormData({ ...formData, images: [...formData.images, ...newImages] });
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        year: parseInt(String(formData.year)),
        pricePerDay: parseFloat(String(formData.pricePerDay)),
        deposit: parseFloat(String(formData.deposit)),
        mileage: parseInt(String(formData.mileage)),
        doors: parseInt(String(formData.doors)),
        seats: parseInt(String(formData.seats)),
      };

      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, data);
      } else {
        await vehiclesApi.create(data);
      }

      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await vehiclesApi.updateStatus(id, status);
      fetchData();
    } catch (error) {
      alert('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return;
    try {
      await vehiclesApi.delete(id);
      fetchData();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="text-center py-12">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion de la flotte</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <FiPlus /> Ajouter un véhicule
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 mb-6">
        <select
          className="px-4 py-2 border rounded-lg"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Tous les statuts</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RENTED">Loué</option>
        </select>

        <select
          className="px-4 py-2 border rounded-lg"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Photo</th>
              <th className="text-left py-3 px-4">Véhicule</th>
              <th className="text-left py-3 px-4">Immatriculation</th>
              <th className="text-left py-3 px-4">Catégorie</th>
              <th className="text-left py-3 px-4">Prix/jour</th>
              <th className="text-left py-3 px-4">Statut</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Aucun véhicule trouvé
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                      {vehicle.images?.[0] ? (
                        <img src={vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🚗</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                    <div className="text-sm text-gray-500">{vehicle.year}</div>
                  </td>
                  <td className="py-3 px-4">{vehicle.registrationNumber}</td>
                  <td className="py-3 px-4">{vehicle.category?.name}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(vehicle.pricePerDay)}</td>
                  <td className="py-3 px-4">
                    <select
                      value={vehicle.status}
                      onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[vehicle.status]}`}
                    >
                      <option value="AVAILABLE">Disponible</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RENTED">Loué</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(vehicle)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <FiX size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marque</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Modèle</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Année</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Immatriculation</label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transmission</label>
                <select
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="MANUAL">Manuelle</option>
                  <option value="AUTO">Automatique</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Carburant</label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="PETROL">Essence</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="ELECTRIC">Électrique</option>
                  <option value="HYBRID">Hybride</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de places</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix/jour (MAD)</label>
                <input
                  type="number"
                  value={formData.pricePerDay}
                  onChange={(e) => setFormData({ ...formData, pricePerDay: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Caution (MAD)</label>
                <input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kilométrage actuel</label>
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Photos */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Photos ({formData.images.length}/10)</label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.images.map((photo, idx) => (
                      <div key={idx} className="relative">
                        <img src={photo} alt={`Photo ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {formData.images.length < 10 && (
                  <label className="flex flex-col items-center cursor-pointer">
                    <FiUpload className="text-2xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Ajouter des photos</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {editingVehicle ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}