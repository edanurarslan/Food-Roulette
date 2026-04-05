/**
 * NotificationsScreen - Bildirim Ayarları Ekranı
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [recipeNotifications, setRecipeNotifications] = useState(true);
  const [favoriteNotifications, setFavoriteNotifications] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Genel Ayarlar</Text>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Push Bildirimleri</Text>
              <Text style={styles.notificationDesc}>
                Uygulama bildirimleri al
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Email Bildirimleri</Text>
              <Text style={styles.notificationDesc}>
                Email ile bildir
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Tarif Bildirimleri</Text>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Yeni Tarifler</Text>
              <Text style={styles.notificationDesc}>
                Yeni tarifler eklendiğinde haberdar ol
              </Text>
            </View>
            <Switch
              value={recipeNotifications}
              onValueChange={setRecipeNotifications}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Favori Tarifler</Text>
              <Text style={styles.notificationDesc}>
                Favori tarifleriniz hakkında haberdar ol
              </Text>
            </View>
            <Switch
              value={favoriteNotifications}
              onValueChange={setFavoriteNotifications}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Bildirim ayarlarınız otomatik olarak kaydedilecektir.
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    lineHeight: 20,
  },
});
