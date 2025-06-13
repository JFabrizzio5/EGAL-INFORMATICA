import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { Alert } from 'react-native';

// Definir tipo para el usuario
type User = {
  id: string;
  username: string;
  is_admin: boolean;
  puertas_acceso: string[];
  token: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si ya hay una sesión guardada al iniciar
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          
          try {
            // Verificar si el token es válido con el backend
            const response = await axios.get(`${API_URL}/auth/v1/me`, {
              headers: { Authorization: `Bearer ${userData.token}` }
            });
            
            // Actualizar datos del usuario con respuesta del servidor
            setUser({
              ...userData,
              ...response.data,
              token: userData.token
            });
          } catch (error) {
            // Si hay error con el token, cerrar sesión
            console.log('Token inválido o expirado, cerrando sesión');
            await AsyncStorage.removeItem('user');
            setUser(null);
            
            // Si la app tiene un mecanismo de navegación global, redirigir a login
            if (router && router.replace) {
              router.replace('/');
            }
            
            // Mostrar alerta al usuario
            Alert.alert(
              "Sesión expirada",
              "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Función de inicio de sesión
  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const response = await axios.post(`${API_URL}/auth/v1/login`, {
        username,
        password
      });

      const userData: User = {
        id: response.data.user_id,
        username: response.data.username,
        is_admin: response.data.is_admin,
        puertas_acceso: response.data.puertas_acceso,
        token: response.data.access_token
      };

      // Guardar en estado y en AsyncStorage
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      return null;
    }
  };

  // Función de cierre de sesión
  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};