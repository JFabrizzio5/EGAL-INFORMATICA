// app/(tabs)/useradmin.tsx
import { View, Text, StyleSheet, Button, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Ajusta la ruta si es necesario

export default function UserAdminScreen() {
  const { logout, user } = useAuth();

  // Si el usuario cierra sesión, 'user' será null.
  // Devolvemos un indicador de carga o null para evitar que el resto del componente falle.
  if (!user) {
    return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bienvenido, {user.username}!</Text>
      <Text>Este es tu panel de usuario.</Text>
      <View style={{ marginTop: 20 }}>
        <Button title="Cerrar Sesión" onPress={logout} color="red" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});