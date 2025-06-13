import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Definir tipo para mensajes
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

// Respuestas predefinidas del chatbot
const botResponses = {
  greeting: [
    "¡Hola! Soy Fiesone, el asistente virtual del Hotel. ¿En qué puedo ayudarte?",
    "¡Bienvenido al Hotel Fiesone! Estoy aquí para asistirte.",
    "Hola, soy el asistente del sistema EGAL. ¿Necesitas ayuda con algo?"
  ],
  help: [
    "Puedo ayudarte con:\n- Información sobre las puertas\n- Problemas de acceso\n- Uso de la aplicación\n- Contactar con soporte",
    "¿Necesitas ayuda con el acceso a las puertas? ¿O tienes otra consulta sobre la aplicación?"
  ],
  door: [
    "Las puertas se pueden abrir desde la sección 'Control de Accesos'. Si tienes problemas, verifica que tengas los permisos necesarios.",
    "Para abrir una puerta, asegúrate de tener conexión y los permisos adecuados. Luego presiona sobre la puerta deseada en el panel principal."
  ],
  access: [
    "Los permisos de acceso son gestionados por el administrador. Si necesitas acceso a una puerta específica, contacta con el administrador del sistema.",
    "Solo puedes abrir las puertas para las que tienes autorización. El administrador puede modificar tus permisos."
  ],
  nfc: [
    "La funcionalidad NFC permite abrir puertas acercando tu dispositivo. Asegúrate de tener NFC activado y los permisos necesarios.",
    "Para usar NFC, ve a la sección de generador NFC y sigue las instrucciones en pantalla."
  ],
  logout: [
    "Para cerrar sesión, ve al panel principal y presiona el botón 'Cerrar Sesión' en la parte inferior.",
    "Puedes cerrar sesión desde el botón rojo ubicado en la parte inferior del panel de control."
  ],
  admin: [
    "Las funciones de administrador incluyen gestión de usuarios, asignación de permisos y monitoreo de accesos.",
    "Como administrador puedes agregar usuarios, modificar permisos y ver registros de actividad."
  ],
  fallback: [
    "Lo siento, no entendí tu consulta. ¿Puedes reformularla?",
    "No estoy seguro de cómo ayudarte con eso. ¿Puedes ser más específico?",
    "Disculpa, no tengo información sobre eso. ¿Necesitas ayuda con algo más?"
  ],
};

// Función para obtener respuesta aleatoria de una categoría
const getRandomResponse = (category: keyof typeof botResponses): string => {
  const responses = botResponses[category];
  return responses[Math.floor(Math.random() * responses.length)];
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getRandomResponse('greeting'),
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Función para determinar la respuesta del bot
  const getBotResponse = (userMessage: string): string => {
    const normalizedMessage = userMessage.toLowerCase();
    
    if (normalizedMessage.includes('hola') || normalizedMessage.includes('saludos')) {
      return getRandomResponse('greeting');
    } else if (normalizedMessage.includes('ayuda') || normalizedMessage.includes('help')) {
      return getRandomResponse('help');
    } else if (normalizedMessage.includes('puerta') || normalizedMessage.includes('abrir')) {
      return getRandomResponse('door');
    } else if (normalizedMessage.includes('permiso') || normalizedMessage.includes('acceso')) {
      return getRandomResponse('access');
    } else if (normalizedMessage.includes('nfc')) {
      return getRandomResponse('nfc');
    } else if (normalizedMessage.includes('cerrar sesión') || normalizedMessage.includes('logout')) {
      return getRandomResponse('logout');
    } else if (normalizedMessage.includes('admin') || normalizedMessage.includes('administrador')) {
      return getRandomResponse('admin');
    } else {
      return getRandomResponse('fallback');
    }
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    
    // Simular respuesta del bot después de un breve retraso
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 500);
  };

  // Desplazar al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Renderizar un mensaje individual
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestampText}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Asistente Fiesone</Text>
          <View style={styles.statusIndicator}>
            <View style={styles.activeIndicator} />
            <Text style={styles.statusText}>En línea</Text>
          </View>
        </View>
        <Ionicons name="help-circle-outline" size={24} color="white" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#a0aec0"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled
            ]} 
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4a5568',
    padding: 16,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#4299e1',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 16,
    color: '#2d3748',
  },
  timestampText: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.4)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4299e1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
});