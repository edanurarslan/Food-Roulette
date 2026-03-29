/**
 * RegisterScreen - Kullanıcı Kayıt Ekranı
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [usernameFocus, setUsernameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const [confirmPasswordFocus, setConfirmPasswordFocus] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const { register } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRegister = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı gir');
      return;
    }
    if (username.length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalı');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Hata', 'Email adresini gir');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Hata', 'Geçerli bir email adresi gir');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Hata', 'Şifreyi gir');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Hata', 'Şifre en az 8 karakter olmalı');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    if (!agreedToTerms) {
      Alert.alert('Hata', 'Şartlar ve koşulları kabul etmelisin');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      // Navigation otomatik AuthContext'e göre yapılacak
    } catch (error: any) {
      Alert.alert('Kayıt Başarısız', error.message || 'Lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButtonContainer}
        >
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.headerTitle}>Kayıt Ol</Text>
        <Text style={styles.headerSubtitle}>Yeni hesap oluştur</Text>
      </LinearGradient>

      {/* Form */}
      <View style={styles.form}>
        {/* Username Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kullanıcı Adı</Text>
          <View
            style={[
              styles.inputContainer,
              usernameFocus && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="johndoe"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              editable={!loading}
              value={username}
              onChangeText={setUsername}
              onFocus={() => setUsernameFocus(true)}
              onBlur={() => setUsernameFocus(false)}
            />
          </View>
          <Text style={styles.hint}>
            {username.length > 0 ? `${username.length}/20` : '3-20 karakter'}
          </Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Adresi</Text>
          <View
            style={[
              styles.inputContainer,
              emailFocus && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocus(true)}
              onBlur={() => setEmailFocus(false)}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifre</Text>
          <View
            style={[
              styles.passwordContainer,
              passwordFocus && styles.passwordContainerFocused,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              editable={!loading}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>En az 8 karakter</Text>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifreyi Onayla</Text>
          <View
            style={[
              styles.passwordContainer,
              confirmPasswordFocus && styles.passwordContainerFocused,
            ]}
          >
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setConfirmPasswordFocus(true)}
              onBlur={() => setConfirmPasswordFocus(false)}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>
                {showConfirmPassword ? '👁️' : '🔒'}
              </Text>
            </TouchableOpacity>
          </View>
          {password && confirmPassword && password !== confirmPassword && (
            <Text style={styles.errorHint}>Şifreler eşleşmiyor</Text>
          )}
          {password && confirmPassword && password === confirmPassword && (
            <Text style={styles.successHint}>Şifreler eşleşiyor ✓</Text>
          )}
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            disabled={loading}
          >
            <View
              style={[
                styles.checkboxBox,
                agreedToTerms && styles.checkboxBoxChecked,
              ]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
          <View style={styles.termsText}>
            <Text style={styles.termsLabel}>
              Koşulları ve Gizlilik Politikasını{'\n'}
              <Text style={styles.termsLink}>kabul ediyorum</Text>
            </Text>
          </View>
        </View>

        {/* Register Button with Gradient */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Footer - Login Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Zaten üye misin? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.loginLink}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerGradient: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -40,
    marginHorizontal: -20,
    paddingTop: 40,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    elevation: 12,
  },
  backButtonContainer: {
    alignSelf: 'flex-start',
    width: '100%',
    marginBottom: 15,
  },
  backButton: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
  },
  inputContainerFocused: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF7',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  input: {
    fontSize: 16,
    color: '#030213',
    fontWeight: '500',
  },
  hint: {
    fontSize: 13,
    color: '#717182',
    marginTop: 7,
    fontWeight: '500',
  },
  errorHint: {
    fontSize: 13,
    color: '#d4183d',
    marginTop: 7,
    fontWeight: '500',
  },
  successHint: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 7,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  passwordContainerFocused: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF7',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#030213',
    fontWeight: '500',
  },
  eyeButton: {
    paddingLeft: 10,
    paddingRight: 6,
  },
  eyeIcon: {
    fontSize: 18,
    color: '#717182',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 12,
  },
  checkbox: {
    paddingVertical: 5,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    elevation: 3,
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    marginLeft: 12,
  },
  termsLabel: {
    fontSize: 13,
    color: '#717182',
    lineHeight: 20,
    fontWeight: '500',
  },
  termsLink: {
    color: '#10B981',
    fontWeight: '700',
  },
  buttonGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    elevation: 12,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  footerText: {
    fontSize: 15,
    color: '#717182',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '700',
    marginLeft: 4,
  },
});
