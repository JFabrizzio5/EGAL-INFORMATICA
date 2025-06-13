import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, Alert, ScrollView, Switch
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';

// Define el tipo para un usuario
type User = {
  _id: string;
  username: string;
  email: string;
  is_admin: boolean;
  puertas_acceso: string[];
};

// Define el tipo para una puerta
type Door = {
  id: string;
  nombre: string;
};

export default function UserManagementScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Lista de todas las puertas disponibles
  const allDoors: Door[] = [
    { id: "puerta1", nombre: "Puerta 1" },
    { id: "puerta2", nombre: "Puerta 2" },
    { id: "puerta3", nombre: "Puerta 3" }
  ];

  // Verificar si el usuario es administrador
  useEffect(() => {
    if (!user) {
      router.replace('/');
      return;
    }

    if (!user.is_admin) {
      Alert.alert(
        "Acceso Denegado",
        "Solo los administradores pueden acceder a esta sección",
        [{ text: "OK", onPress: () => router.replace('/(tabs)/useradmin') }]
      );
    } else {
      fetchUsers();
    }
  }, [user]);

  // Obtener todos los usuarios
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/v1/usuarios`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los usuarios. Verifica tu conexión."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Manejar el refresco al tirar hacia abajo
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Cambiar permiso de puerta
  const toggleDoorPermission = async (userId: string, doorId: string, hasAccess: boolean) => {
    try {
      if (hasAccess) {
        // Eliminar permiso
        await axios.delete(`${API_URL}/auth/v1/usuarios/${userId}/permisos/puerta/${doorId}`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      } else {
        // Añadir permiso
        await axios.post(`${API_URL}/auth/v1/usuarios/${userId}/permisos/puerta?puerta_id=${doorId}`, {}, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
      }
      
      // Actualizar lista de usuarios
      fetchUsers();
      
      // Si es el usuario seleccionado, actualizar sus datos
      if (selectedUser && selectedUser._id === userId) {
        const updatedPuertas = hasAccess 
          ? selectedUser.puertas_acceso.filter(p => p !== doorId)
          : [...selectedUser.puertas_acceso, doorId];
          
        setSelectedUser({
          ...selectedUser,
          puertas_acceso: updatedPuertas
        });
      }
      
    } catch (error) {
      console.error('Error modificando permisos:', error);
      Alert.alert("Error", "No se pudo modificar el permiso. Intenta nuevamente.");
    }
  };

  // Renderizar cada item de usuario
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={[
        styles.userCard,
        selectedUser?._id === item._id && styles.userCardSelected
      ]} 
      onPress={() => setSelectedUser(item)}
    >
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        {item.is_admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminText}>Admin</Text>
          </View>
        )}
      </View>
      
      <View style={styles.userStats}>
        <Text style={styles.statText}>
          Puertas: {item.puertas_acceso.length}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Si está cargando, mostrar indicador
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
      </View>
      
      <View style={styles.content}>
        {/* Lista de usuarios */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>Usuarios</Text>
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay usuarios registrados</Text>
            }
          />
        </View>
        
        {/* Detalles del usuario seleccionado */}
        <View style={styles.detailsSection}>
          {selectedUser ? (
            <>
              <View style={styles.detailsHeader}>
                <Text style={styles.detailsTitle}>Detalles del Usuario</Text>
                <Text style={styles.detailsSubtitle}>{selectedUser.username}</Text>
              </View>
              
              <View style={styles.detailsContent}>
                <Text style={styles.detailsLabel}>Permisos de puertas:</Text>
                
                <ScrollView style={styles.doorsList}>
                  {allDoors.map(door => {
                    const hasAccess = selectedUser.puertas_acceso.includes(door.id);
                    return (
                      <View key={door.id} style={styles.doorItem}>
                        <Text style={styles.doorName}>{door.nombre}</Text>
                        <Switch
                          value={hasAccess}
                          onValueChange={(value) => 
                            toggleDoorPermission(selectedUser._id, door.id, hasAccess)
                          }
                          trackColor={{ false: "#767577", true: "#4299e1" }}
                          thumbColor={hasAccess ? "#fff" : "#f4f3f4"}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
                
                <View style={styles.generatorContainer}>
                  <Text style={styles.detailsLabel}>Generar token NFC:</Text>
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={() => router.push(`/nfc-generator?userId=${selectedUser._id}`)}
                  >
                    <Text style={styles.generateButtonText}>Generar Token NFC</Text>
                    <Ionicons name="qr-code-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.noSelection}>
              <Ionicons name="person-circle-outline" size={80} color="#a0aec0" />
              <Text style={styles.noSelectionText}>
                Selecciona un usuario para ver y modificar sus permisos
              </Text>
            </View>
          )}
        </View>
      </View>
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
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  usersSection: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  detailsSection: {
    flex: 2,
    padding: 16,
    backgroundColor: 'white',
    margin: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  userCard: {
    backgroundColor: '#f7fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userCardSelected: {
    borderColor: '#4299e1',
    borderWidth: 2,
    backgroundColor: '#ebf8ff',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
  },
  adminBadge: {
    backgroundColor: '#fed7d7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminText: {
    color: '#c53030',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userStats: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statText: {
    fontSize: 14,
    color: '#4a5568',
  },
  detailsHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  detailsSubtitle: {
    fontSize: 16,
    color: '#4a5568',
    marginTop: 4,
  },
  detailsContent: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  doorsList: {
    flex: 1,
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    padding: 8,
  },
  doorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  doorName: {
    fontSize: 16,
    color: '#4a5568',
  },
  noSelection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSelectionText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: '80%',
  },
  emptyText: {
    textAlign: 'center',
    color: '#718096',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#718096',
  },
  generatorContainer: {
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  generateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});