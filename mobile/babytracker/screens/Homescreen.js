import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import apiClient from '../services/api';

export default function HomeScreen({ navigation }) {
  const [status, setStatus] = useState('Loading...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const data = await apiClient.get('/health');
      setStatus(`✅ Backend Connected!\n${data.message}`);
      setLoading(false);
    } catch (error) {
      setStatus(`❌ Backend Error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello baby</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Text style={styles.status}>{status}</Text>
      )}

      {/* Navigation Button */}
      <Button
        title="Go to Create User Form"
        onPress={() => navigation.navigate('CreateUser')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  status: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
