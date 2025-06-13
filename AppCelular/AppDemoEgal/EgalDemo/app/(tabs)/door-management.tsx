import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Alert, ActivityIndicator, Switch, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';

export default function DoorManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [doors, setDoors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Si el usuario no está autenticado o no es admin, mostrar mensaje
  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4299e1" />
      </View>
    );
  }

  if (!user.is_admin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={64} color="#e53e3e" />
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          Solo administradores pueden acceder a esta sección.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/useradmin')}
        >
          <Text style={styles.buttonText}>Volver al Panel de Usuario</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    fetchDoors();
  }, []);

  const fetchDoors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/v1/puertas`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDoors(response.data);
    } catch (error) {
      console.error('Error obteniendo puertas:', error);
      Alert.alert('Error', 'No se pudieron cargar las puertas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDoors();
  };

  const toggleDoorStatus = async (doorId, isActive) => {
    try {
      await axios.put(`${API_URL}/auth/v1/puertas/${doorId}`, 
        { active: !isActive },
        { headers: { Authorization: `Bearer ${user.token}` }}
      );
      
      // Actualizar la lista de puertas
      fetchDoors();
    } catch (error) {
      console.error('Error modificando estado de puerta:', error);
      Alert.alert('Error', 'No se pudo modificar el estado de la puerta');
    }
  };

  const renderDoorItem = ({ item }) => {
    return (
      <View style={styles.doorCard}>
        <View style={styles.doorHeader}>
          <View style={styles.doorInfo}>
            <Text style={styles.doorName}>{item.name}</Text>
            <Text style={styles.doorLocation}>{item.location || 'Sin ubicación'}</Text>
          </View>
          
          <Switch
            value={item.active}
            onValueChange={() => toggleDoorStatus(item.id, item.active)}
            trackColor={{ false: "#cbd5e0", true: "#4299e1" }}
            thumbColor={item.active ? "#fff" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.doorDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={18} color="#4a5568" />
            <Text style={styles.detailText}>
              {item.access_count || 0} usuarios con acceso
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={18} color="#4a5568" />
            <Text style={styles.detailText}>
              Última actividad: {item.last_activity || 'Nunca'}
            </Text>
          </View>
        </View>
        
        <View style={styles.doorActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/puerta/${item.id}?action=open`)}
          >
            <Ionicons name="unlock-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>Abrir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.configButton]}
            onPress={() => router.push(`/door-config/${item.id}`)}
          >
            <Ionicons name="settings-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>Configurar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Puertas</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#a0aec0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar puertas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4299e1" />
        </View>
      ) : (
        <FlatList
          data={doors.filter(door => 
            door.name.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          renderItem={renderDoorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4299e1"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Ionicons name="door-outline" size={64} color="#a0aec0" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron puertas con ese nombre' : 'No hay puertas configuradas'}
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/door-config/new')}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Agregar Nueva Puerta</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {!loading && doors.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => router.push('/door-config/new')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4a5568',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
  },
  listContainer: {
    padding: 10,
  },
  doorCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doorInfo: {
    flex: 1,
    flexShrink: 1, // Permitir que se encoja si es necesario
  },
  doorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    flexWrap: 'wrap', // Permitir que el texto se envuelva
  },
  doorLocation: {
    fontSize: 14,
    color: '#718096',
  },
  doorDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 2,
    flexWrap: 'wrap', // Permitir que el texto se envuelva
  },
  doorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  configButton: {
    backgroundColor: '#718096',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  addButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4299e1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4299e1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});