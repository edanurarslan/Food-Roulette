/**
 * ProfileScreen - Kullanıcı Profil Ekranı
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileMain'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setShowLogoutConfirm(false);
      // Navigation otomatik RootNavigator tarafından LoginScreen'e yönlendirilecek
    } catch (error: any) {
      Alert.alert('Hata', 'Çıkış yapılırken hata oluştu: ' + error.message);
      setLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  // Buton işlemleri
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleNotifications = () => {
    navigation.navigate('Notifications');
  };

  const handleTermsOfService = () => {
    navigation.navigate('Terms');
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleAboutApp = () => {
    navigation.navigate('About');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Kullanıcı bilgileri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header with Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        <Text style={styles.profileTitle}>{user?.username}</Text>
      </LinearGradient>

      {/* User Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Kullanıcı Bilgileri</Text>

        {/* Username */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Kullanıcı Adı</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>

        {/* Email */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Email Adresi</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        {/* Bio */}
        {user.bio && (
          <View style={styles.infoCard}>
            <Text style={styles.label}>Hakkımda</Text>
            <Text style={styles.value}>{user.bio}</Text>
          </View>
        )}

        {/* User Status */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Durum</Text>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: user.is_active ? '#27AE60' : '#E74C3C' },
              ]}
            />
            <Text style={styles.value}>
              {user.is_active ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
        </View>

        {/* Joined Date */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Katılma Tarihi</Text>
          <Text style={styles.value}>
            {new Date(user.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>

      {/* Account Settings Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Hesap Ayarları</Text>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={styles.settingButton} 
          disabled={loading}
          onPress={handleEditProfile}
        >
          <Text style={styles.settingButtonText}>✏️ Profili Düzenle</Text>
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity 
          style={styles.settingButton} 
          disabled={loading}
          onPress={handleChangePassword}
        >
          <Text style={styles.settingButtonText}>🔐 Şifreyi Değiştir</Text>
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity 
          style={styles.settingButton} 
          disabled={loading}
          onPress={handleNotifications}
        >
          <Text style={styles.settingButtonText}>🔔 Bildirimler</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>Hakkında</Text>

        <TouchableOpacity 
          style={styles.aboutButton}
          onPress={handleTermsOfService}
        >
          <Text style={styles.aboutButtonText}>📋 Kullanım Şartları</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.aboutButton}
          onPress={handlePrivacyPolicy}
        >
          <Text style={styles.aboutButtonText}>🔒 Gizlilik Politikası</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.aboutButton}
          onPress={handleAboutApp}
        >
          <Text style={styles.aboutButtonText}>ℹ️ Uygulama Hakkında</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versiyon 1.0.0</Text>
        </View>
      </View>

      {/* Logout Button with Gradient */}
      <LinearGradient
        colors={['#d4183d', '#b3162b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoutButtonGradient}
      >
        <TouchableOpacity
          style={[styles.logoutButton, loading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.logoutButtonText}>🚪 Çıkış Yap</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Çıkış Yap</Text>
            <Text style={styles.modalMessage}>
              Uygulamadan çıkmak istediğinizden emin misiniz?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutConfirm(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonCancelText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Çıkış Yap</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: -20,
    marginHorizontal: -16,
    paddingVertical: 44,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    elevation: 12,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    elevation: 5,
  },
  avatar: {
    fontSize: 56,
  },
  infoSection: {
    marginBottom: 25,
  },
  settingsSection: {
    marginBottom: 25,
  },
  aboutSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 16,
    marginLeft: 2,
    letterSpacing: 0.4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
  },
  settingButton: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  settingButtonText: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  aboutButton: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  aboutButtonText: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  versionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  versionText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
  },
  logoutButtonGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#d4183d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    elevation: 12,
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.75,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    width: '88%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 14,
    letterSpacing: 0.4,
  },
  modalMessage: {
    fontSize: 15,
    color: '#717182',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f1f3',
  },
  modalButtonCancelText: {
    color: '#030213',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalButtonConfirm: {
    backgroundColor: '#d4183d',
    shadowColor: '#d4183d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  modalButtonConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
