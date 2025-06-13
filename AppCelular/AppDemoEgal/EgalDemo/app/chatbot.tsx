import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Definir tipo para mensajes
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

// Opciones rápidas para iniciar conversaciones
const quickOptions = [
  {
    id: '1',
    title: 'Problemas de Acceso',
    subtitle: 'No puedo abrir una puerta',
    icon: 'lock-closed-outline',
    color: '#e53e3e'
  },
  {
    id: '2',
    title: 'Información de Puertas',
    subtitle: 'Ver qué puertas tengo disponibles',
    icon: 'home-outline',
    color: '#4299e1'
  },
  {
    id: '3',
    title: 'Usar NFC',
    subtitle: 'Cómo activar y usar NFC',
    icon: 'phone-portrait-outline',
    color: '#38a169'
  },
  {
    id: '4',
    title: 'Gestión de Usuario',
    subtitle: 'Cambiar contraseña o perfil',
    icon: 'person-outline',
    color: '#805ad5'
  },
  {
    id: '5',
    title: 'Contactar Soporte',
    subtitle: 'Hablar con un administrador',
    icon: 'headset-outline',
    color: '#d69e2e'
  },
  {
    id: '6',
    title: 'Cerrar Sesión',
    subtitle: 'Cómo salir de la aplicación',
    icon: 'log-out-outline',
    color: '#718096'
  }
];

// Respuestas predefinidas del chatbot
const botResponses = {
  greeting: "¡Hola! Soy el asistente virtual del Hotel EGAL. Selecciona una opción de abajo o escribe tu consulta:",
  access_problem: "Entiendo que tienes problemas para acceder a una puerta. Verifiquemos:\n\n1. ¿Tienes conexión a internet?\n2. ¿Has intentado cerrar y abrir la app?\n3. ¿La puerta aparece en tu lista de accesos?\n\nSi el problema persiste, puedo conectarte con un administrador.",
  door_info: "Puedes ver todas las puertas disponibles en la sección 'Control de Accesos' del menú principal. Allí aparecerán solo las puertas para las que tienes autorización. Si necesitas acceso a una puerta adicional, debes solicitarlo al administrador.",
  nfc_help: "Para usar NFC:\n\n1. Activa NFC en tu dispositivo\n2. Ve a la sección 'Generador NFC'\n3. Acerca tu teléfono a la cerradura\n4. La puerta se abrirá automáticamente\n\n¿Necesitas ayuda con algún paso específico?",
  user_management: "Para gestionar tu perfil:\n\n• Cambiar contraseña: Ve a configuración → Cambiar contraseña\n• Ver permisos: Panel principal → Mis accesos\n• Actualizar datos: Solo un administrador puede hacerlo\n\n¿Qué necesitas cambiar específicamente?",
  support_contact: "Para contactar con soporte puedes:\n\n• Usar este chat (responderé lo antes posible)\n• Llamar al administrador del sistema\n• Enviar un mensaje desde el panel principal\n\n¿Prefieres que te conecte directamente con un administrador?",
  logout_help: "Para cerrar sesión:\n\n1. Ve al panel principal\n2. Busca el botón rojo 'Cerrar Sesión' en la parte inferior\n3. Confirma que deseas salir\n\nTu sesión se cerrará y volverás a la pantalla de inicio.",
  fallback: "No estoy seguro de cómo ayudarte con eso. ¿Puedes seleccionar una de las opciones disponibles o reformular tu pregunta?"
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Inicializar con mensaje de bienvenida
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      text: botResponses.greeting,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Controlar estado del teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Función para manejar selección de opción rápida
  const handleQuickOption = (optionId: string) => {
    const option = quickOptions.find(opt => opt.id === optionId);
    if (!option) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      text: option.title,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setShowQuickOptions(false);

    // Responder según la opción seleccionada
    setTimeout(() => {
      let botResponseText = '';
      
      switch (optionId) {
        case '1':
          botResponseText = botResponses.access_problem;
          break;
        case '2':
          botResponseText = botResponses.door_info;
          break;
        case '3':
          botResponseText = botResponses.nfc_help;
          break;
        case '4':
          botResponseText = botResponses.user_management;
          break;
        case '5':
          botResponseText = botResponses.support_contact;
          break;
        case '6':
          botResponseText = botResponses.logout_help;
          break;
        default:
          botResponseText = botResponses.fallback;
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 800);
  };

  // Función para obtener respuesta del bot basada en texto
  const getBotResponse = (userMessage: string): string => {
    const normalizedMessage = userMessage.toLowerCase();
    
    if (normalizedMessage.includes('hola') || normalizedMessage.includes('saludos')) {
      return botResponses.greeting;
    } else if (normalizedMessage.includes('puerta') && normalizedMessage.includes('abrir')) {
      return botResponses.access_problem;
    } else if (normalizedMessage.includes('puerta') || normalizedMessage.includes('acceso')) {
      return botResponses.door_info;
    } else if (normalizedMessage.includes('nfc')) {
      return botResponses.nfc_help;
    } else if (normalizedMessage.includes('contraseña') || normalizedMessage.includes('perfil')) {
      return botResponses.user_management;
    } else if (normalizedMessage.includes('admin') || normalizedMessage.includes('soporte')) {
      return botResponses.support_contact;
    } else if (normalizedMessage.includes('cerrar sesión') || normalizedMessage.includes('salir')) {
      return botResponses.logout_help;
    } else {
      return botResponses.fallback;
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
    setShowQuickOptions(false);
    
    // Simular respuesta del bot después de un breve retraso
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    }, 600);
  };

  // Desplazar al último mensaje cuando se añade uno nuevo
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Renderizar un mensaje individual
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'user' ? styles.userMessageText : styles.botMessageText
      ]}>
        {item.text}
      </Text>
      <Text style={[
        styles.timestampText,
        item.sender === 'user' ? styles.userTimestamp : styles.botTimestamp
      ]}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  // Renderizar opciones rápidas
  const renderQuickOptions = () => (
    <View style={styles.quickOptionsContainer}>
      <Text style={styles.quickOptionsTitle}>¿En qué puedo ayudarte?</Text>
      <View style={styles.optionsGrid}>
        {quickOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.quickOptionCard}
            onPress={() => handleQuickOption(option.id)}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
              <Ionicons name={option.icon as any} size={24} color="white" />
            </View>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Asistente EGAL</Text>
          <View style={styles.statusIndicator}>
            <View style={styles.activeIndicator} />
            <Text style={styles.statusText}>En línea</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowQuickOptions(true)}>
          <Ionicons name="help-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.mainContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Área de mensajes que se ajusta automáticamente */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: keyboardVisible ? 0 : 8 }
            ]}
            showsVerticalScrollIndicator={false}
          />
          
          {showQuickOptions && renderQuickOptions()}
        </View>

        {/* Input fijo en la parte inferior */}
        <View style={[
          styles.inputContainer,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom || 16 : 16 }
        ]}>
          {!showQuickOptions && (
            <TouchableOpacity 
              style={styles.showOptionsButton}
              onPress={() => setShowQuickOptions(true)}
            >
              <Ionicons name="grid-outline" size={18} color="#4299e1" />
              <Text style={styles.showOptionsText}>Mostrar opciones</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.inputWrapper}>
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
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
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
    paddingTop: 20, // Reducido para que no quede tapado por notificaciones
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
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
  mainContainer: {
    flex: 1,
    marginTop: 8, // Añadir margen para separar del header
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#2d3748',
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botTimestamp: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
  quickOptionsContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  quickOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickOptionCard: {
    width: '48%',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 6,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 16,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    position: 'relative',
    zIndex: 20,
    marginTop: 'auto', // Para que suba automáticamente cuando hay poco contenido
  },
  showOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 4,
  },
  showOptionsText: {
    fontSize: 14,
    color: '#4299e1',
    marginLeft: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    color: '#2d3748',
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    backgroundColor: '#4299e1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
});