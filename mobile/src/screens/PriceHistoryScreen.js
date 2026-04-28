import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import PriceChart from '../components/PriceChart';
import PriceHistoryTable from '../components/PriceHistoryTable';
import client from '../api/client';

export default function PriceHistoryScreen({ route }) {
  const { searchId, route: flightRoute } = route.params;
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [histRes, statsRes] = await Promise.all([
        client.get(`/searches/${searchId}/history`),
        client.get(`/prices/${searchId}/stats`),
      ]);
      setRecords(histRes.data.records);
      setStats(statsRes.data.stats);
      setLoading(false);
    }
    load();
  }, [searchId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{flightRoute}</Text>
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.min_price ?? '—'}€</Text>
            <Text style={styles.statLabel}>Mínimo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.max_price ?? '—'}€</Text>
            <Text style={styles.statLabel}>Máximo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.avg_price ? Math.round(stats.avg_price) : '—'}€</Text>
            <Text style={styles.statLabel}>Media</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.data_points ?? 0}</Text>
            <Text style={styles.statLabel}>Registros</Text>
          </View>
        </View>
      )}
      <Text style={styles.sectionTitle}>Evolución de precio</Text>
      <PriceChart records={records} />
      <Text style={styles.sectionTitle}>Historial</Text>
      <PriceHistoryTable records={records} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 16 },
  center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  statVal: { color: '#e94560', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  sectionTitle: {
    color: '#aaa',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
});
