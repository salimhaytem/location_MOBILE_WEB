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
      await login(res.data.user, res.data.accessToken);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CarLoc</Text>
        <Text style={styles.subtitle}>Connexion à votre compte</Text>
      </View>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Mot de passe" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.link}>Pas de compte? S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 40, alignItems: 'center', paddingTop: 80 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#0ea5e9' },
  subtitle: { color: '#666', marginTop: 8 },
  form: { padding: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  btn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  btnDisabled: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#0ea5e9', fontSize: 16 },
});