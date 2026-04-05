/**
 * TermsScreen - Kullanım Şartları Ekranı
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

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

export const TermsScreen: React.FC<Props> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Kullanım Şartları</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>1. Genel Koşullar</Text>
          <Text style={styles.body}>
            Food Roulette uygulamasını kullanarak bu kullanım şartlarını kabul
            etmiş olursunuz. Uygulama, tarif önerileri ve mutfak rehberliği
            sağlamak amacıyla tasarlanmıştır.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>2. Kullanıcı Sorumluluğu</Text>
          <Text style={styles.body}>
            Kullanıcılar, hesaplarının gizliliğinden sorumludur. Şifrenizi
            hiç kimseyle paylaşmayın ve hesabınızda anormal bir etkinlik
            tespit ederseniz derhal bildiriniz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>3. Uygun Olmayan İçerik</Text>
          <Text style={styles.body}>
            Uygulamada saldırgan, ayrımcı veya yasa dışı içerik paylaşmak
            yasaktır. Böyle içeriği kullanıcılar tarafından bildirilen hesaplar
            askıya alınabilir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>4. Fikri Mülkiyet Hakları</Text>
          <Text style={styles.body}>
            Uygulama içeriğinin tüm fikri mülkiyet hakları Food Roulette'e
            aittir. Açık izin olmadan içeriği çoğaltma, dağıtma veya değiştirme
            yasaktır.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>5. Tarifler ve Talimatlar</Text>
          <Text style={styles.body}>
            Uygulama tarafından sağlanan tarifler bilgilendirme amaçlıdır.
            Pişirme sırasında dikkatli olun ve tüm gıda güvenliği kılavuzlarına
            uyun.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>6. Sorumluluk Reddi</Text>
          <Text style={styles.body}>
            Food Roulette, uygulamanın kullanılmasından kaynaklanan doğrudan
            veya dolaylı zararlardan sorumlu değildir. Uygulama "olduğu gibi"
            sunulmaktadır.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>7. Hizmet Sonlandırılması</Text>
          <Text style={styles.body}>
            Food Roulette, herhangi bir nedenle hizmetin sunumunu herhangi bir
            anda sonlandırma hakkını saklı tutar. Kullanıcılar bu durumdan
            haberdar edilecektir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>8. Değişiklikler</Text>
          <Text style={styles.body}>
            Bu şartlar önceden haber verilmeksizin değiştirilebilir. Önemli
            değişiklikleri kullanıcılara bildirilecektir.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.lastUpdated}>
            Son güncelleme: Ocak 2024
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
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 22,
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
