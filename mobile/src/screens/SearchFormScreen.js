import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AirportAutocomplete from '../components/AirportAutocomplete';
import { loadSettings } from '../store/settingsStore';
import client from '../api/client';

const FREQUENCY_OPTIONS = [
  { label: 'Cada hora', value: 1 },
  { label: 'Cada 3 horas', value: 3 },
  { label: 'Cada 6 horas', value: 6 },
  { label: 'Cada 12 horas', value: 12 },
  { label: 'Diaria', value: 24 },
];

export default function SearchFormScreen({ navigation }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [departDate, setDepartDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(null);
  const [passengers, setPassengers] = useState(1);
  const [frequencyHours, setFrequencyHours] = useState(6);
  const [showDepartPicker, setShowDepartPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings().then(s => setFrequencyHours(s.defaultFrequencyHours));
  }, []);

  function formatDate(d) {
    return d ? d.toISOString().split('T')[0] : 'Sin fecha';
  }

  async function handleSave() {
    if (!origin || !destination) return Alert.alert('Error', 'Selecciona origen y destino');
    setLoading(true);
    try {
      await client.post('/searches', {
        origin: origin.code,
        destination: destination.code,
        departDate: formatDate(departDate),
        returnDate: returnDate ? formatDate(returnDate) : undefined,
        passengers,
        frequencyHours,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Origen</Text>
      <AirportAutocomplete value={origin} onSelect={setOrigin} placeholder="MAD - Madrid" style={styles.field} />

      <Text style={styles.label}>Destino</Text>
      <AirportAutocomplete value={destination} onSelect={setDestination} placeholder="LHR - London" style={styles.field} />

      <Text style={styles.label}>Fecha ida</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDepartPicker(true)}>
        <Text style={styles.dateText}>{formatDate(departDate)}</Text>
      </TouchableOpacity>
      {showDepartPicker && (
        <DateTimePicker value={departDate} mode="date" minimumDate={new Date()} onChange={(_, d) => { setShowDepartPicker(false); if (d) setDepartDate(d); }} />
      )}

      <Text style={styles.label}>Fecha vuelta (opcional)</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowReturnPicker(true)}>
        <Text style={styles.dateText}>{returnDate ? formatDate(returnDate) : 'Solo ida'}</Text>
      </TouchableOpacity>
      {showReturnPicker && (
        <DateTimePicker value={returnDate ?? departDate} mode="date" minimumDate={departDate} onChange={(_, d) => { setShowReturnPicker(false); if (d) setReturnDate(d); }} />
      )}

      <Text style={styles.label}>Pasajeros: {passengers}</Text>
      <View style={styles.counter}>
        <TouchableOpacity style={styles.counterBtn} onPress={() => setPassengers(Math.max(1, passengers - 1))}><Text style={styles.counterText}>−</Text></TouchableOpacity>
        <Text style={styles.counterValue}>{passengers}</Text>
        <TouchableOpacity style={styles.counterBtn} onPress={() => setPassengers(Math.min(9, passengers + 1))}><Text style={styles.counterText}>+</Text></TouchableOpacity>
      </View>

      <Text style={styles.label}>Frecuencia de búsqueda</Text>
      <View style={styles.frequencyRow}>
        {FREQUENCY_OPTIONS.map(opt => (
          <TouchableOpacity key={opt.value} style={[styles.freqBtn, frequencyHours === opt.value && styles.freqBtnActive]} onPress={() => setFrequencyHours(opt.value)}>
            <Text style={[styles.freqText, frequencyHours === opt.value && styles.freqTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Guardando...' : 'Guardar búsqueda'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  label: { color: '#aaa', fontSize: 13, marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  field: { marginBottom: 4 },
  dateButton: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#0f3460' },
  dateText: { color: '#fff', fontSize: 16 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  counterBtn: { backgroundColor: '#0f3460', borderRadius: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  counterText: { color: '#fff', fontSize: 22 },
  counterValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', minWidth: 30, textAlign: 'center' },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqBtn: { backgroundColor: '#16213e', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#0f3460' },
  freqBtnActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  freqText: { color: '#aaa', fontSize: 13 },
  freqTextActive: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32, marginBottom: 40 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
