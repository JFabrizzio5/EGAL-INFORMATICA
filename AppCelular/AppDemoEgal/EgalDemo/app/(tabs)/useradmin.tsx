// app/(tabs)/useradmin.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, Button, SafeAreaView, 
  ActivityIndicator, ScrollView, TouchableOpacity, Alert,
  RefreshControl, Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { WS_URL, API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function UserAdminScreen() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState("Desconectado");
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const wsRef = useRef(null);
  const clientId = useRef(`user-${Math.floor(Math.random() * 10000)}`);
  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const lastPingTimeRef = useRef(0);

  // Si el usuario no está autenticado, mostrar indicador de carga
  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4299e1" />
      </View>
    );
  }

  useEffect(() => {
    connectWebSocket();
    
    // Iniciar temporizador de heartbeat para verificar la conexión
    heartbeatTimerRef.current = setInterval(checkConnection, 10000);
    
    return () => {
      cleanupConnection();
    };
  }, []);
  
  const cleanupConnection = () => {
    // Limpiar temporizadores
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    
    // Cerrar websocket si existe
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.error('Error cerrando WebSocket:', e);
      }
      wsRef.current = null;
    }
  };

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const connectWebSocket = () => {
    // Validar que existe user antes de intentar conectar
    if (!user) {
      console.error('No hay usuario autenticado para conectar al WebSocket');
      return;
    }
    
    // Limpiar cualquier conexión existente
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.error('Error al cerrar WebSocket previo:', e);
      }
    }

    setStatus("Conectando...");
    addLog("Intentando conectar al servidor...");
    
    try {
      const socket = new WebSocket(`${WS_URL}/puertas/v1/ws/${clientId.current}`);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus("Conectado");
        addLog("Conexión establecida con el servidor de puertas");
        lastPingTimeRef.current = Date.now();
        
        // Enviar ping inicial
        sendPing();
      };

      socket.onmessage = (event) => {
        const message = event.data;
        addLog(`Recibido: ${message}`);
        
        // Actualizar el tiempo de último ping si recibimos un pong
        if (message.includes('pong')) {
          lastPingTimeRef.current = Date.now();
        }
        
        try {
          // Intentar parsear como JSON por si acaso es un mensaje de estado
          const data = JSON.parse(message);
          if (data.type === 'door_status') {
            // Actualizar estado de puerta en la UI si es necesario
          }
        } catch (e) {
          // No es JSON, ignorar
        }
      };

      socket.onclose = (event) => {
        setStatus("Desconectado");
        addLog(`Conexión cerrada: ${event.reason || 'Sin razón especificada'}`);
        
        // Programar reconexión automática
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            if (status !== "Conectado") {
              addLog("Intentando reconexión automática...");
              connectWebSocket();
            }
          }, 5000);
        }
      };

      socket.onerror = (error) => {
        setStatus("Error");
        addLog("Error en la conexión WebSocket");
      };
    } catch (error) {
      setStatus("Error");
      addLog(`Error creando WebSocket: ${error.message}`);
    }
  };
  
  // Función para enviar ping al servidor
  const sendPing = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  };
  
  // Verificar si la conexión está activa basada en el último ping
  const checkConnection = () => {
    // Si no hay una conexión activa, intentar reconectar
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (status !== "Desconectado") {
        setStatus("Desconectado");
        addLog("Detectada desconexión. WebSocket no está abierto.");
      }
      
      // Intentar reconectar
      if (!reconnectTimerRef.current) {
        connectWebSocket();
      }
      return;
    }
    
    // Verificar cuánto tiempo ha pasado desde el último ping
    const timeSinceLastPing = Date.now() - lastPingTimeRef.current;
    if (timeSinceLastPing > 30000) {  // 30 segundos sin respuesta
      addLog("Conexión inactiva. Reiniciando...");
      setStatus("Desconectado");
      
      // Cerrar y volver a abrir
      try {
        wsRef.current.close();
      } catch (e) {}
      
      wsRef.current = null;
      connectWebSocket();
    } else {
      // Enviar ping periódico
      sendPing();
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setLogs([]);
    
    // Cerrar y volver a conectar
    cleanupConnection();
    connectWebSocket();
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleOpenDoor = (puertaId) => {
    if (!puertaId) {
      console.error('ID de puerta no válido');
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      Alert.alert(
        "Error de Conexión", 
        "No hay conexión con el servidor. ¿Deseas intentar reconectar?",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Reconectar", 
            onPress: connectWebSocket
          }
        ]
      );
      return;
    }

    // Verificar si el usuario tiene acceso a esta puerta
    if (!user?.puertas_acceso?.includes(puertaId) && !user?.is_admin) {
      Alert.alert("Acceso Denegado", `No tienes permiso para abrir la puerta ${puertaId}`);
      return;
    }

    const message = JSON.stringify({
      puerta_id: puertaId,
      accion: "abrir",
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

    try {
      wsRef.current.send(message);
      addLog(`Enviando comando para abrir: ${puertaId}`);
    } catch (e) {
      addLog(`Error enviando comando: ${e.message}`);
      setStatus("Error");
      Alert.alert("Error", "No se pudo enviar el comando. Intenta reconectar.");
    }
  };

  // Filtrar solo las puertas a las que el usuario tiene acceso
  const puertasAccesibles = [
    { id: "puerta1", nombre: "Puerta 1", icono: "home-outline" },
    { id: "puerta2", nombre: "Puerta 2", icono: "business-outline" },
    { id: "puerta3", nombre: "Puerta 3", icono: "server-outline" }
  ].filter(puerta => user.puertas_acceso.includes(puerta.id) || user.is_admin);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4299e1"]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.welcomeText}>Bienvenido,</Text>
              <Text style={styles.usernameText}>{user.username}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado del servidor:</Text>
            <View style={[
              styles.statusBadge, 
              status === "Conectado" ? styles.connectedBadge : 
              status === "Conectando..." ? styles.connectingBadge : styles.disconnectedBadge
            ]}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
          
          {status !== "Conectado" && (
            <TouchableOpacity 
              style={styles.reconnectButton}
              onPress={connectWebSocket}
            >
              <Ionicons name="refresh" size={16} color="white" />
              <Text style={styles.reconnectText}>Reconectar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.doorsContainer}>
          <Text style={styles.sectionTitle}>Control de Accesos</Text>
          
          {puertasAccesibles.length > 0 ? (
            <View style={styles.doorGrid}>
              {puertasAccesibles.map(puerta => (
                <TouchableOpacity
                  key={puerta.id}
                  style={styles.doorCard}
                  onPress={() => handleOpenDoor(puerta.id)}
                  disabled={status !== "Conectado"}
                >
                  <View style={[
                    styles.doorIconContainer,
                    status !== "Conectado" && styles.doorDisabled
                  ]}>
                    <Ionicons name={puerta.icono} size={28} color="#4299e1" />
                  </View>
                  <Text style={styles.doorName}>{puerta.nombre}</Text>
                  <Text style={styles.doorAction}>
                    {status === "Conectado" ? "Abrir" : "No disponible"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noDoors}>
              <Ionicons name="lock-closed" size={48} color="#a0aec0" />
              <Text style={styles.noDoorsText}>No tienes acceso a ninguna puerta</Text>
            </View>
          )}
        </View>

        {showLogs ? (
          <View style={styles.logsContainer}>
            <View style={styles.logsTitleRow}>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              <View style={styles.logsActions}>
                <TouchableOpacity onPress={() => setLogs([])} style={styles.logAction}>
                  <Text style={styles.clearLogsText}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowLogs(false)} style={styles.logAction}>
                  <Text style={styles.clearLogsText}>Ocultar</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.logsList}>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <Text key={index} style={styles.logItem}>{log}</Text>
                ))
              ) : (
                <Text style={styles.noLogs}>No hay actividad registrada</Text>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.showLogsButton}
            onPress={() => setShowLogs(true)}
          >
            <Ionicons name="eye-outline" size={20} color="white" />
            <Text style={styles.showLogsText}>Mostrar Actividad</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/chatbot')}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            <Text style={styles.actionButtonText}>Asistente Virtual</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={logout}
          >
            <Ionicons name="log-out" size={24} color="white" />
            <Text style={styles.actionButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4a5568',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  usernameText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusCard: {
    margin: 16,
    marginTop: -20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  connectedBadge: {
    backgroundColor: '#d4edda',
  },
  connectingBadge: {
    backgroundColor: '#fff3cd',
  },
  disconnectedBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  reconnectButton: {
    marginTop: 12,
    backgroundColor: '#4299e1',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  doorsContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  doorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  doorCard: {
    width: '48%',
    backgroundColor: '#f7fafc',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  doorDisabled: {
    backgroundColor: 'rgba(160, 174, 192, 0.1)',
  },
  doorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  doorAction: {
    fontSize: 14,
    color: '#4299e1',
  },
  noDoors: {
    alignItems: 'center',
    padding: 20,
  },
  noDoorsText: {
    marginTop: 12,
    color: '#718096',
    textAlign: 'center',
  },
  logsContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearLogsText: {
    color: '#4299e1',
    fontWeight: '500',
  },
  logsList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    maxHeight: 200,
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
  actionsContainer: {
    margin: 16,
    marginTop: 0,
  },
  actionButton: {
    backgroundColor: '#4299e1',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: '#e53e3e',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  logAction: {
    marginLeft: 12,
  },
  logsActions: {
    flexDirection: 'row',
  },
  showLogsButton: {
    backgroundColor: '#4299e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 16,
  },
  showLogsText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});