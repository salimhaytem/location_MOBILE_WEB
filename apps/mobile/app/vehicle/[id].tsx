import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { vehiclesApi, formatPrice, calculateDays, formatDate } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: { name: string };
  year: number;
  color: string;
  transmission: string;
  fuelType: string;
  doors: number;
  seats: number;
  pricePerDay: number;
  deposit: number;
  images: string[];
  description: string;
  features: string[];
  status: string;
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [booking, setBooking] = useState({ pickupDate: '', returnDate: '', pickupLocation: 'Casablanca', insurance: false, gps: false, babySeat: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await vehiclesApi.getOne(id as string);
        setVehicle(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleBook = () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (!booking.pickupDate || !booking.returnDate) { alert('Sélectionnez les dates'); return; }
    const days = calculateDays(booking.pickupDate, booking.returnDate);
    const options = (booking.insurance ? 150 : 0) + (booking.gps ? 80 : 0) + (booking.babySeat ? 60 : 0);
    const total = (vehicle!.pricePerDay + options) * days;
    router.push({
      pathname: '/reservation',
      params: {
        vehicleId: vehicle!.id,
        vehicleName: `${vehicle!.brand} ${vehicle!.model}`,
        vehicleImage: vehicle!.images?.[0] || '',
        pricePerDay: String(vehicle!.pricePerDay),
        pickupDate: booking.pickupDate,
        returnDate: booking.returnDate,
        pickupLocation: booking.pickupLocation,
        duration: String(days),
        insurance: String(booking.insurance),
        gps: String(booking.gps),
        babySeat: String(booking.babySeat),
        total: String(total),
      },
    });
  };

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;
  if (!vehicle) return <Text>Véhicule non trouvé</Text>;

  const days = booking.pickupDate && booking.returnDate ? calculateDays(booking.pickupDate, booking.returnDate) : 0;
  const options = (booking.insurance ? 150 : 0) + (booking.gps ? 80 : 0) + (booking.babySeat ? 60 : 0);
  const total = days > 0 ? (vehicle.pricePerDay + options) * days : 0;

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.images}>
        {vehicle.images?.length > 0 ? vehicle.images.map((img, i) => <Image key={i} source={{ uri: img }} style={styles.image} />) : <Image source={{ uri: 'https://via.placeholder.com/400' }} style={styles.image} />}
      </ScrollView>

      <View style={styles.content}>
        <Text style={styles.title}>{vehicle.brand} {vehicle.model}</Text>
        <Text style={styles.category}>{vehicle.category?.name} • {vehicle.year}</Text>

        <View style={styles.specs}>
          <View style={styles.specItem}><Text>🚪 {vehicle.doors} portes</Text></View>
          <View style={styles.specItem}><Text>👥 {vehicle.seats} places</Text></View>
          <View style={styles.specItem}><Text>⚙️ {vehicle.transmission === 'AUTO' ? 'Auto' : 'Manuelle'}</Text></View>
          <View style={styles.specItem}><Text>⛽ {vehicle.fuelType}</Text></View>
        </View>

        {vehicle.description && <Text style={styles.description}>{vehicle.description}</Text>}

        {vehicle.features?.length > 0 && (
          <View style={styles.features}>
            {vehicle.features.map((f, i) => <Text key={i} style={styles.feature}>✓ {f}</Text>)}
          </View>
        )}

        <View style={styles.booking}>
          <Text style={styles.sectionTitle}>Réserver</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateInput}><Text style={styles.label}>Début</Text><TextInput style={styles.input} value={booking.pickupDate} onChangeText={(v) => setBooking({ ...booking, pickupDate: v })} placeholder="JJ/MM/AAAA" /></View>
            <View style={styles.dateInput}><Text style={styles.label}>Fin</Text><TextInput style={styles.input} value={booking.returnDate} onChangeText={(v) => setBooking({ ...booking, returnDate: v })} placeholder="JJ/MM/AAAA" /></View>
          </View>

          <View style={styles.options}>
            <TouchableOpacity style={styles.optionRow} onPress={() => setBooking({ ...booking, insurance: !booking.insurance })}>
              <Text>Assurance tous risques (+150 MAD/jour)</Text>
              <Text style={booking.insurance ? styles.checked : styles.unchecked}>{booking.insurance ? '✓' : '○'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => setBooking({ ...booking, gps: !booking.gps })}>
              <Text>GPS (+80 MAD/jour)</Text>
              <Text style={booking.gps ? styles.checked : styles.unchecked}>{booking.gps ? '✓' : '○'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionRow} onPress={() => setBooking({ ...booking, babySeat: !booking.babySeat })}>
              <Text>Siège bébé (+60 MAD/jour)</Text>
              <Text style={booking.babySeat ? styles.checked : styles.unchecked}>{booking.babySeat ? '✓' : '○'}</Text>
            </TouchableOpacity>
          </View>

          {days > 0 && (
            <View style={styles.total}>
              <Text>Total: {formatPrice(total)} ({days} jour(s))</Text>
              <Text style={styles.deposit}>Caution: {formatPrice(vehicle.deposit)}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.bookBtn, vehicle.status !== 'AVAILABLE' && styles.bookBtnDisabled]} onPress={handleBook} disabled={vehicle.status !== 'AVAILABLE'}>
            <Text style={styles.bookBtnText}>{vehicle.status === 'AVAILABLE' ? 'Réserver' : 'Indisponible'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center' },
  images: { height: 250 },
  image: { width: 400, height: 250 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  category: { color: '#666', marginBottom: 16 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  specItem: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 8 },
  description: { color: '#666', marginBottom: 16 },
  features: { marginBottom: 16 },
  feature: { color: '#0ea5e9', marginBottom: 4 },
  booking: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateInput: { flex: 1 },
  label: { fontSize: 12, color: '#666', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10 },
  options: { marginBottom: 12 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  checked: { color: '#0ea5e9', fontWeight: 'bold' },
  unchecked: { color: '#999' },
  total: { marginBottom: 12 },
  deposit: { color: '#666', fontSize: 12 },
  bookBtn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 8, alignItems: 'center' },
  bookBtnDisabled: { backgroundColor: '#ccc' },
  bookBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});