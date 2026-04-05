/**
 * AboutScreen - Uygulama Hakkında Ekranı
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
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

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export const AboutScreen: React.FC<Props> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Uygulama Hakkında</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🍽️</Text>
          </View>
          <Text style={styles.appName}>Food Roulette</Text>
          <Text style={styles.version}>Sürüm 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Hakkımızda</Text>
          <Text style={styles.body}>
            Food Roulette, mutfak deneyimini daha heyecanlı ve pratik hale
            getirmek amacıyla tasarlanmış bir tarif önerileri uygulamasıdır.
            Her gün yeni tarifler keşfedin ve favori yemeklerinizi kaydedin.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>✨ Özellikler</Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Rastgele Tarif Seçimi</Text>
              <Text style={styles.featureDesc}>Hızlı karar için çark çevirin</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>❤️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Favori Tarifler</Text>
              <Text style={styles.featureDesc}>Sevdiğiniz tarifler kaydedin</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📖</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Tarif Kütüphanesi</Text>
              <Text style={styles.featureDesc}>Binlerce tarif ara yap</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Alışveriş Listesi</Text>
              <Text style={styles.featureDesc}>Malzemeleri listeye ekleyin</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>👥 Geliştirme Ekibi</Text>
          <Text style={styles.body}>
            Food Roulette, tutkulu yazılım geliştirici ve tasarımcılar tarafından
            oluşturulmuştur. Amaç, herkes için mutfak deneyimini kolay ve keyifli
            hale getirmektir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>📞 İletişim Bilgileri</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>info@foodroulette.com</Text>
          </View>
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Web:</Text>
            <Text style={styles.contactValue}>www.foodroulette.com</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>⚖️ Hukuki</Text>
          <Text style={styles.body}>
            Food Roulette, tüm uygulanabilir yasalara uyar. Daha fazla bilgi için
            Kullanım Şartları ve Gizlilik Politikasını inceleyiniz.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bizi seçtiğiniz için teşekkür ederiz! 🙏
          </Text>
          <Text style={styles.copyright}>
            © 2024 Food Roulette. Tüm hakları saklıdır.
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
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#030213',
  },
  footer: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
