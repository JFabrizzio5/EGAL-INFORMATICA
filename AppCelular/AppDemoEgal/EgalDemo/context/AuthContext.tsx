import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

// 1. Definimos la estructura del Contexto
const AuthContext = createContext(null);

// 2. Hook para usar el contexto fácilmente en otros componentes
export function useAuth() {
  return useContext(AuthContext);
}

// 3. El Proveedor del Contexto que envolverá nuestra app
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const segments = useSegments(); // Nos dice en qué parte de la app estamos

  useEffect(() => {
    // Función para verificar el token al cargar la app
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('user-token');
      if (token) {
        setUser(JSON.parse(token));
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';

    // Si el usuario no está logueado Y se encuentra en una ruta protegida
    if (!user && inAuthGroup) {
      // Lo redirigimos a la pantalla de login.
      router.replace('/');
    } 
    // Si el usuario SÍ está logueado Y NO se encuentra en una ruta protegida
    else if (user && !inAuthGroup) {
      // Lo redirigimos a su panel correspondiente.
      router.replace(user.isAdmin ? '/adminpanel' : '/useradmin');
    }
  }, [user, segments]);

  const login = async (username, password) => {
    // Lógica de login simulada
    if ((username === 'admin' && password === 'admin') || (username === 'user' && password === 'user')) {
      const userData = { username, isAdmin: username === 'admin' };
      setUser(userData);
      // Guardamos la sesión en AsyncStorage
      await AsyncStorage.setItem('user-token', JSON.stringify(userData));
      return userData;
    }
    return null;
  };

  const logout = async () => {
    setUser(null);
    // Borramos la sesión de AsyncStorage
    await AsyncStorage.removeItem('user-token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}