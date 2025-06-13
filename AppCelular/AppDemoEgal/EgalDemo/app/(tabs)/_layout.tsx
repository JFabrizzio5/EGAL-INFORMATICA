import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4299e1',
        headerShown: false
      }}
    >
      {user.isAdmin ? (
        <Tabs.Screen
          name="adminpanel"
          options={{
            title: 'Panel Admin',
            tabBarIcon: ({ color }) => (
              <Ionicons name="shield-checkmark" size={24} color={color} />
            ),
          }}
        />
      ) : (
        <Tabs.Screen
          name="useradmin"
          options={{
            title: 'Control',
            tabBarIcon: ({ color }) => (
              <Ionicons name="key" size={24} color={color} />
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="nfc-scanner"
        options={{
          title: 'Escaneo NFC',
          tabBarIcon: ({ color }) => (
            <Ionicons name="scan" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      
      {user.is_admin && (
        <Tabs.Screen
          name="users-management"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color }) => (
              <Ionicons name="people" size={24} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}