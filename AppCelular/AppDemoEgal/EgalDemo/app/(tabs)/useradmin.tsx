// app/(tabs)/useradmin.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Button, SafeAreaView, 
  ActivityIndicator, ScrollView, TouchableOpacity, Alert 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { WS_URL } from '../../constants/api';

export default function UserAdminScreen() {
  const { logout, user } = useAuth();
  const [status, setStatus] = useState("Desconectado");
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);
  const clientId = useRef(`user-${Math.floor(Math.random() * 10000)}`);

  // Si el usuario no está autenticado, mostrar indicador de carga
  if (!user) {
    return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;
  }

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus("Conectando...");
    const socket = new WebSocket(`${WS_URL}/puertas/v1/ws/${clientId.current}`);
    wsRef.current = socket;

    socket.onopen = () => {
      setStatus("Conectado");
      addLog("Conexión establecida con el servidor de puertas");
    };

    socket.onmessage = (event) => {
      addLog(`Servidor: ${event.data}`);
    };

    socket.onclose = () => {
      setStatus("Desconectado");
      addLog("Conexión cerrada");
    };

    socket.onerror = (error) => {
      setStatus("Error");
      addLog("Error en la conexión WebSocket");
    };
  };

  const handleOpenDoor = (puertaId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      Alert.alert("Error", "No hay conexión con el servidor");
      connectWebSocket();
      return;
    }

    // Verificar si el usuario tiene acceso a esta puerta
    if (!user.puertas_acceso.includes(puertaId)) {
      Alert.alert("Acceso Denegado", `No tienes permiso para abrir la puerta ${puertaId}`);
      return;
    }

    const message = JSON.stringify({
      puerta_id: puertaId,
      accion: "abrir",
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    wsRef.current.send(message);
    addLog(`Enviando comando para abrir: ${puertaId}`);
  };

  // Filtrar solo las puertas a las que el usuario tiene acceso
  const puertasAccesibles = [
    { id: "puerta1", nombre: "Puerta 1" },
    { id: "puerta2", nombre: "Puerta 2" },
    { id: "puerta3", nombre: "Puerta 3" }
  ].filter(puerta => user.puertas_acceso.includes(puerta.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Control de Puertas</Text>
        <Text style={styles.subtitle}>Usuario: {user.username}</Text>
      </View>

      <View style={styles.statusBar}>
        <Text style={[styles.statusText, styles[status === "Conectado" ? "connected" : "disconnected"]]}>
          Estado: {status}
        </Text>
        {status !== "Conectado" && (
          <TouchableOpacity onPress={connectWebSocket} style={styles.reconnectButton}>
            <Text style={styles.reconnectText}>Reconectar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.doorsContainer}>
        <Text style={styles.sectionTitle}>Mis Puertas</Text>
        <View style={styles.doorGrid}>
          {puertasAccesibles.map(puerta => (
            <TouchableOpacity
              key={puerta.id}
              style={styles.doorButton}
              onPress={() => handleOpenDoor(puerta.id)}
            >
              <Text style={styles.doorButtonText}>{puerta.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {puertasAccesibles.length === 0 && (
          <Text style={styles.noDoors}>No tienes acceso a ninguna puerta</Text>
        )}
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <ScrollView style={styles.logsList}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logItem}>{log}</Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.noLogs}>No hay actividad registrada</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Button title="Cerrar Sesión" onPress={logout} color="#dc3545" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#4a5568',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginTop: 4,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statusText: {
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  connected: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  disconnected: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  reconnectButton: {
    backgroundColor: '#4299e1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  reconnectText: {
    color: 'white',
    fontWeight: 'bold',
  },
  doorsContainer: {
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
    marginBottom: 12,
    color: '#2d3748',
  },
  doorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  doorButton: {
    backgroundColor: '#4299e1',
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  doorButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noDoors: {
    textAlign: 'center',
    color: '#718096',
    padding: 16,
  },
  logsContainer: {
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
  logsList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 8,
  },
  logItem: {
    fontSize: 12,
    color: '#4a5568',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  noLogs: {
    textAlign: 'center',
    color: '#718096',
    padding: 16,
  },
  footer: {
    padding: 16,
  },
});