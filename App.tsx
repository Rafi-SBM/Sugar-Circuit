import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sugar Circuit</Text>
      <Text style={styles.subtitle}>Match-3 Puzzle Game</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0926',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F4F7FF',
  },
  subtitle: {
    fontSize: 14,
    color: '#9AA7C5',
    marginTop: 8,
  },
});
