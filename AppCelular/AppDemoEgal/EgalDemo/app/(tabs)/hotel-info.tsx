import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HotelInfoScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4299e1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>¡Hola, {user.username}!</Text>
          <Text style={styles.welcomeSubtext}>Te invitamos a visitar nuestras instalaciones</Text>
        </View>
      </View>
      
      <View style={styles.featureCard}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1000' }}
          style={styles.featureImage}
        />
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Nuestra Alberca</Text>
          <Text style={styles.featureDescription}>
            Disfruta de nuestra alberca de agua templada con servicio de toallas y bebidas. Abierta todos los días de 8am a 8pm.
          </Text>
          <TouchableOpacity style={styles.featureButton}>
            <Text style={styles.featureButtonText}>Reservar cabañas</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.servicesContainer}>
        <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
        
        <View style={styles.servicesGrid}>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="restaurant-outline" size={30} color="#4299e1" />
            <Text style={styles.serviceName}>Restaurante</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="fitness-outline" size={30} color="#4299e1" />
            <Text style={styles.serviceName}>Gimnasio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="wifi-outline" size={30} color="#4299e1" />
            <Text style={styles.serviceName}>Wi-Fi Gratis</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="bed-outline" size={30} color="#4299e1" />
            <Text style={styles.serviceName}>Spa</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.eventPromoCard}>
        <View style={styles.eventPromoContent}>
          <Text style={styles.eventPromoTitle}>EVENTO ESPECIAL</Text>
          <Text style={styles.eventPromoSubtitle}>Fiesta de Verano en Hotel EGAL</Text>
          <Text style={styles.eventPromoDescription}>
            Te invitamos a nuestra gran fiesta de verano con música en vivo, cócteles exclusivos y sorpresas para todos los huéspedes.
          </Text>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Ionicons name="calendar-outline" size={20} color="#4299e1" />
              <Text style={styles.eventDetailText}>22 de Julio, 2025</Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Ionicons name="time-outline" size={20} color="#4299e1" />
              <Text style={styles.eventDetailText}>8:00 PM</Text>
            </View>
            <View style={styles.eventDetailItem}>
              <Ionicons name="location-outline" size={20} color="#4299e1" />
              <Text style={styles.eventDetailText}>Terraza Principal</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Registrarme al evento</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  welcomeContainer: {
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  featureCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureImage: {
    height: 200,
    width: '100%',
  },
  featureContent: {
    padding: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4a5568',
    marginBottom: 16,
  },
  featureButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  featureButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  servicesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceName: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    textAlign: 'center',
  },
  eventPromoCard: {
    margin: 16,
    marginBottom: 30,
    backgroundColor: '#ebf8ff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventPromoContent: {
    padding: 20,
  },
  eventPromoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4299e1',
    marginBottom: 5,
  },
  eventPromoSubtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c5282',
    marginBottom: 10,
  },
  eventPromoDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2a4365',
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 20,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2a4365',
  },
  registerButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});