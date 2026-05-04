import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(form);
      await login(res.data.user, res.data.accessToken);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CarLoc</Text>
        <Text style={styles.subtitle}>Créer un compte</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.row}>
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Prénom" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <TextInput style={[styles.input, styles.halfInput]} placeholder="Nom" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
        </View>
        <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Téléphone (optionnel)" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Mot de passe" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Création...' : 'Créer mon compte'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>Déjà inscrit? Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 40, alignItems: 'center', paddingTop: 60 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#0ea5e9' },
  subtitle: { color: '#666', marginTop: 8 },
  form: { padding: 24 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  btn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#0ea5e9', fontSize: 16 },
});