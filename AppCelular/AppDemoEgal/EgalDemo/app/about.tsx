import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; // Asegúrate de que la ruta sea correcta

export default function AboutScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Si el usuario está autenticado, redirigir una sola vez
    if (user) {
      if (user.is_admin) {
        router.replace('/(tabs)/adminpanel');
      } else {
        router.replace('/(tabs)/useradmin');
      }
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000' }} 
        style={styles.headerImage}
      >
        <View style={styles.overlay}>
          <Text style={styles.hotelName}>HOTEL EGAL</Text>
          <Text style={styles.tagline}>Una experiencia inolvidable</Text>
        </View>
      </ImageBackground>

      <View style={styles.loginButtonContainer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Ionicons name="log-in-outline" size={24} color="white" />
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Bienvenido a Hotel EGAL</Text>
        <Text style={styles.welcomeText}>
          Disfrute de nuestras instalaciones de lujo, servicio personalizado y una experiencia única.
          Nuestro hotel está diseñado para brindarle confort y exclusividad en cada momento de su estancia.
        </Text>
      </View>

      <View style={styles.promotionSection}>
        <Text style={styles.sectionTitle}>Promociones Especiales</Text>
        
        <View style={styles.promotionCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=870' }}
            style={styles.promotionImage}
          />
          <View style={styles.promotionContent}>
            <Text style={styles.promotionTitle}>Escapada Romántica</Text>
            <Text style={styles.promotionDescription}>
              Disfrute de una estadía inolvidable con su pareja. Incluye cena a la luz de las velas y acceso al spa.
            </Text>
          </View>
        </View>

        <View style={styles.promotionCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?q=80&w=1000' }}
            style={styles.promotionImage}
          />
          <View style={styles.promotionContent}>
            <Text style={styles.promotionTitle}>Paquete Familiar</Text>
            <Text style={styles.promotionDescription}>
              Diversión para toda la familia con acceso ilimitado a nuestras instalaciones recreativas.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.eventSection}>
        <Text style={styles.eventTitle}>¡Te invitamos al mejor evento en Hotel EGAL!</Text>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?q=80&w=870' }}
          style={styles.eventImage}
        />
        <Text style={styles.eventDescription}>
          No te pierdas nuestra cena de gala anual con los mejores platillos gourmet, música en vivo y una noche inolvidable.
          Fecha: 15 de Julio de 2025
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerImage: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  loginButtonContainer: {
    position: 'absolute',
    top: 220,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  loginButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4a5568',
  },
  promotionSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },
  promotionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  promotionImage: {
    height: 200,
    width: '100%',
  },
  promotionContent: {
    padding: 15,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  promotionDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  eventSection: {
    backgroundColor: '#ebf8ff',
    padding: 20,
    marginHorizontal: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5282',
    marginBottom: 15,
    textAlign: 'center',
  },
  eventImage: {
    height: 180,
    width: '100%',
    borderRadius: 8,
    marginBottom: 15,
  },
  eventDescription: {
    fontSize: 15,
    color: '#2a4365',
    lineHeight: 22,
    textAlign: 'center',
  },
});