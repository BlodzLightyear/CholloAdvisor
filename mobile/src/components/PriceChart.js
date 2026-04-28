import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PriceChart({ records }) {
  if (records.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Se necesitan al menos 2 puntos de datos para mostrar el gráfico</Text>
      </View>
    );
  }

  const sorted = [...records].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  const prices = sorted.map(r => r.price_euros);
  const labels = sorted.map((r, i) =>
    i % Math.ceil(sorted.length / 5) === 0
      ? new Date(r.recorded_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
      : ''
  );

  return (
    <LineChart
      data={{ labels, datasets: [{ data: prices, color: () => '#e94560', strokeWidth: 2 }] }}
      width={SCREEN_WIDTH - 32}
      height={200}
      chartConfig={{
        backgroundColor: '#16213e',
        backgroundGradientFrom: '#16213e',
        backgroundGradientTo: '#1a1a2e',
        decimalPlaces: 0,
        color: () => '#e94560',
        labelColor: () => '#aaa',
        propsForDots: { r: '4', strokeWidth: '2', stroke: '#e94560' },
      }}
      bezier
      style={styles.chart}
    />
  );
}

const styles = StyleSheet.create({
  chart: { borderRadius: 12, marginVertical: 8 },
  empty: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
  },
  emptyText: { color: '#666', textAlign: 'center' },
});
