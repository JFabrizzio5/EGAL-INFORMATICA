import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    if (!username || !password) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(username.toLowerCase(), password);
      if (!user) {
        Alert.alert('Error', 'Usuario o contraseña incorrectos');
      } else {
        // La redirección ocurrirá automáticamente por el useEffect
      }
    } catch (error) {
      console.error('Error de login:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>EGAL</Text>
        <Text style={styles.logoSubtitle}>Sistema de Control</Text>
      </View>

      <Text style={styles.title}>Iniciar Sesión</Text>
      
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
        <>
          <Button title="Entrar" onPress={handleLogin} color="#4299e1" />
          
          <View style={styles.altLoginContainer}>
            <Text style={styles.orText}>o</Text>
            <Button 
              title="Acceder con NFC/Código QR" 
              onPress={() => router.push('/nfc-scanner')} 
              color="#718096" 
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
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
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 24,
    color: '#2d3748'
  },
  infoContainer: {
    backgroundColor: '#ebf8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4299e1',
  },
  infoText: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2b6cb0',
  },
  infoItem: {
    marginBottom: 4,
    color: '#2c5282',
  },
  input: { 
    height: 50, 
    borderColor: '#e2e8f0', 
    borderWidth: 1, 
    marginBottom: 16, 
    paddingHorizontal: 12, 
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  loader: {
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#718096',
  },
  altLoginContainer: {
    marginTop: 20,
  },
  orText: {
    textAlign: 'center',
    color: '#718096',
    marginVertical: 10,
  },
});
