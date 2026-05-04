'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { FiUpload, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface Reservation {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  vehicle: { id: string; brand: string; model: string; registrationNumber: string; mileage: number };
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  depositPaid: boolean;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

const FUEL_LEVELS = [
  { value: 4, label: 'Plein', icon: '⛽', color: 'bg-green-500' },
  { value: 3, label: '3/4', icon: '⛽', color: 'bg-green-400' },
  { value: 2, label: '1/2', icon: '⛽', color: 'bg-yellow-400' },
  { value: 1, label: '1/4', icon: '⛽', color: 'bg-orange-400' },
  { value: 0, label: 'Vide', icon: '⛽', color: 'bg-red-400' },
];

export default function StaffPlanningPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [returns, setReturns] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'checkin' | 'checkout' | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReservation, setCashReservation] = useState<Reservation | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    kmAtPickup: '',
    fuelLevelPickup: 4,
    kmAtReturn: '',
    fuelReturnLevel: 4,
    vehicleCondition: '',
    notes: '',
    photos: [] as string[],
  });

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'STAFF' && user?.role !== 'ADMIN')) {
      router.push('/connexion');
      return;
    }
    fetchPlanning();
  }, [isAuthenticated, user, selectedDate]);

  const fetchPlanning = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/checkinout/planning?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setDepartures(data.data?.departures || []);
      setReturns(data.data?.returns || []);
    } catch (error) {
      console.error('Error fetching planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:4000/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formDataUpload,
    });
    
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url || URL.createObjectURL(file);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.photos.length + files.length > 10) {
      alert('Maximum 10 photos');
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];
    
    for (const file of files) {
      try {
        const url = await uploadPhoto(file);
        newPhotos.push(url);
      } catch (err) {
        newPhotos.push(URL.createObjectURL(file));
      }
    }

    setFormData({ ...formData, photos: [...formData.photos, ...newPhotos] });
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  };

  const handleCheckIn = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      kmAtPickup: String(reservation.vehicle.mileage || 0),
      fuelLevelPickup: 4,
      kmAtReturn: '',
      fuelReturnLevel: 4,
      vehicleCondition: '',
      notes: '',
      photos: [],
    });
    setModalType('checkin');
    setTimeout(() => signatureRef.current?.clear(), 100);
  };

  const handleCheckOut = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      kmAtPickup: String(reservation.vehicle.mileage || 0),
      fuelLevelPickup: 4,
      kmAtReturn: '',
      fuelReturnLevel: 4,
      vehicleCondition: '',
      notes: '',
      photos: [],
    });
    setModalType('checkout');
    setTimeout(() => signatureRef.current?.clear(), 100);
  };

  const handleValidateCash = (reservation: Reservation) => {
    setCashReservation(reservation);
    setShowCashModal(true);
  };

  const confirmValidateCash = async () => {
    if (!cashReservation) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/reservations/${cashReservation.id}/confirm-cash`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCashModal(false);
      setCashReservation(null);
      fetchPlanning();
    } catch (error) {
      alert('Erreur lors de la validation');
    }
  };

  const getSignature = () => {
    if (signatureRef.current?.isEmpty()) return '';
    return signatureRef.current?.toDataURL() || '';
  };

  const submitCheckIn = async () => {
    if (!selectedReservation) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/checkinout/${selectedReservation.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kmAtPickup: parseInt(formData.kmAtPickup),
          fuelLevelPickup: formData.fuelLevelPickup,
          vehicleCondition: formData.vehicleCondition,
          notes: formData.notes,
          signature: getSignature(),
          photos: formData.photos,
        }),
      });
      setModalType(null);
      fetchPlanning();
    } catch (error) {
      alert('Erreur lors du check-in');
    }
  };

  const submitCheckOut = async () => {
    if (!selectedReservation) return;
    const kmReturn = parseInt(formData.kmAtReturn) || 0;
    const kmDepart = parseInt(formData.kmAtPickup) || selectedReservation.vehicle.mileage || 0;
    const days = Math.ceil((new Date(selectedReservation.returnDate).getTime() - new Date(selectedReservation.pickupDate).getTime()) / (1000 * 60 * 60 * 24));
    const kmIncluded = 200 * days;
    const kmDriven = kmReturn - kmDepart;
    const extraKm = Math.max(0, kmDriven - kmIncluded);
    const additionalCharges = extraKm * 2;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/checkinout/${selectedReservation.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          kmAtReturn: kmReturn,
          fuelReturnLevel: formData.fuelReturnLevel,
          vehicleCondition: formData.vehicleCondition,
          notes: formData.notes + (additionalCharges > 0 ? ` [${extraKm}km sup: +${additionalCharges} MAD]` : ''),
          signature: getSignature(),
          photos: formData.photos,
        }),
      });
      setModalType(null);
      fetchPlanning();
    } catch (error) {
      alert('Erreur lors du check-out');
    }
  };

  const extraKmCalculation = () => {
    if (!selectedReservation || !formData.kmAtReturn) return null;
    const kmReturn = parseInt(formData.kmAtReturn) || 0;
    const kmDepart = parseInt(formData.kmAtPickup) || selectedReservation.vehicle.mileage || 0;
    const days = Math.ceil((new Date(selectedReservation.returnDate).getTime() - new Date(selectedReservation.pickupDate).getTime()) / (1000 * 60 * 60 * 24));
    const kmIncluded = 200 * days;
    const kmDriven = kmReturn - kmDepart;
    const extraKm = Math.max(0, kmDriven - kmIncluded);
    const cost = extraKm * 2;
    return { extraKm, cost, kmDriven, kmIncluded };
  };

  const renderReservationRow = (res: Reservation, isReturn: boolean = false) => (
    <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2">
      <div>
        <div className="font-medium">{res.user.firstName} {res.user.lastName}</div>
        <div className="text-sm text-gray-600">{res.vehicle.brand} {res.vehicle.model}</div>
        <div className="text-xs text-gray-500">{res.vehicle.registrationNumber}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">
          {new Date(isReturn ? res.returnDate : res.pickupDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`text-xs px-2 py-0.5 rounded ${res.depositPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          {res.depositPaid ? 'Payé' : 'Cash en attente'}
        </div>
      </div>
      <div className="flex gap-2">
        {!res.depositPaid && res.paymentMethod === 'CASH' && (
          <button onClick={() => handleValidateCash(res)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1">
            <FiCheck size={14} /> Valider cash
          </button>
        )}
        {isReturn ? (
          <button onClick={() => handleCheckOut(res)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Check-out
          </button>
        ) : (
          <button onClick={() => handleCheckIn(res)} className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
            Check-in
          </button>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="text-center py-12">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Planning du jour</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">🚗 Départs du jour ({departures.length})</h2>
          {departures.length === 0 ? (
            <div className="text-gray-500 text-center py-8">Aucun départ aujourd'hui</div>
          ) : (
            departures.map((res) => renderReservationRow(res))
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">🔙 Retours du jour ({returns.length})</h2>
          {returns.length === 0 ? (
            <div className="text-gray-500 text-center py-8">Aucun retour aujourd'hui</div>
          ) : (
            returns.map((res) => renderReservationRow(res, true))
          )}
        </div>
      </div>

      {/* Modal Check-in/Check-out */}
      {modalType && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  {modalType === 'checkin' ? '📋 Check-in' : '📋 Check-out'}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedReservation.vehicle.brand} {selectedReservation.vehicle.model} - {selectedReservation.user.firstName} {selectedReservation.user.lastName}
                </p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-gray-100 rounded">
                <FiX size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Kilométrage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {modalType === 'checkin' ? 'Kilométrage au départ' : 'Kilométrage au retour'}
                </label>
                <input
                  type="number"
                  value={modalType === 'checkin' ? formData.kmAtPickup : formData.kmAtReturn}
                  onChange={(e) => setFormData({
                    ...formData,
                    [modalType === 'checkin' ? 'kmAtPickup' : 'kmAtReturn']: e.target.value,
                  })}
                  className="w-full px-4 py-3 border rounded-lg text-lg"
                  placeholder="Ex: 45000"
                />
              </div>

              {/* Niveau Carburant */}
              <div>
                <label className="block text-sm font-medium mb-2">Niveau carburant</label>
                <div className="grid grid-cols-5 gap-2">
                  {FUEL_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setFormData({
                        ...formData,
                        [modalType === 'checkin' ? 'fuelLevelPickup' : 'fuelReturnLevel']: level.value,
                      })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        (modalType === 'checkin' ? formData.fuelLevelPickup : formData.fuelReturnLevel) === level.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${level.color} mx-auto mb-1`} />
                      <div className="text-xs text-center">{level.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Photos ({formData.photos.length}/10)
                </label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  {formData.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.photos.map((photo, idx) => (
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
                  {formData.photos.length < 10 && (
                    <label className="flex flex-col items-center cursor-pointer">
                      {uploading ? (
                        <span className="text-gray-500">Upload en cours...</span>
                      ) : (
                        <>
                          <FiUpload className="text-3xl text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Cliquez ou glissez une photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* État du véhicule */}
              <div>
                <label className="block text-sm font-medium mb-2">État du véhicule</label>
                <textarea
                  value={formData.vehicleCondition}
                  onChange={(e) => setFormData({ ...formData, vehicleCondition: e.target.value })}
                  placeholder="Description de l'état (rayures, chocs, etc.)"
                  className="w-full px-4 py-3 border rounded-lg h-24"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes supplémentaires</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observations..."
                  className="w-full px-4 py-3 border rounded-lg h-16"
                />
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium mb-2">Signature client</label>
                <div className="border-2 border-gray-200 rounded-lg bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-40' }}
                  />
                </div>
                <button
                  onClick={() => signatureRef.current?.clear()}
                  className="text-sm text-gray-500 mt-1 hover:text-gray-700"
                >
                  Effacer la signature
                </button>
              </div>
            </div>

            {/* Calcul km supplémentaires pour checkout */}
            {modalType === 'checkout' && formData.kmAtReturn && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {(() => {
                  const calc = extraKmCalculation();
                  if (!calc) return null;
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Km parcourus:</span>
                        <span className="font-medium">{calc.kmDriven} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Km inclus ({selectedReservation && Math.ceil((new Date(selectedReservation.returnDate).getTime() - new Date(selectedReservation.pickupDate).getTime()) / (1000 * 60 * 60 * 24))} jours):</span>
                        <span className="font-medium">{calc.kmIncluded} km</span>
                      </div>
                      {calc.extraKm > 0 ? (
                        <div className="flex justify-between text-orange-600 font-bold pt-2 border-t">
                          <span>Km supplémentaires:</span>
                          <span>{calc.extraKm} km = +{formatPrice(calc.cost)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-green-600 font-bold pt-2 border-t">
                          <span>✓ Kilométrage normal</span>
                          <span>0 MAD</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalType(null)}
                className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={modalType === 'checkin' ? submitCheckIn : submitCheckOut}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Confirmer {modalType === 'checkin' ? 'le check-in' : 'le check-out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Validation Cash */}
      {showCashModal && cashReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="text-green-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirmer le paiement</h3>
                <p className="text-sm text-gray-500">Cash en attente</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium">{cashReservation.user.firstName} {cashReservation.user.lastName}</p>
              <p className="text-sm text-gray-600">{cashReservation.vehicle.brand} {cashReservation.vehicle.model}</p>
              <p className="text-lg font-bold text-green-600 mt-2">{formatPrice(cashReservation.totalPrice)}</p>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Confirmer la réception du paiement en espèces ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCashModal(false)}
                className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={confirmValidateCash}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}