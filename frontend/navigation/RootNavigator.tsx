/**
 * RootNavigator - Root Navigation Logic
 * Authentication durumuna göre farklı navigator'ları göster
 */

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AppNavigator } from './AppNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isLoading, user, token } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  // User login olmuşsa (token var ve user var) → AppNavigator göster
  // Değilse → Auth Stack göster (Login/Register)
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token && user ? (
        // 🔒 Protected App Navigation
        <Stack.Screen
          name="App"
          component={AppNavigator}
        />
      ) : (
        // 🔓 Auth Navigation
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </Stack.Navigator>
  );
};

// Auth Stack Navigator
const AuthStack = createNativeStackNavigator();

export const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Login"
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'pop',
          gestureEnabled: false,
        }}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          animationTypeForReplace: 'pop',
          gestureEnabled: true,
        }}
      />
    </AuthStack.Navigator>
  );
};
