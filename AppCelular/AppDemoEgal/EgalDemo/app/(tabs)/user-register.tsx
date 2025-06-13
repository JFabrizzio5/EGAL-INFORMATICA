import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Switch, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function UserRegisterScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Datos del formulario
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Lista de puertas disponibles
  const allDoors = [
    { id: "puerta1", nombre: "Puerta 1" },
    { id: "puerta2", nombre: "Puerta 2" },
    { id: "puerta3", nombre: "Puerta 3" }
  ];
  
  // Puertas seleccionadas para el nuevo usuario
  const [selectedDoors, setSelectedDoors] = useState<string[]>([]);

  // Validar que el usuario es administrador
  if (!user?.is_admin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed" size={64} color="#e53e3e" />
        <Text style={styles.accessDeniedTitle}>Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          Solo los administradores pueden registrar nuevos usuarios.
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

  const toggleDoorSelection = (doorId: string) => {
    if (selectedDoors.includes(doorId)) {
      setSelectedDoors(selectedDoors.filter(id => id !== doorId));
    } else {
      setSelectedDoors([...selectedDoors, doorId]);
    }
  };

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    
    // Validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'El email no es válido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Estructura del usuario a crear
      const userData = {
        username,
        email,
        password,
        is_admin: isAdmin,
        is_active: isActive,
        puertas_acceso: selectedDoors
      };
      
      // Petición para crear usuario
      await axios.post(`${API_URL}/auth/v1/usuarios`, userData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      Alert.alert(
        'Éxito',
        'Usuario creado correctamente',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/users-management') }]
      );
    } catch (error) {
      console.error('Error al crear usuario:', error);
      Alert.alert(
        'Error',
        'No se pudo crear el usuario. Verifica los datos e intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registrar Nuevo Usuario</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Información del Usuario</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de usuario</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingrese nombre de usuario"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Ingrese correo electrónico"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingrese contraseña"
                secureTextEntry
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirmar contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita la contraseña"
                secureTextEntry
              />
            </View>
          </View>
          
          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Es administrador</Text>
              <Switch
                value={isAdmin}
                onValueChange={setIsAdmin}
                trackColor={{ false: "#cbd5e0", true: "#4299e1" }}
                thumbColor={isAdmin ? "#fff" : "#f4f3f4"}
              />
            </View>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Usuario activo</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: "#cbd5e0", true: "#4299e1" }}
                thumbColor={isActive ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Permisos de Acceso</Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona las puertas a las que tendrá acceso el usuario
          </Text>
          
          {allDoors.map(door => (
            <View key={door.id} style={styles.doorItem}>
              <Text style={styles.doorName}>{door.nombre}</Text>
              <Switch
                value={selectedDoors.includes(door.id)}
                onValueChange={() => toggleDoorSelection(door.id)}
                trackColor={{ false: "#cbd5e0", true: "#4299e1" }}
                thumbColor={selectedDoors.includes(door.id) ? "#fff" : "#f4f3f4"}
              />
            </View>
          ))}
          
          <Text style={styles.doorInfoText}>
            {isAdmin ? 'Como administrador, tendrá acceso a todas las puertas' : 
            selectedDoors.length === 0 ? 'No se ha seleccionado ninguna puerta' : 
            `${selectedDoors.length} puerta(s) seleccionada(s)`}
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#4299e1" />
          ) : (
            <>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.submitButtonText}>Registrar Usuario</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
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
    padding: 20,
  },
  header: {
    backgroundColor: '#4a5568',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2d3748',
  },
  switchGroup: {
    marginTop: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#4a5568',
  },
  doorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  doorName: {
    fontSize: 16,
    color: '#4a5568',
  },
  doorInfoText: {
    marginTop: 12,
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#718096',
    fontSize: 16,
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
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
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