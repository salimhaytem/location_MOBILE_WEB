import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useSyncStore } from '../../src/store/syncStore';

interface PendingCash {
  id: string;
  user: { firstName: string; lastName: string };
  vehicle: { brand: string; model: string };
  totalPrice: number;
  depositPaid: boolean;
}

export default function CashScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { isOnline, addAction, pendingActions } = useSyncStore();
  const [loading, setLoading] = useState(false);
  const [departures, setDepartures] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login');
    else fetchPlanning();
  }, [isAuthenticated]);

  const fetchPlanning = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const date = new Date().toISOString().split('T')[0];
      const res = await fetch(`http://localhost:4000/checkinout/planning?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDepartures(data.data?.departures || []);
      setReturns(data.data?.returns || []);
    } catch (e) { console.log('Error:', e); }
    finally { setLoading(false); }
  };

  const pendingCash: PendingCash[] = [...departures, ...returns]
    .filter((r) => !r.depositPaid)
    .map((r) => ({
      id: r.id,
      user: r.user,
      vehicle: r.vehicle,
      totalPrice: r.totalPrice,
      depositPaid: r.depositPaid,
    }));

  const handleValidate = async (id: string) => {
    Alert.alert('Confirmer', 'Confirmer la réception du paiement?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          if (!isOnline) {
            await addAction({ type: 'validateCash', reservationId: id, data: {} });
            Alert.alert('Hors ligne', 'Validé localement. Synchronisé au retour réseau.');
            return;
          }
          try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:4000/checkinout/${id}/validate-cash`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            Alert.alert('Succès', 'Paiement validé');
            fetchPlanning();
          } catch (e) { Alert.alert('Erreur', 'Échec validation'); }
        },
      },
    ]);
  };

  const totalPending = pendingCash.reduce((acc, r) => acc + r.totalPrice, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💵 Encaissements</Text>
        <View style={styles.onlineStatus}>
          <Text style={{ color: isOnline ? '#dcfce7' : '#fef3c7' }}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
        </View>
      </View>

      {pendingActions.length > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>⏳ {pendingActions.length} action(s) en attente</Text>
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total en attente</Text>
        <Text style={styles.summaryValue}>{totalPending} MAD</Text>
        <Text style={styles.summaryCount}>{pendingCash.length} paiement(s)</Text>
      </View>

      <FlatList
        data={pendingCash}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPlanning} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement en attente</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.client}>{item.user.firstName} {item.user.lastName}</Text>
              <Text style={styles.vehicle}>{item.vehicle.brand} {item.vehicle.model}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.amount}>{item.totalPrice} MAD</Text>
              <TouchableOpacity style={styles.validateBtn} onPress={() => handleValidate(item.id)}>
                <Text style={styles.validateBtnText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#0ea5e9', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  onlineStatus: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  syncBanner: { backgroundColor: '#3b82f6', padding: 8, alignItems: 'center' },
  syncText: { color: '#fff', fontWeight: 'bold' },
  summary: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { color: '#666' },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: '#d97706', marginVertical: 8 },
  summaryCount: { color: '#999' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  cardLeft: { flex: 1 },
  client: { fontSize: 16, fontWeight: 'bold' },
  vehicle: { color: '#666' },
  cardRight: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: 'bold', color: '#d97706', marginBottom: 8 },
  validateBtn: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  validateBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#666', marginTop: 40 },
});