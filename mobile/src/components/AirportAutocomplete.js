import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

const AIRPORT_DB = [
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid' },
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona' },
  { code: 'LHR', name: 'London Heathrow', city: 'London' },
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris' },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam' },
  { code: 'FCO', name: 'Rome Fiumicino', city: 'Rome' },
  { code: 'MXP', name: 'Milan Malpensa', city: 'Milan' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
  { code: 'LGW', name: 'London Gatwick', city: 'London' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
  { code: 'JFK', name: 'New York JFK', city: 'New York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  { code: 'PMI', name: 'Palma de Mallorca', city: 'Mallorca' },
  { code: 'AGP', name: 'Málaga Airport', city: 'Málaga' },
  { code: 'SVQ', name: 'Sevilla Airport', city: 'Sevilla' },
  { code: 'VLC', name: 'Valencia Airport', city: 'Valencia' },
  { code: 'BIO', name: 'Bilbao Airport', city: 'Bilbao' },
  { code: 'LIS', name: 'Lisbon Humberto Delgado', city: 'Lisbon' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris' },
  { code: 'VIE', name: 'Vienna International', city: 'Vienna' },
];

export default function AirportAutocomplete({ value, onSelect, placeholder, style }) {
  const [query, setQuery] = useState(value?.code ? `${value.code} - ${value.city}` : '');
  const [suggestions, setSuggestions] = useState([]);

  function handleChange(text) {
    setQuery(text);
    if (text.length < 2) { setSuggestions([]); return; }
    const q = text.toLowerCase();
    setSuggestions(AIRPORT_DB.filter(a =>
      a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    ).slice(0, 5));
  }

  function selectAirport(airport) {
    setQuery(`${airport.code} - ${airport.city}`);
    setSuggestions([]);
    onSelect(airport);
  }

  return (
    <View style={style}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#666"
      />
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map(airport => (
            <TouchableOpacity key={airport.code} style={styles.suggestion} onPress={() => selectAirport(airport)}>
              <Text style={styles.code}>{airport.code}</Text>
              <Text style={styles.airportName}>{airport.city} — {airport.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: '#16213e', color: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#0f3460' },
  dropdown: { backgroundColor: '#16213e', borderRadius: 8, borderWidth: 1, borderColor: '#0f3460', marginTop: 2, zIndex: 100 },
  suggestion: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#0f3460' },
  code: { color: '#e94560', fontWeight: 'bold', fontSize: 14 },
  airportName: { color: '#ccc', fontSize: 12 },
});
