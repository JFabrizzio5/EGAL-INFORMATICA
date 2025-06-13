// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../context/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { useDeepLinks } from '../hooks/useDeepLinks';

// Prevenir que la splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync();


// Componente interno que usa el hook (dentro de AuthProvider)
function RootLayoutContent() {
  useDeepLinks(); // Ahora este hook se usa DENTRO del contexto AuthProvider
  return <Stack screenOptions={{ headerShown: false }} />;
}

// Componente principal que proporciona el contexto
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  
  const [loaded] = useFonts({
    // Agrega aquí tus fuentes si las tienes
    // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Aquí puedes agregar cualquier inicialización necesaria
        // Por ejemplo, cargar datos, verificar autenticación, etc.
        
        // Simular tiempo de carga (puedes remover esto)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (loaded && appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, appIsReady]);

  if (!loaded || !appIsReady) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <RootLayoutContent />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
