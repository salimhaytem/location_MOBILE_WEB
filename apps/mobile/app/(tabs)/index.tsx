import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { vehiclesApi, formatPrice } from '../../src/lib/api';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  category: { name: string };
  transmission: string;
  pricePerDay: number;
  images: string[];
  status: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState({ city: '', startDate: '', endDate: '' });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ category: '', transmission: '', maxPrice: '' });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await vehiclesApi.getAll(filters);
      setVehicles(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/vehicle/${item.id}`)}>
      <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.brand} {item.model}</Text>
        <Text style={styles.cardCategory}>{item.category?.name}</Text>
        <View style={styles.cardDetails}>
          <Text>{item.transmission === 'AUTO' ? 'Auto' : 'Manuelle'}</Text>
          <Text style={styles.cardPrice}>{formatPrice(item.pricePerDay)}/jour</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CarLoc</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput style={styles.input} placeholder="Ville" value={search.city} onChangeText={(v) => setSearch({ ...search, city: v })} />
        <View style={styles.dateRow}>
          <TextInput style={styles.inputDate} placeholder="Début" value={search.startDate} onChangeText={(v) => setSearch({ ...search, startDate: v })} />
          <TextInput style={styles.inputDate} placeholder="Fin" value={search.endDate} onChangeText={(v) => setSearch({ ...search, endDate: v })} />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Rechercher</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity style={[styles.filterBtn, filters.category && styles.filterBtnActive]} onPress={() => setFilters({ ...filters, category: filters.category ? '' : 'economique' })}>
          <Text>Économique</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filters.transmission === 'AUTO' && styles.filterBtnActive]} onPress={() => setFilters({ ...filters, transmission: filters.transmission === 'AUTO' ? '' : 'AUTO' })}>
          <Text>Auto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filters.maxPrice && styles.filterBtnActive]} onPress={() => setFilters({ ...filters, maxPrice: filters.maxPrice ? '' : '500' })}>
          <Text>&lt; 500</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" style={styles.loader} /> : (
        <FlatList data={vehicles} renderItem={renderVehicle} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#0ea5e9', paddingTop: 50 },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  searchBox: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 8 },
  inputDate: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  searchBtn: { backgroundColor: '#0ea5e9', padding: 14, borderRadius: 8, alignItems: 'center' },
  searchBtnText: { color: '#fff', fontWeight: 'bold' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20 },
  filterBtnActive: { backgroundColor: '#0ea5e9' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardImage: { width: '100%', height: 150 },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardCategory: { color: '#666', fontSize: 14 },
  cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cardPrice: { fontSize: 18, fontWeight: 'bold', color: '#0ea5e9' },
  loader: { marginTop: 50 },
});