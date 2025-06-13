import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#4299e1',
    }}>
      {user.is_admin ? (
        <Tabs.Screen
          name="adminpanel"
          options={{
            title: 'Panel Admin',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
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
        name="hotel-info"
        options={{
          title: 'Hotel',
          tabBarIcon: ({ color }) => (
            <Ionicons name="business" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass" size={24} color={color} />
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
      
      {/* La sección de door-management ha sido eliminada para ocultar la gestión de puertas */}
    </Tabs>
  );
}