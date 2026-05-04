import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { usersApi, formatDate } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile: {
    address?: string;
    city?: string;
    drivingLicenseNumber?: string;
    drivingLicenseExpiry?: string;
    idCardNumber?: string;
    idCardExpiry?: string;
    isVerified: boolean;
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', address: '', city: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const res = await usersApi.getProfile();
      setProfile(res.data);
      setForm({
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        phone: res.data.phone || '',
        address: res.data.profile?.address || '',
        city: res.data.profile?.city || '',
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      await usersApi.updateProfile(form);
      setEditing(false);
      fetchProfile();
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (e) { Alert.alert('Erreur', 'Erreur lors de la mise à jour'); }
  };

  const pickImage = async (type: 'cin' | 'license') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      Alert.alert('Succès', `${type === 'cin' ? ' CIN' : 'Permis'} uploadé (simulation)`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (loading) return <Text style={styles.loading}>Chargement...</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon profil</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.firstName?.[0]}{profile?.lastName?.[0]}</Text>
        </View>
        <Text style={styles.name}>{profile?.firstName} {profile?.lastName}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={[styles.verified, profile?.profile?.isVerified ? styles.verifiedYes : styles.verifiedNo]}>
          <Text>{profile?.profile?.isVerified ? '✓ Vérifié' : '⏳ En attente de vérification'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? 'Annuler' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View>
            <TextInput style={styles.input} placeholder="Prénom" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
            <TextInput style={styles.input} placeholder="Nom" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
            <TextInput style={styles.input} placeholder="Téléphone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Adresse" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
            <TextInput style={styles.input} placeholder="Ville" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.row}><Text style={styles.label}>Téléphone</Text><Text>{profile?.phone || '-'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Adresse</Text><Text>{profile?.profile?.address || '-'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Ville</Text><Text>{profile?.profile?.city || '-'}</Text></View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documents</Text>

        <TouchableOpacity style={styles.docBtn} onPress={() => pickImage('cin')}>
          <View>
            <Text style={styles.docTitle}>Pièce d'identité (CIN)</Text>
            <Text style={styles.docStatus}>{profile?.profile?.idCardNumber || 'Non uploadé'}</Text>
          </View>
          <Text style={styles.docArrow}>📤</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.docBtn} onPress={() => pickImage('license')}>
          <View>
            <Text style={styles.docTitle}>Permis de conduire</Text>
            <Text style={styles.docStatus}>{profile?.profile?.drivingLicenseNumber || 'Non uploadé'}</Text>
          </View>
          <Text style={styles.docArrow}>📤</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loading: { textAlign: 'center', marginTop: 50 },
  header: { padding: 20, backgroundColor: '#0ea5e9', paddingTop: 50 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { alignItems: 'center', padding: 20, backgroundColor: '#fff', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  email: { color: '#666', marginTop: 4 },
  verified: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  verifiedYes: { backgroundColor: '#dcfce7' },
  verifiedNo: { backgroundColor: '#fef3c7' },
  section: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  editBtn: { color: '#0ea5e9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { color: '#666' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  saveBtn: { backgroundColor: '#0ea5e9', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  docBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
  docTitle: { fontWeight: '500' },
  docStatus: { fontSize: 12, color: '#666', marginTop: 2 },
  docArrow: { fontSize: 20 },
  logoutBtn: { margin: 16, padding: 16, backgroundColor: '#ef4444', borderRadius: 8, alignItems: 'center' },
  logoutBtnText: { color: '#fff', fontWeight: 'bold' },
});