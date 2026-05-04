import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, Alert, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import SignatureCanvas from 'react-native-signature-canvas';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/syncStore';

interface Reservation {
  id: string;
  user: { firstName: string; lastName: string };
  vehicle: { brand: string; model: string; registrationNumber: string; mileage: number };
  pickupDate: string;
  returnDate: string;
  depositPaid: boolean;
  status: string;
}

const FUEL_LABELS = ['Plein', '3/4', '1/2', '1/4', 'Vide'];

export default function PlanningScreen() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const { isOnline, addAction, pendingActions } = useSyncStore();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [returns, setReturns] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'checkin' | 'checkout' | null>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [form, setForm] = useState({ km: '', fuelLevel: 4, condition: '', notes: '', photos: [] as string[] });
  const [initialKm, setInitialKm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    fetchPlanning();
  }, [isAuthenticated, selectedDate]);

  const fetchPlanning = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/checkinout/planning?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDepartures(data.data?.departures || []);
      setReturns(data.data?.returns || []);
    } catch (e) {
      console.log('Offline or error');
    } finally {
      setLoading(false);
    }
  };

  const openCheckIn = (res: Reservation) => {
    setSelectedRes(res);
    setInitialKm(String(res.vehicle.mileage || 0));
    setForm({ km: String(res.vehicle.mileage || 0), fuelLevel: 4, condition: '', notes: '', photos: [] });
    setModalType('checkin');
    setTimeout(() => signatureRef.current?.clear(), 100);
  };

  const openCheckOut = (res: Reservation) => {
    setSelectedRes(res);
    setInitialKm(String(res.vehicle.mileage || 0));
    setForm({ km: '', fuelLevel: 4, condition: '', notes: '', photos: [] });
    setModalType('checkout');
    setTimeout(() => signatureRef.current?.clear(), 100);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Erreur', 'Permission caméra requise'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setForm({ ...form, photos: [...form.photos, res.assets[0].uri] });
  };

  const getSignature = (): string => {
    if (signatureRef.current?.isEmpty()) return '';
    return signatureRef.current?.toDataURL() || '';
  };

  const handleSignatureOK = (signature: string) => {
    setForm({ ...form, notes: form.notes + `[SIGNATURE:${signature}` });
  };

  const submitCheckIn = async () => {
    if (!selectedRes) return;
    const signature = getSignature();
    const data = { 
      kmAtPickup: parseInt(form.km), 
      fuelLevelPickup: form.fuelLevel, 
      vehicleCondition: form.condition, 
      notes: form.notes,
      signature: signature,
      photos: form.photos
    };

    if (!isOnline) {
      await addAction({ type: 'checkin', reservationId: selectedRes.id, data });
      Alert.alert('Hors ligne', 'Check-in enregistré. Synchronisé au retour réseau.');
      setModalType(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/checkinout/${selectedRes.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      fetchPlanning();
    } catch (e) { Alert.alert('Erreur', 'Échec check-in'); }
    setModalType(null);
  };

  const submitCheckOut = async () => {
    if (!selectedRes) return;
    const km = parseInt(form.km) || 0;
    const initKm = parseInt(initialKm) || 0;
    const extra = Math.max(0, km - initKm);
    const cost = extra * 2;
    const signature = getSignature();

    const data = { 
      kmAtReturn: km, 
      fuelReturnLevel: form.fuelLevel, 
      vehicleCondition: form.condition, 
      notes: form.notes + (extra > 0 ? ` (${extra}km sup: +${cost} MAD)` : ''), 
      signature: signature,
      photos: form.photos
    };

    if (!isOnline) {
      await addAction({ type: 'checkout', reservationId: selectedRes.id, data });
      Alert.alert('Hors ligne', 'Check-out enregistré. Synchronisé au retour réseau.');
      setModalType(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/checkinout/${selectedRes.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      fetchPlanning();
    } catch (e) { Alert.alert('Erreur', 'Échec check-out'); }
    setModalType(null);
  };

  const renderItem = (res: Reservation, isReturn: boolean) => (
    <View key={res.id} style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.client}>{res.user.firstName} {res.user.lastName}</Text>
        <Text style={styles.vehicle}>{res.vehicle.brand} {res.vehicle.model}</Text>
        <Text style={styles.time}>{new Date(isReturn ? res.returnDate : res.pickupDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.status, { backgroundColor: res.depositPaid ? '#dcfce7' : '#fef3c7' }]}>
          <Text style={{ color: res.depositPaid ? '#16a34a' : '#d97706' }}>{res.depositPaid ? 'Payé' : 'Cash'}</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => isReturn ? openCheckOut(res) : openCheckIn(res)}>
          <Text style={styles.actionBtnText}>{isReturn ? 'Check-out' : 'Check-in'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Planning</Text>
        <TouchableOpacity onPress={logout}><Text style={{ color: '#fff' }}>Déconnexion</Text></TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>🔴 Mode hors ligne</Text>
        </View>
      )}

      <View style={styles.dateRow}>
        <TextInput style={styles.dateInput} value={selectedDate} onChangeText={setSelectedDate} placeholder="YYYY-MM-DD" />
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPlanning}><Text>🔄</Text></TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Départs ({departures.length})</Text>
          {departures.length === 0 ? <Text style={styles.empty}>Aucun départ</Text> : departures.map((r) => renderItem(r, false))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔙 Retours ({returns.length})</Text>
          {returns.length === 0 ? <Text style={styles.empty}>Aucun retour</Text> : returns.map((r) => renderItem(r, true))}
        </View>
      </ScrollView>

      <Modal visible={modalType !== null} animationType="slide">
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{modalType === 'checkin' ? '📋 Check-in' : '📋 Check-out'}</Text>
            <Text style={styles.modalSubtitle}>{selectedRes?.vehicle.brand} {selectedRes?.vehicle.model}</Text>

            <TextInput 
              style={styles.input} 
              placeholder={modalType === 'checkin' ? 'Kilométrage départ' : 'Kilométrage retour'} 
              value={form.km} 
              onChangeText={(v) => setForm({ ...form, km: v })} 
              keyboardType="numeric" 
            />
            
            <Text style={styles.label}>Carburant</Text>
            <View style={styles.fuelRow}>
              {FUEL_LABELS.map((l, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.fuelBtn, form.fuelLevel === i + 1 && styles.fuelBtnActive]} 
                  onPress={() => setForm({ ...form, fuelLevel: i + 1 })}
                >
                  <Text>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput 
              style={[styles.input, { height: 80 }]} 
              placeholder="État du véhicule (rayures, etc.)" 
              value={form.condition} 
              onChangeText={(v) => setForm({ ...form, condition: v })} 
              multiline 
            />

            <View style={styles.photos}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}><Text>📷 Photo</Text></TouchableOpacity>
              <Text style={styles.photoCount}>{form.photos.length} photo(s)</Text>
            </View>

            {form.photos.length > 0 && (
              <ScrollView horizontal style={styles.photoList}>
                {form.photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.thumbnail} />
                ))}
              </ScrollView>
            )}

            <TextInput 
              style={[styles.input, { height: 60 }]} 
              placeholder="Notes supplémentaires" 
              value={form.notes} 
              onChangeText={(v) => setForm({ ...form, notes: v })} 
            />

            <Text style={styles.label}>✍️ Signature client</Text>
            <View style={styles.signatureContainer}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleSignatureOK}
                onEmpty={() => {}}
                autoClear={false}
                descriptionText=""
                backgroundColor="#ffffff"
                penColor="#000000"
                dotSize={3}
                minWidth={1}
                maxWidth={3}
                style={styles.signatureCanvas}
              />
              <TouchableOpacity 
                style={styles.clearSignatureBtn} 
                onPress={() => signatureRef.current?.clear()}
              >
                <Text style={styles.clearSignatureText}>Effacer</Text>
              </TouchableOpacity>
            </View>

            {modalType === 'checkout' && form.km && (
              <View style={styles.extraKm}>
                {(() => {
                  const km = parseInt(form.km) || 0;
                  const init = parseInt(initialKm) || 0;
                  const extra = Math.max(0, km - init);
                  const cost = extra * 2;
                  return extra > 0 ? (
                    <Text style={styles.extraKmText}>⚠️ {extra}km sup: +{cost} MAD</Text>
                  ) : (
                    <Text style={styles.normalKm}>✓ Kilométrage normal</Text>
                  );
                })()}
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}>
                <Text>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={modalType === 'checkin' ? submitCheckIn : submitCheckOut}
              >
                <Text style={{ color: '#fff' }}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#0ea5e9', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  offlineBanner: { backgroundColor: '#f59e0b', padding: 8, alignItems: 'center' },
  offlineText: { color: '#fff', fontWeight: 'bold' },
  dateRow: { flexDirection: 'row', padding: 12, gap: 8 },
  dateInput: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  refreshBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  section: { backgroundColor: '#fff', margin: 12, padding: 12, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  empty: { textAlign: 'center', color: '#666', padding: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cardLeft: { flex: 1 },
  client: { fontSize: 16, fontWeight: 'bold' },
  vehicle: { color: '#666' },
  time: { color: '#999', fontSize: 12 },
  cardRight: { alignItems: 'flex-end' },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  actionBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold' },
  modal: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 50 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  modalSubtitle: { color: '#666', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  label: { marginBottom: 8, fontWeight: '600' },
  fuelRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  fuelBtn: { flex: 1, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' },
  fuelBtnActive: { backgroundColor: '#0ea5e9' },
  photos: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  photoBtn: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  photoCount: { marginLeft: 12, color: '#666' },
  photoList: { marginBottom: 12 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 8 },
  signatureContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 16 },
  signatureCanvas: { height: 150 },
  clearSignatureBtn: { position: 'absolute', top: 8, right: 8, padding: 4 },
  clearSignatureText: { color: '#666', fontSize: 12 },
  extraKm: { padding: 12, backgroundColor: '#fef3c7', borderRadius: 8, marginBottom: 16 },
  extraKmText: { color: '#d97706', fontWeight: 'bold' },
  normalKm: { color: '#16a34a' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20, paddingBottom: 40 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  submitBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#0ea5e9', alignItems: 'center' },
});