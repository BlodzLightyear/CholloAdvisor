import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SearchCard from '../components/SearchCard';
import client from '../api/client';

export default function ActiveSearchesScreen({ navigation }) {
  const [searches, setSearches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSearches = useCallback(async () => {
    try {
      const res = await client.get('/searches');
      setSearches(res.data.searches);
    } catch (err) {
      if (err.response?.status === 401) navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadSearches(); }, [loadSearches]));

  async function handleRefresh() {
    setRefreshing(true);
    await loadSearches();
    setRefreshing(false);
  }

  async function toggleSearch(search) {
    try {
      const newStatus = search.status === 'active' ? 'paused' : 'active';
      await client.put(`/searches/${search.id}`, { status: newStatus });
      loadSearches();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la búsqueda');
    }
  }

  async function deleteSearch(id) {
    Alert.alert('Eliminar', '¿Eliminar esta búsqueda?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await client.delete(`/searches/${id}`);
          loadSearches();
        } catch {
          Alert.alert('Error', 'No se pudo eliminar la búsqueda');
        }
      }},
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={searches}
        keyExtractor={s => String(s.id)}
        renderItem={({ item }) => (
          <SearchCard
            search={item}
            onHistory={() => navigation.navigate('PriceHistory', { searchId: item.id, route: `${item.origin}→${item.destination}` })}
            onToggle={() => toggleSearch(item)}
            onDelete={() => deleteSearch(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e94560" />}
        ListEmptyComponent={<Text style={styles.empty}>Sin búsquedas activas.{'\n'}Toca + para crear una.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SearchForm')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  list: { padding: 16 },
  empty: { color: '#666', textAlign: 'center', marginTop: 80, fontSize: 16, lineHeight: 26 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#e94560', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
