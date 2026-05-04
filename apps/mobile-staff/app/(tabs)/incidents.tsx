import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';

const INCIDENT_TYPES = [
  { id: 'DAMAGE', label: '🚗 Dommage carrosserie', color: '#ef4444' },
  { id: 'ACCIDENT', label: '💥 Accident', color: '#dc2626' },
  { id: 'MECHANICAL', label: '🔧 Panne mécanique', color: '#f59e0b' },
  { id: 'OTHER', label: '❓ Autre', color: '#6b7280' },
];

export default function IncidentsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ vehicleId: '', type: '', description: '', photos: [] as string[] });
  const [sending, setSending] = useState(false);

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Erreur', 'Permission caméra requise'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setForm({ ...form, photos: [...form.photos, res.assets[0].uri] });
  };

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled) setForm({ ...form, photos: [...form.photos, res.assets[0].uri] });
  };

  const submit = async () => {
    if (!form.type || !form.description) {
      Alert.alert('Erreur', 'Veuillez sélectionner le type et décrire l\'incident');
      return;
    }
    setSending(true);
    try {
      Alert.alert('Succès', 'Incident signalé avec succès');
      setForm({ vehicleId: '', type: '', description: '', photos: [] });
    } catch (e) { Alert.alert('Erreur', 'Échec envoi'); }
    finally { setSending(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚠️ Signaler un incident</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Type d'incident</Text>
        <View style={styles.typesGrid}>
          {INCIDENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeBtn, form.type === t.id && { backgroundColor: t.color }]}
              onPress={() => setForm({ ...form, type: t.id })}
            >
              <Text style={[styles.typeBtnText, form.type === t.id && { color: '#fff' }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ID du véhicule (optionnel)</Text>
        <TextInput style={styles.input} placeholder="Ex: ABC-123" value={form.vehicleId} onChangeText={(v) => setForm({ ...form, vehicleId: v })} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, { height: 120 }]} placeholder="Décrivez l'incident en détail..." value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />

        <Text style={styles.label}>Photos</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}><Text>📷 Caméra</Text></TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}><Text>🖼️ Galerie</Text></TouchableOpacity>
        </View>
        {form.photos.length > 0 && (
          <ScrollView horizontal style={styles.photoList}>
            {form.photos.map((uri, i) => (
              <View key={i} style={styles.photoItem}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setForm({ ...form, photos: form.photos.filter((_, idx) => idx !== i) })}>
                  <Text style={{ color: '#fff' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <TouchableOpacity style={[styles.submitBtn, sending && styles.submitBtnDisabled]} onPress={submit} disabled={sending}>
          <Text style={styles.submitBtnText}>{sending ? 'Envoi...' : 'Signaler l\'incident'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#0ea5e9', padding: 20, paddingTop: 50 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  form: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  typeBtnText: { fontSize: 14 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  photoBtn: { flex: 1, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8, alignItems: 'center' },
  photoList: { flexDirection: 'row', marginBottom: 16 },
  photoItem: { marginRight: 8, position: 'relative' },
  thumbnail: { width: 80, height: 80, borderRadius: 8 },
  removePhoto: { position: 'absolute', top: 4, right: 4, backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitBtnDisabled: { backgroundColor: '#ccc' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});