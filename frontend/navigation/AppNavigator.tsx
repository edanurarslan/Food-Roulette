/**
 * AppNavigator - Main App Navigation with Bottom Tabs
 * Bottom tab navigator + Stack navigators for each tab
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ProfileScreen } from '../screens/ProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { AboutScreen } from '../screens/AboutScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ShoppingListScreen } from '../screens/ShoppingListScreen';
import { WeeklyMenuScreen } from '../screens/WeeklyMenuScreen';

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
const HistoryStack = createNativeStackNavigator();
const ShoppingStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Options with Fade Transition
const stackScreenOptions = {
  headerStyle: { backgroundColor: '#10B981' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18 },
  animationEnabled: true,
  animationTypeForReplace: 'pop' as const,
};

// Stack Screens with Animation Wrapper
function HomeStackScreen() {
  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused ? (
    <HomeStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Anasayfa' }}
      />
      <HomeStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Tarif Detayları' }}
      />
    </HomeStack.Navigator>
  ) : null;
}

function RecipesStackScreen() {
  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused ? (
    <RecipesStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <RecipesStack.Screen
        name="RecipesMain"
        component={RecipesScreen}
        options={{ title: 'Tarifler' }}
      />
      <RecipesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Tarif Detayları' }}
      />
    </RecipesStack.Navigator>
  ) : null;
}

function FavoritesStackScreen() {
  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused ? (
    <FavoritesStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <FavoritesStack.Screen
        name="FavoritesMain"
        component={FavoritesScreen}
        options={{ title: 'Favoriler' }}
      />
      <FavoritesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Tarif Detayları' }}
      />
    </FavoritesStack.Navigator>
  ) : null;
}

function ShoppingStackScreen() {
  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused ? (
    <ShoppingStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <ShoppingStack.Screen
        name="ShoppingMain"
        component={ShoppingListScreen}
        options={{ title: 'Alışveriş Listesi' }}
      />
      <ShoppingStack.Screen
        name="Weekly"
        component={WeeklyMenuScreen}
        options={{ title: 'Haftalık Menu' }}
      />
    </ShoppingStack.Navigator>
  ) : null;
}

function HistoryStackScreen() {
  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused ? (
    <HistoryStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <HistoryStack.Screen
        name="HistoryMain"
        component={HistoryScreen}
        options={{ title: 'Tarih' }}
      />
      <HistoryStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Tarif Detayları' }}
      />
    </HistoryStack.Navigator>
  ) : null;
}

function ProfileStackScreen() {
  const [isFocused, setIsFocused] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return isFocused ? (
    <ProfileStack.Navigator
      screenOptions={stackScreenOptions}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Profili Düzenle' }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Şifre Değiştir' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Bildirim Ayarları' }}
      />
      <ProfileStack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ title: 'Kullanım Şartları' }}
      />
      <ProfileStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Gizlilik Politikası' }}
      />
      <ProfileStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'Uygulama Hakkında' }}
      />
    </ProfileStack.Navigator>
  ) : null;
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
        // Her tab geçişinde animasyon tetiklensin diye lazy rendering deaktif et
        lazy: false,
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
        name="HistoryTab"
        component={HistoryStackScreen}
        options={{
          tabBarLabel: 'Tarih',
          tabBarIcon: ({ color }) => <TabIcon icon="📜" color={color} />,
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
