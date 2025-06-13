import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HotelInfoScreen() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  
  const openModal = (modalType) => {
    setActiveModal(modalType);
    setModalVisible(true);
  };

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
          <Text style={styles.welcomeSubtext}>Bienvenido a Hotel EGAL</Text>
        </View>
      </View>
      
      {/* Sección de Mensajes - Primera posición después del header */}
      <View style={styles.messageSection}>
        <Text style={styles.messageSectionTitle}>Mensajes y Solicitudes</Text>
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Escribe un mensaje o solicitud..."
            placeholderTextColor="#a0aec0"
            multiline={false}
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={22} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.quickMessagesContainer}>
          <TouchableOpacity style={styles.quickMessageButton}>
            <Text style={styles.quickMessageText}>Necesito toallas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMessageButton}>
            <Text style={styles.quickMessageText}>Info del restaurante</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickMessageButton}>
            <Text style={styles.quickMessageText}>Servicio a habitación</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sección de Tarjetas Grandes para Flujo Visual */}
      <View style={styles.serviceCardsContainer}>
        <Text style={styles.sectionTitle}>Servicios Principales</Text>
        
        <View style={styles.cardsGrid}>
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => openModal('reserva')}
          >
            <Ionicons name="calendar" size={36} color="#4299e1" />
            <Text style={styles.serviceCardTitle}>Mi Reservación</Text>
            <Text style={styles.serviceCardDescription}>Ver o modificar detalles</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => openModal('habitacion')}
          >
            <Ionicons name="bed" size={36} color="#4299e1" />
            <Text style={styles.serviceCardTitle}>Servicio a Habitación</Text>
            <Text style={styles.serviceCardDescription}>Comida y limpieza</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => openModal('actividades')}
          >
            <Ionicons name="body" size={36} color="#4299e1" />
            <Text style={styles.serviceCardTitle}>Actividades</Text>
            <Text style={styles.serviceCardDescription}>Explorar y reservar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => openModal('checkout')}
          >
            <Ionicons name="exit" size={36} color="#4299e1" />
            <Text style={styles.serviceCardTitle}>Check-out Express</Text>
            <Text style={styles.serviceCardDescription}>Finalizar estancia</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Promociones Destacadas */}
      <View style={styles.promotionsSection}>
        <Text style={styles.sectionTitle}>Promociones Especiales</Text>
        
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          style={styles.promotionScroll}
        >
          <TouchableOpacity style={styles.promotionCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000' }}
              style={styles.promotionImage}
            />
            <View style={styles.promotionContent}>
              <Text style={styles.promotionTitle}>Spa Premium</Text>
              <Text style={styles.promotionDiscount}>20% OFF</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.promotionCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000' }}
              style={styles.promotionImage}
            />
            <View style={styles.promotionContent}>
              <Text style={styles.promotionTitle}>Cena Romántica</Text>
              <Text style={styles.promotionDiscount}>2x1</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.promotionCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1468824357306-a439d58ccb1c?q=80&w=1000' }}
              style={styles.promotionImage}
            />
            <View style={styles.promotionContent}>
              <Text style={styles.promotionTitle}>Tour por la Ciudad</Text>
              <Text style={styles.promotionDiscount}>15% OFF</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Instalaciones */}
      <View style={styles.facilitiesSection}>
        <Text style={styles.sectionTitle}>Nuestras Instalaciones</Text>
        
        <View style={styles.facilityCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1000' }}
            style={styles.facilityImage}
          />
          <View style={styles.facilityDetails}>
            <Text style={styles.facilityTitle}>Alberca</Text>
            <Text style={styles.facilityHours}>Abierto: 8:00 AM - 8:00 PM</Text>
            <View style={styles.facilityStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Abierto ahora</Text>
            </View>
            <TouchableOpacity style={styles.facilityButton}>
              <Text style={styles.facilityButtonText}>Reservar una cabaña</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.facilityCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?q=80&w=1000' }}
            style={styles.facilityImage}
          />
          <View style={styles.facilityDetails}>
            <Text style={styles.facilityTitle}>Gimnasio</Text>
            <Text style={styles.facilityHours}>Abierto: 6:00 AM - 10:00 PM</Text>
            <View style={styles.facilityStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Abierto ahora</Text>
            </View>
            <TouchableOpacity style={styles.facilityButton}>
              <Text style={styles.facilityButtonText}>Agendar entrenador</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Modales para cada tipo de servicio */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'reserva' && 'Mi Reservación'}
                {activeModal === 'habitacion' && 'Servicio a Habitación'}
                {activeModal === 'actividades' && 'Actividades'}
                {activeModal === 'checkout' && 'Check-out Express'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {activeModal === 'reserva' && (
                <View>
                  <View style={styles.reservationCard}>
                    <Text style={styles.reservationTitle}>Habitación Deluxe</Text>
                    <View style={styles.reservationDate}>
                      <Text style={styles.dateLabel}>Check-in:</Text>
                      <Text style={styles.dateValue}>12 Jun 2025</Text>
                    </View>
                    <View style={styles.reservationDate}>
                      <Text style={styles.dateLabel}>Check-out:</Text>
                      <Text style={styles.dateValue}>15 Jun 2025</Text>
                    </View>
                    <View style={styles.reservationDetail}>
                      <Text style={styles.detailLabel}>Huéspedes:</Text>
                      <Text style={styles.detailValue}>2 adultos</Text>
                    </View>
                    <View style={styles.reservationDetail}>
                      <Text style={styles.detailLabel}>Habitación:</Text>
                      <Text style={styles.detailValue}>#312</Text>
                    </View>
                  </View>
                  
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity style={styles.optionButton}>
                      <Ionicons name="calendar-outline" size={24} color="#4299e1" />
                      <Text style={styles.optionText}>Extender estadía</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionButton}>
                      <Ionicons name="restaurant-outline" size={24} color="#4299e1" />
                      <Text style={styles.optionText}>Agregar desayuno</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.optionButton}>
                      <Ionicons name="card-outline" size={24} color="#4299e1" />
                      <Text style={styles.optionText}>Ver factura</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {activeModal === 'habitacion' && (
                <View style={styles.roomServiceContainer}>
                  <TouchableOpacity style={styles.roomServiceOption}>
                    <View style={styles.serviceIconContainer}>
                      <Ionicons name="fast-food-outline" size={32} color="#4299e1" />
                    </View>
                    <Text style={styles.serviceOptionTitle}>Ordenar comida</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.roomServiceOption}>
                    <View style={styles.serviceIconContainer}>
                      <Ionicons name="bed-outline" size={32} color="#4299e1" />
                    </View>
                    <Text style={styles.serviceOptionTitle}>Servicio de limpieza</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.roomServiceOption}>
                    <View style={styles.serviceIconContainer}>
                      <Ionicons name="construct-outline" size={32} color="#4299e1" />
                    </View>
                    <Text style={styles.serviceOptionTitle}>Mantenimiento</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.roomServiceOption}>
                    <View style={styles.serviceIconContainer}>
                      <Ionicons name="cart-outline" size={32} color="#4299e1" />
                    </View>
                    <Text style={styles.serviceOptionTitle}>Artículos de tocador</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {activeModal === 'actividades' && (
                <View>
                  <TouchableOpacity style={styles.activityCard}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000' }}
                      style={styles.activityImage}
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Yoga junto a la alberca</Text>
                      <Text style={styles.activityTime}>7:00 AM - 8:00 AM | Diario</Text>
                      <Text style={styles.activityPrice}>Gratis para huéspedes</Text>
                      <TouchableOpacity style={styles.activityButton}>
                        <Text style={styles.activityButtonText}>Reservar</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.activityCard}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000' }}
                      style={styles.activityImage}
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Clase de coctelería</Text>
                      <Text style={styles.activityTime}>6:00 PM - 7:30 PM | Jueves y Sábados</Text>
                      <Text style={styles.activityPrice}>$25 por persona</Text>
                      <TouchableOpacity style={styles.activityButton}>
                        <Text style={styles.activityButtonText}>Reservar</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.activityCard}>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1626108860850-de3f2e24d193?q=80&w=1000' }}
                      style={styles.activityImage}
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Tour histórico por la ciudad</Text>
                      <Text style={styles.activityTime}>9:00 AM - 12:00 PM | Lun, Mié, Vie</Text>
                      <Text style={styles.activityPrice}>$40 por persona</Text>
                      <TouchableOpacity style={styles.activityButton}>
                        <Text style={styles.activityButtonText}>Reservar</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              
              {activeModal === 'checkout' && (
                <View style={styles.checkoutContainer}>
                  <View style={styles.checkoutSummary}>
                    <Text style={styles.checkoutTitle}>Resumen de Estancia</Text>
                    
                    <View style={styles.checkoutDetail}>
                      <Text style={styles.checkoutLabel}>Habitación:</Text>
                      <Text style={styles.checkoutValue}>Deluxe #312</Text>
                    </View>
                    
                    <View style={styles.checkoutDetail}>
                      <Text style={styles.checkoutLabel}>Período:</Text>
                      <Text style={styles.checkoutValue}>12 Jun - 15 Jun 2025</Text>
                    </View>
                    
                    <View style={styles.checkoutDetail}>
                      <Text style={styles.checkoutLabel}>Noches:</Text>
                      <Text style={styles.checkoutValue}>3</Text>
                    </View>
                    
                    <View style={styles.divider}></View>
                    
                    <View style={styles.checkoutDetail}>
                      <Text style={styles.checkoutLabel}>Habitación:</Text>
                      <Text style={styles.checkoutValue}>$450.00</Text>
                    </View>
                    
                    <View style={styles.checkoutDetail}>
                      <Text style={styles.checkoutLabel}>Servicios:</Text>
                      <Text style={styles.checkoutValue}>$75.00</Text>
                    </View>
                    
                    <View style={styles.checkoutDetail}>
                      <Text style={styles.checkoutLabel}>Impuestos:</Text>
                      <Text style={styles.checkoutValue}>$52.50</Text>
                    </View>
                    
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalValue}>$577.50</Text>
                    </View>
                  </View>
                  
                  <View style={styles.checkoutOptions}>
                    <TouchableOpacity style={styles.checkoutButton}>
                      <Text style={styles.checkoutButtonText}>Solicitar factura</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.checkoutButton, styles.checkoutPrimaryButton]}>
                      <Text style={styles.checkoutPrimaryButtonText}>Realizar Check-out</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  messageSection: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  messageSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#4299e1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickMessagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickMessageButton: {
    backgroundColor: '#ebf8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickMessageText: {
    color: '#4299e1',
    fontSize: 13,
    fontWeight: '500',
  },
  serviceCardsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 140,
    justifyContent: 'center',
  },
  serviceCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceCardDescription: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
  promotionsSection: {
    padding: 16,
  },
  promotionScroll: {
    marginBottom: 8,
  },
  promotionCard: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promotionImage: {
    width: '100%',
    height: 120,
  },
  promotionContent: {
    padding: 12,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  promotionDiscount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginTop: 4,
  },
  facilitiesSection: {
    padding: 16,
    marginBottom: 30,
  },
  facilityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  facilityImage: {
    width: '100%',
    height: 180,
  },
  facilityDetails: {
    padding: 16,
  },
  facilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  facilityHours: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  facilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#48bb78',
  },
  facilityButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  facilityButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalContent: {
    padding: 16,
  },
  // Reservación Styles
  reservationCard: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reservationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  reservationDate: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateLabel: {
    width: 100,
    fontSize: 15,
    color: '#4a5568',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    color: '#2d3748',
    fontWeight: 'bold',
  },
  reservationDetail: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 100,
    fontSize: 15,
    color: '#4a5568',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#2d3748',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  // Room Service Styles
  roomServiceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomServiceOption: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ebf8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3748',
    textAlign: 'center',
  },
  // Activity Styles
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityImage: {
    width: '100%',
    height: 150,
  },
  activityContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 6,
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4299e1',
    marginBottom: 16,
  },
  activityButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activityButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Checkout Styles
  checkoutContainer: {
    paddingBottom: 20,
  },
  checkoutSummary: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  checkoutDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkoutLabel: {
    fontSize: 15,
    color: '#4a5568',
  },
  checkoutValue: {
    fontSize: 15,
    color: '#2d3748',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4299e1',
  },
  checkoutOptions: {
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4299e1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutButtonText: {
    color: '#4299e1',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutPrimaryButton: {
    backgroundColor: '#4299e1',
    borderWidth: 0,
  },
  checkoutPrimaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});