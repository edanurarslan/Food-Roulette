/**
 * Food Roulette - React Native Expo App
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { PushTokenBootstrap } from './components/PushTokenBootstrap';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <NavigationContainer>
          <PushTokenBootstrap />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </>
  );
}
