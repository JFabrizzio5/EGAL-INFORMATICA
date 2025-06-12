// app/(tabs)/adminpanel.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView, View, Text, TextInput, Button, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminPanelScreen() {
  const { logout, user } = useAuth();
  const [status, setStatus] = useState("Desconectado");
  const [statusClass, setStatusClass] = useState("disconnected");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const clientId = useRef(`emitter-${Math.floor(Math.random() * 10000)}`);
  const scrollRef = useRef(null);
  
  // Si el usuario cierra sesión, 'user' será null.
  // Devolvemos un indicador de carga o null para evitar que el resto del componente falle.
  if (!user) {
    return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;
  }

  useEffect(() => {
    connectWebSocket();
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
      }
    }, 30000); // Ping cada 30s
    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const updateStatus = (msg, style) => {
    setStatus(msg);
    setStatusClass(style);
  };

  const connectWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    updateStatus(`Conectando como ${clientId.current}...`, "connecting");
    const socket = new WebSocket(`ws://172.22.82.26:8000/ws/${clientId.current}`);
    wsRef.current = socket;
    socket.onopen = () => {
      updateStatus(`Conectado como ${clientId.current}`, "connected");
      addMessage("✅ Conexión WebSocket establecida");
      reconnectAttemptsRef.current = 0;
    };
    socket.onmessage = (event) => addMessage(`📨 Servidor: ${event.data}`);
    socket.onclose = (event) => {
      updateStatus("Desconectado", "disconnected");
      addMessage(`❌ Conexión cerrada (Código: ${event.code})`);
      if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        addMessage(`🔄 Reintentando conexión (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
        setTimeout(connectWebSocket, 2000);
      }
    };
    socket.onerror = (err) => {
      addMessage("❌ Error en la conexión WebSocket");
      updateStatus("Error de conexión", "disconnected");
    };
  };

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert("Error", "Por favor escribe un mensaje");
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
      addMessage(`📤 Enviado: ${message}`);
      setMessage("");
    } else {
      Alert.alert("Error", "WebSocket no está conectado. Intentando reconectar...");
      connectWebSocket();
    }
  };

  const reconnect = () => {
    wsRef.current?.close(1000, "Reconexión manual");
    reconnectAttemptsRef.current = 0;
    setTimeout(connectWebSocket, 500);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Admin ({user.username})</Text>
        <Button title="Cerrar Sesión" onPress={logout} color="red" />
      </View>
      <Text style={[styles.status, styles[statusClass]]}>{status}</Text>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <Text style={styles.subtitle}>Mensajes:</Text>
        <ScrollView ref={scrollRef} style={styles.messages}>
          {messages.map((msg, i) => (
            <Text key={i} style={styles.messageText}>{msg}</Text>
          ))}
        </ScrollView>
        <View style={styles.inputGroup}>
          <TextInput value={message} onChangeText={setMessage} placeholder="Escribe tu evento aquí" style={styles.input} onSubmitEditing={handleSend} />
          <View style={styles.buttonRow}>
            <Button title="Enviar Evento" onPress={handleSend} />
            <Button title="Reconectar" onPress={reconnect} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  status: { padding: 10, marginVertical: 10, borderRadius: 5, fontWeight: "bold", textAlign: "center" },
  connected: { backgroundColor: "#d4edda", color: "#155724", borderColor: "#c3e6cb", borderWidth: 1 },
  disconnected: { backgroundColor: "#f8d7da", color: "#721c24", borderColor: "#f5c6cb", borderWidth: 1 },
  connecting: { backgroundColor: "#fff3cd", color: "#856404", borderColor: "#ffeaa7", borderWidth: 1 },
  inputGroup: { marginTop: 10, padding: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 },
  buttonRow: { flexDirection: "row", justifyContent: "space-around" },
  subtitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  messages: { borderColor: "#dee2e6", borderWidth: 1, padding: 10, backgroundColor: "#f8f9fa", borderRadius: 5, flex: 1 },
  messageText: { marginVertical: 2 },
});