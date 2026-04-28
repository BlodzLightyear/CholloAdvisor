import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { loadSettings, saveSettings } from '../store/settingsStore';
import { logout } from '../store/authStore';
import client from '../api/client';

const FREQ_OPTIONS = [1, 3, 6, 12, 24];
const THRESHOLD_OPTIONS = [5, 10, 15, 20, 30];

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({ defaultFrequencyHours: 6, alertThresholdEuros: 10 });

  useEffect(() => { loadSettings().then(setSettings); }, []);

  async function updateFrequency(v) {
    const updated = await saveSettings({ defaultFrequencyHours: v });
    setSettings(updated);
    await client.put('/auth/settings', { defaultFrequencyHours: v }).catch(() => {});
  }

  async function updateThreshold(v) {
    const updated = await saveSettings({ alertThresholdEuros: v });
    setSettings(updated);
    await client.put('/auth/settings', { alertThresholdEuros: v }).catch(() => {});
  }

  function confirmClearData() {
    Alert.alert('Eliminar datos', '¿Eliminar todas tus búsquedas y datos? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar todo', style: 'destructive', onPress: async () => {
        const searches = (await client.get('/searches')).data.searches;
        await Promise.all(searches.map(s => client.delete(`/searches/${s.id}`)));
        Alert.alert('Listo', 'Todos los datos eliminados');
      }},
    ]);
  }

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Frecuencia por defecto</Text>
      <View style={styles.row}>
        {FREQ_OPTIONS.map(v => (
          <TouchableOpacity key={v} style={[styles.chip, settings.defaultFrequencyHours === v && styles.chipActive]} onPress={() => updateFrequency(v)}>
            <Text style={[styles.chipText, settings.defaultFrequencyHours === v && styles.chipTextActive]}>{v}h</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Umbral de alerta (€ de bajada)</Text>
      <View style={styles.row}>
        {THRESHOLD_OPTIONS.map(v => (
          <TouchableOpacity key={v} style={[styles.chip, settings.alertThresholdEuros === v && styles.chipActive]} onPress={() => updateThreshold(v)}>
            <Text style={[styles.chipText, settings.alertThresholdEuros === v && styles.chipTextActive]}>{v}€</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.spacer} />
      <TouchableOpacity style={styles.dangerBtn} onPress={confirmClearData}>
        <Text style={styles.dangerText}>Eliminar todos los datos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  sectionTitle: { color: '#aaa', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: '#16213e', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#0f3460' },
  chipActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  chipText: { color: '#aaa', fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  spacer: { flex: 1 },
  dangerBtn: { backgroundColor: '#3c1515', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e94560' },
  dangerText: { color: '#e94560', fontWeight: 'bold', fontSize: 15 },
  logoutBtn: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  logoutText: { color: '#aaa', fontSize: 15 },
});
