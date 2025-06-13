import { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants/api';

export function useDeepLinks() {
  const router = useRouter();
  const { user } = useAuth();
  
  useEffect(() => {
    // Procesar enlace inicial que abrió la app
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        processDeepLink(url);
      }
    };

    // Configurar oyente para futuros enlaces
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processDeepLink(url);
    });

    getInitialURL();

    return () => {
      subscription.remove();
    };
  }, [user]);

  const processDeepLink = async (url) => {
    console.log('Procesando deeplink:', url);
    
    try {
      // Analizar URL
      if (url.includes('/puertas/v1/abrir/')) {
        // URL de apertura de puerta
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const puertaId = pathParts[pathParts.length - 1];
        const token = urlObj.searchParams.get('token');
        
        if (!puertaId || !token) {
          Alert.alert('Error', 'URL de acceso incompleta');
          return;
        }
        
        // Si hay usuario autenticado, intentar abrir con ese usuario
        if (user) {
          try {
            const response = await axios.get(`${API_URL}/puertas/v1/abrir/${puertaId}?token=${token}`);
            Alert.alert('Éxito', `Puerta ${puertaId} abierta correctamente`);
            router.replace(user.is_admin ? '/(tabs)/adminpanel' : '/(tabs)/useradmin');
          } catch (error) {
            if (error.response && error.response.status === 403) {
              Alert.alert('Acceso denegado', 'No tienes permiso para abrir esta puerta');
            } else {
              Alert.alert('Error', 'No se pudo abrir la puerta');
            }
          }
        } else {
          // Si no hay usuario, mostrar pantalla de login con mensaje
          Alert.alert(
            'Acceso a puerta', 
            'Para abrir la puerta, primero debes iniciar sesión',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        }
      } else if (url.startsWith('egaldemo://puerta/')) {
        // Procesar deeplink de la app
        const parts = url.split('egaldemo://puerta/');
        if (parts.length > 1) {
          const pathAndParams = parts[1].split('?');
          const puertaId = pathAndParams[0];
          
          // Extraer token
          let token = '';
          if (pathAndParams.length > 1) {
            const params = new URLSearchParams(pathAndParams[1]);
            token = params.get('token') || '';
          }
          
          if (!puertaId || !token) {
            Alert.alert('Error', 'URL de acceso incompleta');
            return;
          }
          
          // Si hay usuario autenticado, intentar abrir con ese usuario
          if (user) {
            try {
              const response = await axios.get(`${API_URL}/puertas/v1/abrir/${puertaId}?token=${token}`);
              Alert.alert('Éxito', `Puerta ${puertaId} abierta correctamente`);
              router.replace(user.is_admin ? '/(tabs)/adminpanel' : '/(tabs)/useradmin');
            } catch (error) {
              if (error.response && error.response.status === 403) {
                Alert.alert('Acceso denegado', 'No tienes permiso para abrir esta puerta');
              } else {
                Alert.alert('Error', 'No se pudo abrir la puerta');
              }
            }
          } else {
            // Si no hay usuario, mostrar pantalla de login con mensaje
            Alert.alert(
              'Acceso a puerta', 
              'Para abrir la puerta, primero debes iniciar sesión',
              [{ text: 'OK', onPress: () => router.replace('/') }]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error procesando deeplink:', error);
      Alert.alert('Error', 'No se pudo procesar el enlace');
    }
  };

  return null;
}