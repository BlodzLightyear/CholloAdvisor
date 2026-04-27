import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

const defaults = { defaultFrequencyHours: 6, alertThresholdEuros: 10 };

export async function loadSettings() {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
}

export async function saveSettings(partial) {
  const current = await loadSettings();
  const updated = { ...current, ...partial };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}
