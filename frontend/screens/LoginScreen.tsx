/**
 * LoginScreen - Kullanıcı Giriş Ekranı
 * Tasarım: Front Örnek Projesinin Birebir Aynısı
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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  const fadeAnim = new Animated.Value(0);
  
  const { login } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Hata', 'Email adresini gir');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Hata', 'Şifreyi gir');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigation otomatik AuthContext'e göre yapılacak
    } catch (error: any) {
      Alert.alert('Giriş Başarısız', error.message || 'Lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      {/* Gradient Header Background */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.emoji}>🍽️</Text>
          <Text style={styles.headerTitle}>Food Roulette</Text>
          <Text style={styles.headerSubtitle}>Gıda Ruletine Hoş Geldiniz</Text>
        </View>
      </LinearGradient>

      {/* Form */}
      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Adresi</Text>
          <View
            style={[
              styles.passwordContainer,
              emailFocus && styles.passwordContainerFocused,
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
        </View>

        {/* Remember Me */}
        <View style={styles.rememberContainer}>
          <Text style={styles.rememberText}>Beni Hatırla</Text>
        </View>

        {/* Login Button with Gradient */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <TouchableOpacity style={styles.socialButton} disabled={loading} activeOpacity={0.7}>
          <Text style={styles.socialButtonEmoji}>🍎</Text>
          <Text style={styles.socialButtonText}>Apple ile Giriş</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} disabled={loading} activeOpacity={0.7}>
          <Text style={styles.socialButtonEmoji}>🔵</Text>
          <Text style={styles.socialButtonText}>Google ile Giriş</Text>
        </TouchableOpacity>
      </View>

      {/* Footer - Register Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Henüz üye değil misin? </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={styles.registerLink}>Kayıt Ol</Text>
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
    justifyContent: 'space-between',
  },
  headerGradient: {
    alignItems: 'center',
    marginTop: -40,
    marginBottom: 40,
    marginHorizontal: -20,
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    elevation: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  form: {
    marginBottom: 20,
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
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#030213',
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
    padding: 4,
    marginRight: 8,
  },
  eyeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberText: {
    fontSize: 14,
    color: '#717182',
  },
  buttonGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  socialButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  socialButtonEmoji: {
    fontSize: 22,
  },
  socialButtonText: {
    color: '#030213',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
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
  registerLink: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '700',
    marginLeft: 4,
  },
});
