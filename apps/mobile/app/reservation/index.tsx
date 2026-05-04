import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { reservationsApi, formatPrice, formatDate, calculateDays } from '../../src/lib/api';

export default function ReservationScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'TRANSFER' | null>(null);
  const [loading, setLoading] = useState(false);

  const vehicleName = params.vehicleName as string;
  const vehicleImage = params.vehicleImage as string;
  const pricePerDay = parseFloat(params.pricePerDay as string);
  const pickupDate = params.pickupDate as string;
  const returnDate = params.returnDate as string;
  const duration = parseInt(params.duration as string);
  const total = parseFloat(params.total as string);

  const handleConfirm = async () => {
    if (!paymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un mode de paiement');
      return;
    }

    setLoading(true);
    try {
      await reservationsApi.create({
        vehicleId: params.vehicleId,
        pickupDate,
        returnDate,
        pickupLocation: params.pickupLocation,
        returnLocation: params.pickupLocation,
        insurance: params.insurance === 'true',
        gps: params.gps === 'true',
        babySeat: params.babySeat === 'true',
      });
      Alert.alert('Succès', 'Réservation confirmée!', [{ text: 'OK', onPress: () => router.push('/reservations') }]);
    } catch (e) {
      Alert.alert('Erreur', 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = pricePerDay * duration;
  const tva = subtotal * 0.2;
  const totalTTC = subtotal + tva;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirmer la réservation</Text>
      </View>

      <View style={styles.vehicleCard}>
        {vehicleImage && <Image source={{ uri: vehicleImage }} style={styles.vehicleImage} />}
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{vehicleName}</Text>
          <Text>{formatDate(pickupDate)} - {formatDate(returnDate)}</Text>
          <Text>{duration} jour(s)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode de paiement</Text>

        <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'CARD' && styles.paymentSelected]} onPress={() => setPaymentMethod('CARD')}>
          <Text>💳 Carte bancaire</Text>
          {paymentMethod === 'CARD' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'CASH' && styles.paymentSelected]} onPress={() => setPaymentMethod('CASH')}>
          <View>
            <Text>💵 Espèces en agence</Text>
            <Text style={styles.paymentNote}>Paiement à la prise en charge</Text>
          </View>
          {paymentMethod === 'CASH' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.paymentOption, paymentMethod === 'TRANSFER' && styles.paymentSelected]} onPress={() => setPaymentMethod('TRANSFER')}>
          <View>
            <Text>🏦 Virement / Mobile Money</Text>
            <Text style={styles.paymentNote}>IBAN: MA12 1234...</Text>
          </View>
          {paymentMethod === 'TRANSFER' && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Récapitulatif</Text>
        <View style={styles.row}><Text>Sous-total</Text><Text>{formatPrice(subtotal)}</Text></View>
        <View style={styles.row}><Text>TVA (20%)</Text><Text>{formatPrice(tva)}</Text></View>
        <View style={styles.row}><Text style={styles.totalLabel}>Total TTC</Text><Text style={styles.totalValue}>{formatPrice(total)}</Text></View>
        <View style={styles.row}><Text>Caution</Text><Text>{formatPrice(2000)}</Text></View>
      </View>

      <TouchableOpacity style={[styles.confirmBtn, (!paymentMethod || loading) && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={!paymentMethod || loading}>
        <Text style={styles.confirmBtnText}>{loading ? 'Confirmation...' : 'Confirmer la réservation'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

import { Image } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#0ea5e9' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  vehicleCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 16, padding: 12, borderRadius: 12 },
  vehicleImage: { width: 80, height: 60, borderRadius: 8 },
  vehicleInfo: { marginLeft: 12, flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: 'bold' },
  section: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  paymentOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
  paymentSelected: { borderColor: '#0ea5e9', backgroundColor: '#f0f9ff' },
  paymentNote: { fontSize: 12, color: '#666' },
  check: { color: '#0ea5e9', fontWeight: 'bold' },
  summary: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalLabel: { fontWeight: 'bold', fontSize: 16 },
  totalValue: { fontWeight: 'bold', fontSize: 18, color: '#0ea5e9' },
  confirmBtn: { backgroundColor: '#0ea5e9', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#ccc' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});