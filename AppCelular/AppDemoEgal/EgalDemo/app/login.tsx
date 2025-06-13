import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redireccionar si ya hay sesión
  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        router.replace('/(tabs)/adminpanel');
      } else {
        router.replace('/(tabs)/useradmin');
      }
    }
  }, [user]);

  // Mostrar carga mientras verifica autenticación
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  const handleLogin = async () => {
    // Limpiar mensaje de error anterior
    setErrorMessage('');
    
    // Validar entrada
    if (!username) {
      setErrorMessage('Por favor ingresa tu nombre de usuario');
      return;
    }
    
    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(username.toLowerCase(), password);
      if (!user) {
        setErrorMessage('Usuario o contraseña incorrectos');
      } else {
        // La redirección ocurrirá automáticamente por el useEffect
      }
    } catch (error) {
      console.error('Error de login:', error);
      setErrorMessage('No se pudo conectar con el servidor. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>HOTEL EGAL</Text>
        <Text style={styles.logoSubtitle}>Sistema de Control</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color="#e53e3e" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Usuarios disponibles:</Text>
          <Text style={styles.infoItem}>• user1 / password1 (acceso a puerta 1)</Text>
          <Text style={styles.infoItem}>• user2 / password2 (acceso a puerta 2)</Text>
          <Text style={styles.infoItem}>• admin / adminpass (acceso a todas las puertas)</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#4299e1" style={styles.loader} />
        ) : (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/about')}
        >
          <Text style={styles.backButtonText}>Volver a Inicio</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#4299e1',
  },
  logoSubtitle: {
    fontSize: 18,
    color: '#718096',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20,
    color: '#2d3748'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f7fafc',
  },
  infoContainer: {
    backgroundColor: '#ebf8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2b6cb0',
  },
  infoItem: {
    marginBottom: 5,
    color: '#2c5282',
  },
  loadingText: {
    marginTop: 16,
    color: '#4a5568',
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  errorText: {
    color: '#e53e3e',
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4a5568',
    fontSize: 16,
  }
});