import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants/api';

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
  storeTokenInWebView: (token: string) => Promise<boolean>;
};

// Definir el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto
export function useAuth() {
  return useContext(AuthContext);
}

// Proveedor del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

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

  // Redirección basada en estado de autenticación
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/');
    } else if (user && inAuthGroup) {
      router.replace(user.is_admin ? '/(tabs)/adminpanel' : '/(tabs)/useradmin');
    }
  }, [user, isLoading, segments]);

  // Añadir esta función dentro del provider para compartir con navegador web
  const storeTokenInWebView = async (token: string) => {
    try {
      // Solo funciona en web
      if (Platform.OS === 'web') {
        localStorage.setItem('egal_auth_token', token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error guardando token en WebView:', error);
      return false;
    }
  };

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
      
      // Intentar guardar en WebView también si estamos en web
      await storeTokenInWebView(userData.token);
      
      return userData;
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      return null;
    }
  };

  // Función de cierre de sesión
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      // Asegurarnos de que el estado se actualice antes de redirigir
      setUser(null);
      // Redirigir inmediatamente a la pantalla de inicio
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Intentar redirigir incluso si hay error
      router.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
   
    }}>
      {children}
    </AuthContext.Provider>
  );
}