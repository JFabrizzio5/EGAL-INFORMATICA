import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NFCHelpScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guía NFC</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo funciona el sistema NFC?</Text>
          <Text style={styles.paragraph}>
            El sistema utiliza tags NFC que contienen enlaces (URLs) especiales que, al ser escaneados, 
            pueden abrir puertas específicas si tienes permiso para hacerlo.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generar un token NFC</Text>
          <Text style={styles.paragraph}>
            1. Ve a la sección "Gestionar Usuarios" en el panel de administración
          </Text>
          <Text style={styles.paragraph}>
            2. Selecciona un usuario y presiona el botón "NFC"
          </Text>
          <Text style={styles.paragraph}>
            3. Selecciona la puerta para la que quieres generar el token
          </Text>
          <Text style={styles.paragraph}>
            4. Usa el código QR generado o comparte el enlace
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programar un tag NFC</Text>
          <Text style={styles.paragraph}>
            Para programar un tag NFC necesitas:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Un teléfono con capacidad NFC</Text>
            <Text style={styles.bulletItem}>• Una app de escritura NFC (como NFC Tools)</Text>
            <Text style={styles.bulletItem}>• Tags NFC grabables (NTAG213, NTAG215, etc.)</Text>
          </View>
          <Text style={styles.paragraphBold}>Pasos para programar:</Text>
          <Text style={styles.paragraph}>
            1. Genera el token para el usuario y puerta específicos
          </Text>
          <Text style={styles.paragraph}>
            2. Comparte o copia el enlace generado (similar a http://172.22.82.26/puertas/v1/abrir/puerta1?token=xxx...)
          </Text>
          <Text style={styles.paragraph}>
            3. Abre la app de escritura NFC en tu teléfono
          </Text>
          <Text style={styles.paragraph}>
            4. Selecciona "Escribir" → "URL/URI"
          </Text>
          <Text style={styles.paragraph}>
            5. Pega el enlace generado
          </Text>
          <Text style={styles.paragraph}>
            6. Acerca el tag NFC a tu teléfono y completa la escritura
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usar un tag NFC</Text>
          <Text style={styles.paragraph}>
            Para usar un tag NFC programado:
          </Text>
          <Text style={styles.paragraph}>
            1. Simplemente acerca tu teléfono al tag NFC
          </Text>
          <Text style={styles.paragraph}>
            2. Tu teléfono detectará el tag y abrirá automáticamente el navegador con el enlace
          </Text>
          <Text style={styles.paragraph}>
            3. Si tienes la app instalada, se abrirá automáticamente
          </Text>
          <Text style={styles.paragraph}>
            4. Si tienes permisos para esa puerta, se abrirá
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enlaces para cada puerta</Text>
          <Text style={styles.paragraph}>
            Cada token NFC debe programarse para una puerta específica. La URL tiene este formato:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.code}>
              http://172.22.82.26/puertas/v1/abrir/PUERTA_ID?token=TOKEN_JWT
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Donde PUERTA_ID puede ser: puerta1, puerta2 o puerta3
          </Text>
          <Text style={styles.paragraphWarning}>
            Nota: Debes generar un token diferente para cada puerta que quieras controlar.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 8,
    lineHeight: 24,
  },
  paragraphBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    marginTop: 8,
  },
  paragraphWarning: {
    fontSize: 16,
    color: '#c53030',
    marginTop: 12,
    fontWeight: '500',
  },
  bulletList: {
    marginVertical: 8,
    paddingLeft: 8,
  },
  bulletItem: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 6,
    lineHeight: 24,
  },
  codeBlock: {
    backgroundColor: '#edf2f7',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#2d3748',
  },
});