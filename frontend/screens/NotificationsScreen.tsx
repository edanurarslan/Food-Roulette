/**
 * NotificationsScreen - Bildirim Ayarları Ekranı
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import {
  NOTIF_PREF_PUSH,
  NOTIF_PREF_EMAIL,
  NOTIF_PREF_RECIPE,
  NOTIF_PREF_FAVORITE,
  getNotificationPermissionStatus,
  requestNotificationPermissions,
} from '../services/notifications';

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
  const { token } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [recipeNotifications, setRecipeNotifications] = useState(true);
  const [favoriteNotifications, setFavoriteNotifications] = useState(true);
  const [permLabel, setPermLabel] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const refreshPermission = useCallback(async () => {
    const p = await getNotificationPermissionStatus();
    const map: Record<string, string> = {
      granted: 'Bildirim izni: verildi',
      denied: 'Bildirim izni: reddedildi (Ayarlardan açabilirsin)',
      undetermined: 'Bildirim izni: henüz sorulmadı',
      unavailable: Platform.OS === 'web' ? 'Web’de push sınırlıdır' : 'Kullanılamıyor',
    };
    setPermLabel(map[p] ?? '');
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c, d] = await Promise.all([
          AsyncStorage.getItem(NOTIF_PREF_PUSH),
          AsyncStorage.getItem(NOTIF_PREF_EMAIL),
          AsyncStorage.getItem(NOTIF_PREF_RECIPE),
          AsyncStorage.getItem(NOTIF_PREF_FAVORITE),
        ]);
        if (a !== null) setPushNotifications(a === 'true');
        if (b !== null) setEmailNotifications(b === 'true');
        if (c !== null) setRecipeNotifications(c === 'true');
        if (d !== null) setFavoriteNotifications(d === 'true');
      } catch {
        // ignore
      }
      await refreshPermission();
    })();
  }, [refreshPermission]);

  const persist = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const onPushChange = async (v: boolean) => {
    setPushNotifications(v);
    await persist(NOTIF_PREF_PUSH, v);
    if (v && Platform.OS !== 'web') {
      const p = await requestNotificationPermissions();
      await refreshPermission();
      if (p !== 'granted') {
        Alert.alert(
          'İzin gerekli',
          'Push bildirimleri için sistem bildirim iznine ihtiyaç var.'
        );
      }
    }
  };

  const handleTestPush = async () => {
    if (!token) {
      Alert.alert('Giriş gerekli', 'Test push için önce giriş yap.');
      return;
    }
    try {
      await apiService.sendSelfPushNotification('Food Roulette', 'Test bildirimi — push altyapısı çalışıyor.');
      Alert.alert('Gönderildi', 'Sunucu Expo Push üzerinden bildirimi iletti (token kayıtlıysa cihazda görünür).');
    } catch {
      Alert.alert('Hata', 'Push gönderilemedi. Token kaydı ve ağ bağlantısını kontrol et.');
    }
  };

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
        {!!permLabel && (
          <View style={styles.permBanner}>
            <Text style={styles.permBannerText}>{permLabel}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Genel Ayarlar</Text>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Push Bildirimleri</Text>
              <Text style={styles.notificationDesc}>Uygulama bildirimleri al</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={onPushChange}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Email Bildirimleri</Text>
              <Text style={styles.notificationDesc}>Email ile bildir (gelecek özellik)</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={async (v) => {
                setEmailNotifications(v);
                await persist(NOTIF_PREF_EMAIL, v);
              }}
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
              <Text style={styles.notificationDesc}>Yeni tarifler eklendiğinde (gelecek)</Text>
            </View>
            <Switch
              value={recipeNotifications}
              onValueChange={async (v) => {
                setRecipeNotifications(v);
                await persist(NOTIF_PREF_RECIPE, v);
              }}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Favori Tarifler</Text>
              <Text style={styles.notificationDesc}>Favorilerin hakkında (gelecek)</Text>
            </View>
            <Switch
              value={favoriteNotifications}
              onValueChange={async (v) => {
                setFavoriteNotifications(v);
                await persist(NOTIF_PREF_FAVORITE, v);
              }}
              trackColor={{ false: '#ddd', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.testButton} onPress={handleTestPush}>
            <Text style={styles.testButtonText}>Sunucudan test push gönder</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Push tercihi AsyncStorage’da saklanır; açıkken giriş yaptıktan sonra Expo token backend’e kaydedilir.
            Pişirme zamanlayıcısı yerel bildirim de kullanır.
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
  permBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  permBannerText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '600',
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
  testButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  infoBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    lineHeight: 20,
  },
});
