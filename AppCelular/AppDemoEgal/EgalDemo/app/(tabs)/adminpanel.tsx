// app/(tabs)/adminpanel.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView, View, Text, TextInput, Button, ScrollView, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, TouchableOpacity, Switch
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { WS_URL } from '../../constants/api';

export default function AdminPanelScreen() {
  const { logout, user } = useAuth();
  const [status, setStatus] = useState("Desconectado");
  const [logs, setLogs] = useState([]);
  const [puertaSeleccionada, setPuertaSeleccionada] = useState("puerta1");
  const [accion, setAccion] = useState("abrir");
  const [adminMode, setAdminMode] = useState(true);
  const wsRef = useRef(null);
  const clientId = useRef(`admin-${Math.floor(Math.random() * 10000)}`);
  const scrollRef = useRef(null);
  
  // Si el usuario no está autenticado o no es admin, mostrar mensaje apropiado
  if (!user) {
    return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;
  }

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!user.is_admin && adminMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Acceso Denegado</Text>
          <Text style={styles.errorMessage}>
            Esta sección requiere privilegios de administrador.
          </Text>
          <Button 
            title="Ir a Panel de Usuario" 
            onPress={() => setAdminMode(false)} 
            color="#4299e1"
          />
          <View style={{marginTop: 20}}>
            <Button title="Cerrar Sesión" onPress={logout} color="#dc3545" />
          </View>
        </View>
      </SafeAreaView>
    );
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

    const message = JSON.stringify({
      puerta_id: puertaId,
      accion: accion,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    wsRef.current.send(message);
    addLog(`Enviando comando para ${accion}: ${puertaId}`);
  };

  // Array de todas las puertas
  const todasLasPuertas = [
    { id: "puerta1", nombre: "Puerta 1" },
    { id: "puerta2", nombre: "Puerta 2" },
    { id: "puerta3", nombre: "Puerta 3" }
  ];

  // Filtrar según permisos y modo
  const puertasDisponibles = adminMode ? 
    todasLasPuertas :
    todasLasPuertas.filter(puerta => user.puertas_acceso.includes(puerta.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {adminMode ? "Panel de Administración" : "Control de Puertas"}
        </Text>
        <Text style={styles.subtitle}>Usuario: {user.username}</Text>
      </View>

      {user.is_admin && (
        <View style={styles.modeSelector}>
          <Text style={styles.modeLabel}>Modo Admin:</Text>
          <Switch
            value={adminMode}
            onValueChange={setAdminMode}
            trackColor={{ false: "#767577", true: "#4299e1" }}
            thumbColor={adminMode ? "#fff" : "#f4f3f4"}
          />
        </View>
      )}

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

      {adminMode && (
        <View style={styles.controlPanel}>
          <Text style={styles.sectionTitle}>Panel de Control</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Puerta:</Text>
            <View style={styles.selectContainer}>
              {todasLasPuertas.map(puerta => (
                <TouchableOpacity
                  key={puerta.id}
                  style={[
                    styles.selectOption,
                    puertaSeleccionada === puerta.id && styles.selectOptionActive
                  ]}
                  onPress={() => setPuertaSeleccionada(puerta.id)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    puertaSeleccionada === puerta.id && styles.selectOptionTextActive
                  ]}>
                    {puerta.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Acción:</Text>
            <View style={styles.selectContainer}>
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  accion === "abrir" && styles.selectOptionActive
                ]}
                onPress={() => setAccion("abrir")}
              >
                <Text style={[
                  styles.selectOptionText,
                  accion === "abrir" && styles.selectOptionTextActive
                ]}>Abrir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  accion === "cerrar" && styles.selectOptionActive
                ]}
                onPress={() => setAccion("cerrar")}
              >
                <Text style={[
                  styles.selectOptionText,
                  accion === "cerrar" && styles.selectOptionTextActive
                ]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.executeButton}
            onPress={() => handleOpenDoor(puertaSeleccionada)}
          >
            <Text style={styles.executeButtonText}>Ejecutar Acción</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.doorsContainer}>
        <Text style={styles.sectionTitle}>Acceso Rápido</Text>
        <View style={styles.doorGrid}>
          {puertasDisponibles.map(puerta => (
            <TouchableOpacity
              key={puerta.id}
              style={styles.doorButton}
              onPress={() => handleOpenDoor(puerta.id)}
            >
              <Text style={styles.doorButtonText}>{puerta.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {puertasDisponibles.length === 0 && (
          <Text style={styles.noDoors}>No hay puertas disponibles</Text>
        )}
      </View>

      <View style={styles.logsContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setLogs([])}
          >
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView ref={scrollRef} style={styles.logsList}>
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
};

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
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e2e8f0',
  },
  modeLabel: {
    marginRight: 8,
    fontWeight: 'bold',
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
  controlPanel: {
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
  controlRow: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2d3748',
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e0',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  selectOptionActive: {
    backgroundColor: '#4299e1',
    borderColor: '#2b6cb0',
  },
  selectOptionText: {
    color: '#2d3748',
  },
  selectOptionTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  executeButton: {
    backgroundColor: '#48bb78',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  executeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#4a5568',
    fontWeight: 'bold',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#4a5568',
  },
});