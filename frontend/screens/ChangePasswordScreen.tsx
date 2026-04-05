/**
 * ChangePasswordScreen - Şifre Değiştirme Ekranı
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiService } from '../services/api';

type RootStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword.trim()) {
      Alert.alert('Hata', 'Eski şifreyi girin');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Hata', 'Yeni şifreyi girin');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalı');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    try {
      await apiService.changePassword(oldPassword, newPassword, confirmPassword);
      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi!');
      navigation.goBack();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Şifre değiştirilirken hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
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
        <Text style={styles.headerTitle}>Şifreyi Değiştir</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Eski Şifre</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Eski şifreniz"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showOld}
              />
              <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                <Text style={styles.toggleButton}>{showOld ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yeni Şifre</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yeni şifreniz (min 8 karakter)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showNew}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Text style={styles.toggleButton}>{showNew ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yeni Şifre (Tekrar)</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Yeni şifrenizi tekrar girin"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={styles.toggleButton}>{showConfirm ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>🔐 Şifreyi Güncelle</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 14,
    fontSize: 15,
    color: '#030213',
    fontWeight: '500',
  },
  toggleButton: {
    fontSize: 18,
    padding: 8,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    elevation: 12,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
