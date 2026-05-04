import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatPrice, formatDate } from '../../src/lib/api';

interface ReservationData {
  id: string;
  vehicle: { brand: string; model: string };
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  paymentMethod: string;
  status: string;
}

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:4000/reservations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReservation(data.data);
      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [id]);

  const handleDownloadInvoice = async () => {
    if (!reservation) return;
    setDownloading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/reservations/${reservation.id}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.data?.pdfUrl) {
        const pdfUrl = data.data.pdfUrl;
        const filename = `facture_${reservation.id}.pdf`;
        const fileUri = FileSystem.documentDirectory + filename;
        
        const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Partager la facture',
          });
        } else {
          Alert.alert('Succès', 'Facture téléchargée');
        }
      } else {
        Alert.alert('Erreur', 'URL de facture non disponible');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de télécharger la facture');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.container}>
        <Text>Réservation non trouvée</Text>
      </View>
    );
  }

  const isCash = reservation.paymentMethod === 'CASH';
  const isCard = reservation.paymentMethod === 'CARD';

  return (
    <View style={styles.container}>
      <View style={styles.successIcon}>
        <Text style={styles.successEmoji}>✅</Text>
      </View>
      
      <Text style={styles.title}>Réservation confirmée!</Text>
      <Text style={styles.reservationId}>N° {reservation.id.slice(0, 8).toUpperCase()}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Détails de la location</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Véhicule</Text>
          <Text style={styles.value}>{reservation.vehicle.brand} {reservation.vehicle.model}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Dates</Text>
          <Text style={styles.value}>
            {formatDate(reservation.pickupDate)} - {formatDate(reservation.returnDate)}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Montant total</Text>
          <Text style={styles.totalValue}>{formatPrice(reservation.totalPrice)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Mode de paiement</Text>
          <Text style={styles.value}>
            {isCard ? '💳 Carte bancaire' : isCash ? '💵 Espèces' : '🏦 Virement'}
          </Text>
        </View>
      </View>

      {isCash && (
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionsText}>
            Présentez-vous à l'agence dans les 30 minutes suivant cette confirmation pour procéder au paiement et récupérer votre véhicule.
          </Text>
          <Text style={styles.instructionsNote}>
            Horaires d'ouverture: Lun-Sam 8h-19h, Dim 10h-17h
          </Text>
        </View>
      )}

      {isCard && (
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>✅ Paiement confirmé</Text>
          <Text style={styles.instructionsText}>
            Votre réservation est active. Vous pouvez procéder au check-in à l'heure prévue.
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/reservations')}
        >
          <Text style={styles.primaryBtnText}>Voir mes réservations</Text>
        </TouchableOpacity>

        {reservation.status === 'COMPLETED' && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleDownloadInvoice}
            disabled={downloading}
          >
            <Text style={styles.secondaryBtnText}>
              {downloading ? 'Téléchargement...' : '📄 Télécharger la facture'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#16a34a',
    marginBottom: 8,
  },
  reservationId: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    color: '#666',
  },
  value: {
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  instructionsCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#333',
    lineHeight: 20,
  },
  instructionsNote: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  secondaryBtnText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
  },
});