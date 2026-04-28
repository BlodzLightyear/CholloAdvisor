import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PriceHistoryTable({ records }) {
  const [airlineFilter, setAirlineFilter] = useState(null);

  const airlines = [...new Set(records.map(r => r.airline))];
  const filtered = airlineFilter ? records.filter(r => r.airline === airlineFilter) : records;
  const sorted = [...filtered].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

  return (
    <View>
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterBtn, !airlineFilter && styles.filterActive]}
          onPress={() => setAirlineFilter(null)}
        >
          <Text style={styles.filterText}>Todas</Text>
        </TouchableOpacity>
        {airlines.map(a => (
          <TouchableOpacity
            key={a}
            style={[styles.filterBtn, airlineFilter === a && styles.filterActive]}
            onPress={() => setAirlineFilter(a)}
          >
            <Text style={styles.filterText}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colDate]}>Fecha</Text>
        <Text style={[styles.col, styles.colPrice]}>Precio</Text>
        <Text style={[styles.col, styles.colAirline]}>Aerolínea</Text>
      </View>
      {sorted.map(r => (
        <View key={r.id} style={styles.row}>
          <Text style={[styles.col, styles.colDate]}>
            {new Date(r.recorded_at).toLocaleDateString('es-ES')}
          </Text>
          <Text style={[styles.col, styles.colPrice, styles.priceText]}>{r.price_euros}€</Text>
          <Text style={[styles.col, styles.colAirline]}>{r.airline}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterBtn: {
    backgroundColor: '#16213e',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  filterActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  filterText: { color: '#fff', fontSize: 12 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  row: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  col: { color: '#ccc', fontSize: 13 },
  colDate: { flex: 2 },
  colPrice: { flex: 1, textAlign: 'right' },
  colAirline: { flex: 2, textAlign: 'right' },
  priceText: { color: '#e94560', fontWeight: 'bold' },
});
