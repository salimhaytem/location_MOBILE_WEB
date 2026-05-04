import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { reservationsApi, formatPrice, formatDate } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

interface Reservation {
  id: string;
  vehicle: { brand: string; model: string; images: string[] };
  pickupDate: string;
  returnDate: string;
  status: string;
  totalPrice: number;
}

const statusColors: Record<string, string> = {
  PENDING: '#fbbf24',
  CONFIRMED: '#3b82f6',
  ACTIVE: '#22c55e',
  COMPLETED: '#6b7280',
  CANCELLED: '#ef4444',
};

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export default function ReservationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchReservations();
  }, [isAuthenticated]);

  const fetchReservations = async () => {
    try {
      const res = await reservationsApi.getAll();
      setReservations(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id: string) => {
    Alert.alert('Annuler', 'Voulez-vous annuler cette réservation?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: async () => {
        try {
          await reservationsApi.cancel(id);
          fetchReservations();
        } catch (e) { Alert.alert('Erreur', 'Impossible d\'annuler'); }
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Reservation }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.vehicle.images?.[0] || 'https://via.placeholder.com/100' }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.vehicle}>{item.vehicle.brand} {item.vehicle.model}</Text>
        <Text style={styles.dates}>{formatDate(item.pickupDate)} - {formatDate(item.returnDate)}</Text>
        <View style={styles.footer}>
          <View style={[styles.status, { backgroundColor: statusColors[item.status] + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[item.status] }]} />
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{statusLabels[item.status]}</Text>
          </View>
          <Text style={styles.price}>{formatPrice(item.totalPrice)}</Text>
        </View>
        {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes réservations</Text>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.searchBtn}>Louer</Text>
        </TouchableOpacity>
      </View>

      {loading ? <Text style={styles.loading}>Chargement...</Text> : reservations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucune réservation</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')}>
            <Text style={styles.emptyBtnText}>Louer un véhicule</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={reservations} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#0ea5e9', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 50 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchBtn: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  image: { width: 100, height: 100 },
  content: { flex: 1, padding: 12 },
  vehicle: { fontSize: 16, fontWeight: 'bold' },
  dates: { color: '#666', fontSize: 14, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  status: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '500' },
  price: { fontWeight: 'bold', color: '#0ea5e9' },
  cancelBtn: { marginTop: 8, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444', borderRadius: 6 },
  cancelBtnText: { color: '#ef4444' },
  loading: { textAlign: 'center', marginTop: 50 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#666' },
  emptyBtn: { marginTop: 16, backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: 'bold' },
});