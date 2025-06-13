import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import * as Linking from 'expo-linking';

export default function PuertaScreen() {
  const { id, token } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Procesando solicitud...');

  useEffect(() => {
    handleDoorOpen();
  }, [id, token, user]);

  const handleDoorOpen = async () => {
    try {
      // Primero intentar con token de query param (si viene de NFC)
      if (token) {
        const response = await axios.get(`${API_URL}/puertas/v1/abrir/${id}?token=${token}`);
        setStatus('success');
        setMessage(`Puerta ${id} abierta correctamente`);
        return;
      }
      
      // Si no hay token en query, usar el del usuario autenticado
      if (user && user.token) {
        const response = await axios.post(`${API_URL}/puertas/v1/abrir`, {
          puerta_id: id,
          accion: "abrir",
          user_id: user.id
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        setStatus('success');
        setMessage(`Puerta ${id} abierta correctamente`);
        return;
      }
      
      // Si no hay usuario autenticado ni token, redirigir a login
      setStatus('error');
      setMessage('No hay sesión activa');
      setTimeout(() => {
        router.replace('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error abriendo puerta:', error);
      
      if (error.response?.status === 403) {
        setStatus('error');
        setMessage('No tienes permiso para abrir esta puerta');
      } else {
        setStatus('error');
        setMessage('Error abriendo la puerta. Intenta nuevamente.');
      }
    }
  };

  let statusColor = '#4299e1'; // Default blue
  if (status === 'success') statusColor = '#38a169'; // Green
  if (status === 'error') statusColor = '#e53e3e'; // Red

  return (
    <View style={styles.container}>
      <View style={[styles.statusCard, { borderColor: statusColor }]}>
        <Text style={[styles.statusTitle, { color: statusColor }]}>
          {status === 'loading' && 'Procesando...'}
          {status === 'success' && '¡Éxito!'}
          {status === 'error' && 'Error'}
        </Text>
        
        {status === 'loading' && (
          <ActivityIndicator size="large" color={statusColor} style={styles.loader} />
        )}
        
        {status === 'success' && (
          <Text style={styles.successIcon}>✓</Text>
        )}
        
        {status === 'error' && (
          <Text style={styles.errorIcon}>✗</Text>
        )}
        
        <Text style={styles.statusMessage}>{message}</Text>
        
        {status !== 'loading' && (
          <Text 
            style={styles.returnLink}
            onPress={() => router.replace(user?.is_admin ? '/(tabs)/adminpanel' : '/(tabs)/useradmin')}
          >
            Volver al panel
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  statusCard: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 400,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  successIcon: {
    fontSize: 80,
    color: '#38a169',
    marginVertical: 20,
  },
  errorIcon: {
    fontSize: 80,
    color: '#e53e3e',
    marginVertical: 20,
  },
  statusMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#4a5568',
  },
  returnLink: {
    color: '#4299e1',
    fontSize: 16,
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});