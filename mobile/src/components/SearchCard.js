import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function PriceTrend({ current, best }) {
  if (!best || current === best) return <Text style={styles.trendFlat}>→</Text>;
  return current < best
    ? <Text style={styles.trendDown}>↓ mejor precio</Text>
    : <Text style={styles.trendUp}>↑</Text>;
}

export default function SearchCard({ search, onHistory, onToggle, onDelete }) {
  const isActive = search.status === 'active';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{search.origin} → {search.destination}</Text>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgePaused]}>
          <Text style={styles.badgeText}>{isActive ? 'Activa' : 'Pausada'}</Text>
        </View>
      </View>
      <Text style={styles.dates}>{search.depart_date}{search.return_date ? ` · vuelta ${search.return_date}` : ''} · {search.passengers} pax</Text>
      <View style={styles.priceRow}>
        {search.best_price_euros ? (
          <>
            <Text style={styles.price}>{search.best_price_euros}€</Text>
            <Text style={styles.airline}>{search.best_price_airline}</Text>
            <PriceTrend current={search.best_price_euros} best={search.best_price_euros} />
          </>
        ) : (
          <Text style={styles.noPrice}>Sin datos aún</Text>
        )}
      </View>
      <Text style={styles.lastChecked}>{search.last_checked_at ? `Última comprobación: ${new Date(search.last_checked_at).toLocaleString('es-ES')}` : 'Aún no comprobado'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onHistory}><Text style={styles.actionText}>📈 Historial</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onToggle}><Text style={styles.actionText}>{isActive ? '⏸ Pausar' : '▶ Reanudar'}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}><Text style={styles.actionText}>🗑</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#0f3460' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  route: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  badge: { borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8 },
  badgeActive: { backgroundColor: '#1a6b3c' },
  badgePaused: { backgroundColor: '#5a4a00' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  dates: { color: '#888', fontSize: 12, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  price: { color: '#e94560', fontSize: 26, fontWeight: 'bold' },
  airline: { color: '#aaa', fontSize: 14 },
  trendDown: { color: '#2ecc71', fontWeight: 'bold' },
  trendUp: { color: '#e74c3c', fontWeight: 'bold' },
  trendFlat: { color: '#aaa' },
  noPrice: { color: '#666', fontStyle: 'italic' },
  lastChecked: { color: '#555', fontSize: 11, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#0f3460', borderRadius: 8, padding: 8, alignItems: 'center' },
  deleteBtn: { flex: 0, paddingHorizontal: 16 },
  actionText: { color: '#fff', fontSize: 13 },
});
