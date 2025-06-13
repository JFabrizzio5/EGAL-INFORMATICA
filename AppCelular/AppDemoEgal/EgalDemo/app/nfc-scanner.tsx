import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export default function NFCScannerScreen() {
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Si el usuario ya está autenticado
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ya has iniciado sesión</Text>
        <Text style={styles.description}>
          Ya tienes una sesión activa como {user.username}.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(user.is_admin ? '/(tabs)/adminpanel' : '/(tabs)/useradmin')}
        >
          <Text style={styles.buttonText}>Ir al Panel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTokenValidation = async () => {
    if (!tokenInput.trim()) {
      Alert.alert('Error', 'Por favor ingresa un token para validar');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/v1/validate-token?token=${tokenInput}`);
      
      if (response.data.valid) {
        Alert.alert(
          'Éxito',
          `Token válido para ${response.data.username}`,
          [
            { 
              text: 'Iniciar Sesión', 
              onPress: () => {
                // Aquí podrías implementar la lógica para iniciar sesión con este token
                Alert.alert('Implementación pendiente', 'Esta funcionalidad requiere integración con tu sistema de autenticación');
                router.replace('/');
              } 
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Token inválido');
      }
    } catch (error) {
      console.error('Error validando token:', error);
      Alert.alert('Error', 'Ocurrió un error al validar el token');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateScan = () => {
    // Aquí normalmente integrarías con la API de NFC del dispositivo
    // Para simular, usamos un token de ejemplo (esto es solo demostración)
    Alert.alert(
      'Escaneo simulado',
      'En una implementación real, aquí se activaría el lector NFC del dispositivo. Por ahora, ¿deseas usar un token de ejemplo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Usar ejemplo', 
          onPress: () => {
            // Token de ejemplo - en una app real, esto vendría del escaneo NFC
            setTokenInput('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example_token_simulate_nfc');
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escaneo NFC</Text>
      <Text style={styles.description}>
        Acerca tu dispositivo a un sticker NFC o ingresa manualmente un token de acceso.
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ingresar token manualmente"
          value={tokenInput}
          onChangeText={setTokenInput}
          multiline
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#4299e1" style={styles.loader} />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleTokenValidation}>
            <Text style={styles.buttonText}>Validar Token</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={simulateScan}>
            <Text style={styles.buttonText}>Simular Escaneo NFC</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.backButton]} 
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Volver a Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2d3748',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#718096',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#f7fafc',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#4299e1',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#48bb78',
  },
  backButton: {
    backgroundColor: '#a0aec0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
});