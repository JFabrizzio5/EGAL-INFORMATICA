import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        // Apunta al archivo renombrado
        name="home"
        options={{ title: 'Inicio' }}
      />
      <Tabs.Screen
        name="adminpanel"
        options={{
          href: null, // Oculta de la barra de pestañas
          tabBarStyle: { display: 'none' }, // Oculta la barra al estar en esta pantalla
        }}
      />
      <Tabs.Screen
        name="useradmin"
        options={{
          href: null, // Oculta de la barra de pestañas
          tabBarStyle: { display: 'none' }, // Oculta la barra al estar en esta pantalla
        }}
      />
    </Tabs>
  );
}