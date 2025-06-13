import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, ScrollView, Share, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants/api';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

export default function NFCGeneratorScreen() {
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    if (!user || !user.is_admin) {
      Alert.alert(
        "Acceso Denegado", 
        "Solo administradores pueden generar tokens NFC", 
        [{ text: "OK", onPress: () => router.back() }]
      );
      return;
    }

    if (!userId) {
      Alert.alert(
        "Error", 
        "ID de usuario no especificado", 
        [{ text: "OK", onPress: () => router.back() }]
      );
      return;
    }

    generateToken();
  }, [user, userId]);

  const generateToken = async () => {
    setLoading(true);
    try {
      // Obtener información del usuario
      const userResponse = await axios.get(`${API_URL}/auth/v1/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTargetUser(userResponse.data);

      // Generar token NFC
      const response = await axios.get(`${API_URL}/auth/v1/generate-access-token/${userId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setTokenData(response.data);
    } catch (error) {
      console.error('Error generando token:', error);
      Alert.alert(
        "Error", 
        "No se pudo generar el token NFC. Intenta nuevamente.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const shareToken = async (doorId) => {
    if (!tokenData) return;
    
    try {
      const tokenUrl = `${API_URL}/puertas/v1/abrir/${doorId}?token=${tokenData.access_token}`;
      const appDeepLink = `egaldemo://puerta/${doorId}?token=${tokenData.access_token}`;
      
      await Share.share({
        message: `Acceso a puerta ${doorId} para ${tokenData.username}.\n\nURL: ${tokenUrl}\n\nAbrir con app: ${appDeepLink}`,
        title: `Acceso a puerta ${doorId}`
      });
    } catch (error) {
      console.error('Error compartiendo token:', error);
      Alert.alert("Error", "No se pudo compartir el token");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Generando token NFC...</Text>
      </View>
    );
  }

  // Lista de puertas a las que tiene acceso el usuario
  const userDoors = targetUser?.puertas_acceso || [];
  const allDoors = [
    { id: "puerta1", nombre: "Puerta 1" },
    { id: "puerta2", nombre: "Puerta 2" },
    { id: "puerta3", nombre: "Puerta 3" }
  ];
  const accessibleDoors = allDoors.filter(door => 
    userDoors.includes(door.id) || targetUser?.is_admin
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generador de Tokens NFC</Text>
        <TouchableOpacity 
          style={styles.helpButton} 
          onPress={() => router.push('/nfc-help')}
        >
          <Ionicons name="help-circle" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {tokenData ? (
        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Token Generado</Text>
            <Text style={styles.userInfo}>
              Usuario: <Text style={styles.highlight}>{tokenData.username}</Text>
            </Text>
            <Text style={styles.userInfo}>
              Vence en: <Text style={styles.highlight}>{tokenData.expires_in_days} días</Text>
            </Text>
            
            <View style={styles.separator} />
            
            <Text style={styles.sectionTitle}>Selecciona una puerta:</Text>
            
            {accessibleDoors.length > 0 ? (
              <View style={styles.doorsList}>
                {accessibleDoors.map(door => (
                  <View key={door.id} style={styles.doorCard}>
                    <View style={styles.doorHeader}>
                      <Text style={styles.doorName}>{door.nombre}</Text>
                    </View>
                    
                    <View style={styles.qrContainer}>
                      <QRCode
                        value={`${API_URL}/puertas/v1/abrir/${door.id}?token=${tokenData.access_token}`}
                        size={200}
                        color="#2d3748"
                        backgroundColor="white"
                      />
                    </View>
                    
                    <Text style={styles.scanInstructions}>
                      Escanea este código para abrir la puerta o programa un tag NFC con la URL
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.shareButton} 
                      onPress={() => shareToken(door.id)}
                    >
                      <Text style={styles.shareButtonText}>Compartir Acceso</Text>
                      <Ionicons name="share-outline" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDoors}>
                El usuario no tiene acceso a ninguna puerta
              </Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e53e3e" />
          <Text style={styles.errorText}>
            No se pudo generar el token. Intenta nuevamente.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={generateToken}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4a5568',
    padding: 16,
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  helpButton: {
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  userInfo: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 8,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#2b6cb0',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  doorsList: {
    gap: 16,
  },
  doorCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doorHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  doorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  scanInstructions: {
    textAlign: 'center',
    color: '#718096',
    marginBottom: 16,
  },
  shareButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  noDoors: {
    textAlign: 'center',
    color: '#718096',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#4a5568',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4299e1',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#718096',
  },
});