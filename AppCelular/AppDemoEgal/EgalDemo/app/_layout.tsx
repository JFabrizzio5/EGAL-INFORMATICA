// app/_layout.tsx
import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    // Envolvemos toda la app con nuestro proveedor de autenticación
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
