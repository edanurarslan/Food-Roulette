/**
 * PrivacyPolicyScreen - Gizlilik Politikası Ekranı
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

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.title}>1. Bilgilendirme</Text>
          <Text style={styles.body}>
            Food Roulette uygulaması, gizliliğinize değer verir. Bu politika,
            verilerinizin nasıl toplandığı, kullanıldığı ve korunduğunu açıklar.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>2. Toplanan Bilgiler</Text>
          <Text style={styles.body}>
            Hesap oluşturma sırasında ad, e-posta ve şifre gibi kişisel bilgiler
            toplanır. Ayrıca uygulama kullanımınız hakkında veriler otomatik olarak
            kaydedilebilir (tarayıcı tipi, cihaz, konum vb.).
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>3. Verilerin Kullanımı</Text>
          <Text style={styles.body}>
            Toplanan veriler aşağıdaki amaçlarla kullanılır: hesap yönetimi,
            hizmet iyileştirilmesi, istatistiksel analiz ve güvenlik.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>4. Veri Paylaşımı</Text>
          <Text style={styles.body}>
            Kişisel bilgileriniz üçüncü taraflarla izniniz olmadan
            paylaşılmayacaktır. Ancak yasal zorunluluklar nedeniyle veriler
            açıklanabilir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>5. Güvenlik Önlemleri</Text>
          <Text style={styles.body}>
            Verileriniz şifreleme ve diğer güvenlik teknikleri ile korunur.
            Ancak internet üzerinde hiçbir yöntem %100 güvenli değildir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>6. Çerezler ve İzleme</Text>
          <Text style={styles.body}>
            Uygulama, kullanıcı deneyimini iyileştirmek için çerezler
            kullanabilir. Bu tercihleriniz istediğiniz zaman değiştirebilirsiniz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>7. Çocukların Gizliliği</Text>
          <Text style={styles.body}>
            Food Roulette 13 yaş üstü kullanıcılar için tasarlanmıştır.
            13 yaş altı kullanıcıların hesaplarının ebeveyn izni olmadan
            açılmaması gerekmektedir.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>8. Haklarınız</Text>
          <Text style={styles.body}>
            Verileriniz hakkında bilgi talep etme, düzeltme, silme veya
            taşınabilirlik haklarına sahipsiniz. Bu haklarınızı kullanmak için
            iletişim bilgileriyle bize ulaşabilirsiniz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>9. Bağlantılar</Text>
          <Text style={styles.body}>
            Uygulama, üçüncü taraf web sitelerine bağlantılar içerebilir.
            Bu sitelerin gizlilik politikalarından sorumlu değiliz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>10. Politika Değişiklikleri</Text>
          <Text style={styles.body}>
            Bu gizlilik politikası, önceden haber verilmeksizin değiştirilebilir.
            Değişikliklerin yürürlüğe girmesinden sonra uygulamayı kullanmaya
            devam etmek, yeni şartları kabul anlamına gelir.
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
