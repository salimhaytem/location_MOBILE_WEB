'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { vehiclesApi } from '@/lib/api';
import { formatPrice, calculateDays } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useReservationStore } from '@/store/reservationStore';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: { name: string; basePricePerDay: number };
  registrationNumber: string;
  year: number;
  color: string;
  transmission: string;
  fuelType: string;
  doors: number;
  seats: number;
  luggage: number;
  pricePerDay: number;
  pricePerKm: number;
  deposit: number;
  images: string[];
  description: string;
  features: string[];
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { setPendingReservation } = useReservationStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [bookingData, setBookingData] = useState({
    pickupDate: '',
    returnDate: '',
    pickupLocation: 'Paris',
    returnLocation: 'Paris',
    insurance: false,
    gps: false,
    babySeat: false,
  });

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await vehiclesApi.getOne(params.id as string);
        setVehicle(response.data);
      } catch (error) {
        console.error('Error fetching vehicle:', error);
      } finally {
        setLoading(false);
      }
    };
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/vehicles/${params.id}/reviews`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setReviews(data.data || []);
      } catch (e) { console.log('No reviews'); }
    };
    fetchVehicle();
    fetchReviews();
  }, [params.id]);

  const handleProceedToReservation = () => {
    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }

    if (!bookingData.pickupDate || !bookingData.returnDate) {
      alert('Veuillez sélectionner les dates de location');
      return;
    }

    setPendingReservation({
      vehicleId: vehicle!.id,
      vehicleName: `${vehicle!.brand} ${vehicle!.model}`,
      vehicleImage: vehicle!.images?.[0],
      pricePerDay: vehicle!.pricePerDay,
      pickupDate: bookingData.pickupDate,
      returnDate: bookingData.returnDate,
      pickupLocation: bookingData.pickupLocation,
      returnLocation: bookingData.returnLocation,
      duration: days,
      insurance: bookingData.insurance,
      gps: bookingData.gps,
      babySeat: bookingData.babySeat,
    });

    router.push('/reservation');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!vehicle) return <div className="min-h-screen flex items-center justify-center">Véhicule non trouvé</div>;

  const days = bookingData.pickupDate && bookingData.returnDate
    ? calculateDays(bookingData.pickupDate, bookingData.returnDate)
    : 0;

  const optionsPrice = (bookingData.insurance ? 150 : 0) + (bookingData.gps ? 80 : 0) + (bookingData.babySeat ? 60 : 0);
  const totalPrice = days > 0 ? (vehicle.pricePerDay + optionsPrice) * days : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/vehicules" className="text-2xl font-bold text-primary-600">
            CarLoc
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-4">
              {vehicle.images?.length > 0 ? (
                <img
                  src={vehicle.images[selectedImage]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-80 object-cover"
                />
              ) : (
                <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-6xl">
                  🚗
                </div>
              )}
            </div>
            {vehicle.images?.length > 1 && (
              <div className="flex gap-2">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-16 rounded overflow-hidden ${selectedImage === idx ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-4">
              <h2 className="text-2xl font-bold mb-4">
                {vehicle.brand} {vehicle.model}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl">🚪</div>
                  <div className="text-sm text-gray-600">{vehicle.doors} portes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl">👥</div>
                  <div className="text-sm text-gray-600">{vehicle.seats} places</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl">⚙️</div>
                  <div className="text-sm text-gray-600">{vehicle.transmission === 'AUTO' ? 'Auto' : 'Manuelle'}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl">⛽</div>
                  <div className="text-sm text-gray-600">{vehicle.fuelType}</div>
                </div>
              </div>

              {vehicle.description && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{vehicle.description}</p>
                </div>
              )}

              {vehicle.features?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Équipements</h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature, idx) => (
                      <span key={idx} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <div className="text-3xl font-bold text-primary-600 mb-4">
                {formatPrice(vehicle.pricePerDay)}
                <span className="text-lg font-normal text-gray-500">/jour</span>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de départ
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={bookingData.pickupDate}
                    onChange={(e) => setBookingData({ ...bookingData, pickupDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de retour
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg"
                    value={bookingData.returnDate}
                    onChange={(e) => setBookingData({ ...bookingData, returnDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu de prise en charge
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg"
                    value={bookingData.pickupLocation}
                    onChange={(e) => setBookingData({ ...bookingData, pickupLocation: e.target.value })}
                  >
                    <option>Paris</option>
                    <option>Lyon</option>
                    <option>Marseille</option>
                  </select>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Options</h4>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={bookingData.insurance}
                      onChange={(e) => setBookingData({ ...bookingData, insurance: e.target.checked })}
                    />
                    <span>Assurance tous risques (+150 MAD/jour)</span>
                  </label>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={bookingData.gps}
                      onChange={(e) => setBookingData({ ...bookingData, gps: e.target.checked })}
                    />
                    <span>GPS (+80 MAD/jour)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bookingData.babySeat}
                      onChange={(e) => setBookingData({ ...bookingData, babySeat: e.target.checked })}
                    />
                    <span>Siège bébé (+60 MAD/jour)</span>
                  </label>
                </div>
              </div>

              {days > 0 && (
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span>{vehicle.pricePerDay}€ x {days} jour(s)</span>
                    <span>{vehicle.pricePerDay * days}€</span>
                  </div>
                  {optionsPrice > 0 && (
                    <div className="flex justify-between mb-2">
                      <span>Options</span>
                      <span>{optionsPrice * days}€</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Caution: 2000 MAD
                  </div>
                </div>
              )}

              <button
                onClick={handleProceedToReservation}
                disabled={vehicle.status !== 'AVAILABLE' || days === 0}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {vehicle.status === 'AVAILABLE' ? 'Réserver maintenant' : 'Indisponible'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto px-4 pb-8">
          <h2 className="text-2xl font-bold mb-4">Avis clients</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  <span className="text-sm text-gray-500">{review.user.firstName} {review.user.lastName}</span>
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {review.comment && <p className="text-gray-700">{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}