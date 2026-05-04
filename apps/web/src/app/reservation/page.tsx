'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useReservationStore } from '@/store/reservationStore';
import { useAuthStore } from '@/store/authStore';
import { reservationsApi } from '@/lib/api';
import { formatPrice, calculateDays, formatDate } from '@/lib/utils';
import { PaymentMethod } from '@carloc/shared';

const OPTIONS = {
  insurance: { name: 'Assurance tous risques', price: 150, description: 'Couverture complète sans franchise' },
  gps: { name: 'GPS', price: 80, description: 'Navigation GPS intégré' },
  babySeat: { name: 'Siège bébé', price: 60, description: 'Siège auto homologué' },
};

const DEPOSIT = 2000;
const TVA_RATE = 0.2;

export default function ReservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { pendingReservation, updateOptions, updatePaymentMethod, clearReservation } = useReservationStore();

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }

    if (!pendingReservation) {
      router.push('/vehicules');
    }
  }, [isAuthenticated, pendingReservation, router]);

  if (!pendingReservation) {
    return null;
  }

  const {
    vehicleId,
    vehicleName,
    vehicleImage,
    pricePerDay,
    pickupDate,
    returnDate,
    pickupLocation,
    returnLocation,
    duration,
    insurance,
    gps,
    babySeat,
  } = pendingReservation;

  const optionsTotal = (insurance ? OPTIONS.insurance.price : 0) +
    (gps ? OPTIONS.gps.price : 0) +
    (babySeat ? OPTIONS.babySeat.price : 0);

  const subtotal = (pricePerDay * duration) + (optionsTotal * duration);
  const tva = subtotal * TVA_RATE;
  const total = subtotal + tva;

  const handleConfirm = async () => {
    if (!selectedPayment) {
      setError('Veuillez sélectionner un mode de paiement');
      return;
    }

    if (selectedPayment === 'CARD' && !showCardForm) {
      setShowCardForm(true);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await reservationsApi.create({
        vehicleId,
        pickupDate,
        returnDate,
        pickupLocation,
        returnLocation,
        insurance,
        gps,
        babySeat,
      });

      clearReservation();
      router.push('/mes-reservations');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la réservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            CarLoc
          </Link>
          <nav className="flex gap-4">
            <Link href="/vehicules" className="text-gray-600 hover:text-primary-600">
              Véhicules
            </Link>
            <Link href="/mon-compte" className="text-gray-600 hover:text-primary-600">
              Mon compte
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Finaliser votre réservation</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Véhicule sélectionné</h2>
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-gray-200 rounded-lg overflow-hidden">
                  {vehicleImage ? (
                    <img src={vehicleImage} alt={vehicleName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🚗</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{vehicleName}</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">Départ:</span> {formatDate(pickupDate)}
                    </div>
                    <div>
                      <span className="text-gray-500">Retour:</span> {formatDate(returnDate)}
                    </div>
                    <div>
                      <span className="text-gray-500">Durée:</span> {duration} jour(s)
                    </div>
                    <div>
                      <span className="text-gray-500">Prix/jour:</span> {formatPrice(pricePerDay)}
                    </div>
                    <div>
                      <span className="text-gray-500">Lieu:</span> {pickupLocation}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Options supplémentaires</h2>
              <div className="space-y-3">
                {Object.entries(OPTIONS).map(([key, option]) => {
                  const isSelected = key === 'insurance' ? insurance : key === 'gps' ? gps : babySeat;
                  return (
                    <label
                      key={key}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            updateOptions({
                              [key]: e.target.checked,
                            })
                          }
                          className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-sm text-gray-500">{option.description}</div>
                        </div>
                      </div>
                      <div className="text-primary-600 font-medium">+{formatPrice(option.price)}/jour</div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Mode de paiement</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {/* Card Payment */}
                <label
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayment === 'CARD' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="CARD"
                      checked={selectedPayment === 'CARD'}
                      onChange={() => {
                        setSelectedPayment('CARD');
                        updatePaymentMethod('CARD');
                        setShowCardForm(false);
                      }}
                      className="w-5 h-5 text-primary-600"
                    />
                    <div>
                      <div className="font-medium">💳 Carte bancaire</div>
                      <div className="text-sm text-gray-500">Paiement sécurisé par Stripe</div>
                    </div>
                  </div>
                </label>

                {selectedPayment === 'CARD' && showCardForm && (
                  <div className="ml-8 p-4 bg-gray-50 rounded-lg border">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro de carte
                        </label>
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          value={cardData.number}
                          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date d'expiration
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            value={cardData.cvc}
                            onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash Payment */}
                <label
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayment === 'CASH' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="CASH"
                      checked={selectedPayment === 'CASH'}
                      onChange={() => {
                        setSelectedPayment('CASH');
                        updatePaymentMethod('CASH');
                        setShowCardForm(false);
                      }}
                      className="w-5 h-5 text-primary-600"
                    />
                    <div>
                      <div className="font-medium">💵 Espèces en agence</div>
                      <div className="text-sm text-gray-500">Paiement à la prise en charge</div>
                    </div>
                  </div>
                </label>

                {selectedPayment === 'CASH' && (
                  <div className="ml-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-xl">ℹ️</span>
                      <div>
                        <div className="font-medium text-blue-800">Instructions</div>
                        <div className="text-sm text-blue-600">
                          Présentez-vous en agence dans les 30 minutes suivant la confirmation.
                          Le paiement sera effectué lors de la remise des clés.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transfer Payment */}
                <label
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPayment === 'TRANSFER' ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="TRANSFER"
                      checked={selectedPayment === 'TRANSFER'}
                      onChange={() => {
                        setSelectedPayment('TRANSFER');
                        updatePaymentMethod('TRANSFER');
                        setShowCardForm(false);
                      }}
                      className="w-5 h-5 text-primary-600"
                    />
                    <div>
                      <div className="font-medium">🏦 Virement / Mobile Money</div>
                      <div className="text-sm text-gray-500">IBAN ou numéro Mobile Money</div>
                    </div>
                  </div>
                </label>

                {selectedPayment === 'TRANSFER' && (
                  <div className="ml-8 p-4 bg-gray-50 border rounded-lg">
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Coordonnées bancaires:</p>
                      <div className="space-y-1 text-sm">
                        <p>Banque: BMCE</p>
                        <p>IBAN: MA12 1234 5678 9012 3456 7890</p>
                        <p>Code Swift: BMCE MAMR</p>
                      </div>
                      <p className="mt-3 text-yellow-600">
                        ⚠️ La réservation sera confirmée après réception du virement
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>

              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {pricePerDay}€ x {duration} jour(s)
                  </span>
                  <span>{formatPrice(pricePerDay * duration)}</span>
                </div>

                {insurance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assurance tous risques</span>
                    <span>{formatPrice(OPTIONS.insurance.price * duration)}</span>
                  </div>
                )}
                {gps && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GPS</span>
                    <span>{formatPrice(OPTIONS.gps.price * duration)}</span>
                  </div>
                )}
                {babySeat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Siège bébé</span>
                    <span>{formatPrice(OPTIONS.babySeat.price * duration)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA (20%)</span>
                  <span>{formatPrice(tva)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total TTC</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="text-gray-600">Caution (restituable)</span>
                <span className="font-medium">{formatPrice(DEPOSIT)}</span>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading || !selectedPayment}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? 'Confirmation...'
                  : selectedPayment === 'CARD' && !showCardForm
                  ? 'Continuer vers le paiement'
                  : 'Confirmer la réservation'}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                En confirmant, vous acceptez nos CGV
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}