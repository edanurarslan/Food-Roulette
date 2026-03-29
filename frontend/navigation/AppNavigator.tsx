/**
 * AppNavigator - Main App Navigation with Bottom Tabs
 * Bottom tab navigator + Stack navigators for each tab
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { ProfileScreen } from '../screens/ProfileScreen';

// Screens (Placeholder'lar şimdilik - daha sonra oluşturulacak)
const HomeScreen = () => (
  <PlaceholderScreen title="🏠 Anasayfa" />
);

const RecipesScreen = () => (
  <PlaceholderScreen title="📖 Tarifler" />
);

const FavoritesScreen = () => (
  <PlaceholderScreen title="❤️ Favoriler" />
);

const ShoppingScreen = () => (
  <PlaceholderScreen title="🛒 Alışveriş" />
);

// Placeholder Component
import { View, Text } from 'react-native';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{title}</Text>
    <Text style={{ marginTop: 10, color: '#888' }}>Yakında</Text>
  </View>
);

// Navigators
const HomeStack = createNativeStackNavigator();
const RecipesStack = createNativeStackNavigator();
const FavoritesStack = createNativeStackNavigator();
const ShoppingStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Screens
function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Anasayfa' }}
      />
    </HomeStack.Navigator>
  );
}

function RecipesStackScreen() {
  return (
    <RecipesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <RecipesStack.Screen
        name="RecipesMain"
        component={RecipesScreen}
        options={{ title: 'Tarifler' }}
      />
    </RecipesStack.Navigator>
  );
}

function FavoritesStackScreen() {
  return (
    <FavoritesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <FavoritesStack.Screen
        name="FavoritesMain"
        component={FavoritesScreen}
        options={{ title: 'Favoriler' }}
      />
    </FavoritesStack.Navigator>
  );
}

function ShoppingStackScreen() {
  return (
    <ShoppingStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <ShoppingStack.Screen
        name="ShoppingMain"
        component={ShoppingScreen}
        options={{ title: 'Alışveriş Listesi' }}
      />
    </ShoppingStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </ProfileStack.Navigator>
  );
}

// Main Bottom Tab Navigator
export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1.5,
          borderTopColor: 'rgba(0, 0, 0, 0.06)',
          paddingBottom: 8,
          paddingTop: 6,
          paddingHorizontal: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 6,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Anasayfa',
          tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
        }}
      />
      <Tab.Screen
        name="RecipesTab"
        component={RecipesStackScreen}
        options={{
          tabBarLabel: 'Tarifler',
          tabBarIcon: ({ color }) => <TabIcon icon="📖" color={color} />,
        }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStackScreen}
        options={{
          tabBarLabel: 'Favoriler',
          tabBarIcon: ({ color }) => <TabIcon icon="❤️" color={color} />,
        }}
      />
      <Tab.Screen
        name="ShoppingTab"
        component={ShoppingStackScreen}
        options={{
          tabBarLabel: 'Alışveriş',
          tabBarIcon: ({ color }) => <TabIcon icon="🛒" color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Tab Icon Component
const TabIcon = ({ icon, color }: { icon: string; color: string }) => (
  <Text style={{ fontSize: 20 }}>{icon}</Text>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
