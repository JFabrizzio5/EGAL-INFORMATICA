import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  ActivityIndicator, Alert, Switch, TextInput, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';

export default function UsersManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
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
          onPress={() => router.replace('/useradmin')}
        >
          <Text style={styles.buttonText}>Volver al Panel de Usuario</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/v1/usuarios`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const toggleDoorPermission = async (userId, doorId, hasPermission) => {
    try {
      if (hasPermission) {
        // Eliminar permiso
        await axios.delete(`${API_URL}/auth/v1/usuarios/${userId}/permisos/puerta/${doorId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      } else {
        // Añadir permiso
        await axios.post(`${API_URL}/auth/v1/usuarios/${userId}/permisos/puerta`, 
          { puerta_id: doorId },
          { headers: { Authorization: `Bearer ${user.token}` }}
        );
      }
      
      // Actualizar la lista de usuarios
      fetchUsers();
    } catch (error) {
      console.error('Error modificando permisos:', error);
      Alert.alert('Error', 'No se pudo modificar el permiso');
    }
  };

  const generateNFCToken = (userId) => {
    router.push(`/nfc-generator?userId=${userId}`);
  };

  const renderUserItem = ({ item }) => {
    // No mostrar al usuario actual en la lista
    if (item.id === user.id) return null;
    
    // Filtrar por búsqueda
    if (searchQuery && !item.username.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }
    
    const doorsList = [
      { id: "puerta1", name: "Puerta 1" },
      { id: "puerta2", name: "Puerta 2" },
      { id: "puerta3", name: "Puerta 3" }
    ];

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View>
            <Text style={styles.userName}>{item.username}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.nfcButton}
            onPress={() => generateNFCToken(item.id)}
          >
            <Ionicons name="wifi-outline" size={18} color="white" />
            <Text style={styles.nfcButtonText}>NFC</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.userRole}>
          <Text style={[
            styles.roleText, 
            item.is_admin ? styles.adminRole : styles.userRole
          ]}>
            {item.is_admin ? 'Administrador' : 'Usuario'}
          </Text>
        </View>
        
        <View style={styles.permissionsSection}>
          <Text style={styles.permissionsTitle}>Permisos de Puertas:</Text>
          
          {doorsList.map(door => {
            const hasPermission = item.puertas_acceso?.includes(door.id) || item.is_admin;
            
            return (
              <View key={door.id} style={styles.permissionItem}>
                <Text style={styles.doorName}>{door.name}</Text>
                <Switch
                  value={hasPermission}
                  onValueChange={(value) => toggleDoorPermission(item.id, door.id, hasPermission)}
                  disabled={item.is_admin} // No se pueden cambiar permisos de admin
                  trackColor={{ false: "#cbd5e0", true: "#4299e1" }}
                  thumbColor={hasPermission ? "#fff" : "#f4f3f4"}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#a0aec0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
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
          data={users}
          renderItem={renderUserItem}
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
              <Ionicons name="people" size={64} color="#a0aec0" />
              <Text style={styles.emptyText}>No hay usuarios para mostrar</Text>
            </View>
          }
        />
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  userEmail: {
    fontSize: 14,
    color: '#718096',
  },
  userRole: {
    marginBottom: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  adminRole: {
    backgroundColor: '#fefcbf',
    color: '#744210',
  },
  userRoleStyle: {
    backgroundColor: '#e6fffa',
    color: '#234e52',
  },
  permissionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f7fafc',
  },
  doorName: {
    fontSize: 16,
    color: '#4a5568',
  },
  nfcButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nfcButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
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