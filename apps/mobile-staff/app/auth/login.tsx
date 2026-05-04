import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(form);
      if (res.data.user.role !== 'STAFF' && res.data.user.role !== 'ADMIN') {
        Alert.alert('Erreur', 'Accès réservé au personnel');
        return;
      }
      await login(res.data.user, res.data.accessToken);
      router.replace('/planning');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚗 CarLoc Staff</Text>
        <Text style={styles.subtitle}>Connexion employé</Text>
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Mot de passe" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#0ea5e9' },
  subtitle: { color: '#666', marginTop: 8 },
  form: {},
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  btn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});