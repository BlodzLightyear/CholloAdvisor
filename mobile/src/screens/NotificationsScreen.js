import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, Linking, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../store/authContext';

function NotificationItem({ item }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.price}>{item.price_euros}€</Text>
        <Text style={styles.time}>{new Date(item.created_at).toLocaleString('es-ES')}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      {item.flight_url && (
        <TouchableOpacity onPress={() => Linking.openURL(item.flight_url)}>
          <Text style={styles.link}>Ver vuelo →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function NotificationsScreen() {
  const { setAuthed } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await client.get('/prices/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      if (err.response?.status === 401) setAuthed(false);
    }
  }, [setAuthed]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={n => String(n.id)}
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e94560" />}
        ListEmptyComponent={<Text style={styles.empty}>Sin alertas aún.{'\n'}Las notificaciones de bajada de precio aparecerán aquí.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  list: { padding: 16 },
  item: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  price: { color: '#e94560', fontSize: 20, fontWeight: 'bold' },
  time: { color: '#666', fontSize: 12, alignSelf: 'center' },
  message: { color: '#ccc', fontSize: 14, marginBottom: 8 },
  link: { color: '#e94560', fontSize: 13 },
  empty: { color: '#666', textAlign: 'center', marginTop: 80, fontSize: 15, lineHeight: 26 },
});
