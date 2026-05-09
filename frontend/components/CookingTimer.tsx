/**
 * CookingTimer - Advanced Cooking Timer Component
 * Preset times, progress visualization, multiple alarms
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CookingTimerProps {
  recipeName: string;
  defaultMinutes?: number;
  onTimerEnd?: () => void;
  onNotification?: (message: string) => Promise<void>;
}

const PRESET_TIMES = [5, 10, 15, 20, 30, 45, 60]; // dakika cinsinden

export const CookingTimer: React.FC<CookingTimerProps> = ({
  recipeName,
  defaultMinutes = 20,
  onTimerEnd,
  onNotification,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState(String(defaultMinutes));
  const [totalSeconds, setTotalSeconds] = useState(defaultMinutes * 60);
  const [timerFinished, setTimerFinished] = useState(false);

  const endTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Format time: MM:SS or HH:MM:SS
  const formatTime = useCallback((totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Progress percentage
  const progressPercent = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0;

  // Timer tick effect
  useEffect(() => {
    if (!isRunning) return;

    timerIntervalRef.current = setInterval(() => {
      if (endTimeRef.current) {
        const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setRemainingSeconds(left);

        if (left === 0) {
          finishTimer();
        }
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  const finishTimer = useCallback(async () => {
    setIsRunning(false);
    endTimeRef.current = null;
    setTimerFinished(true);
    setRemainingSeconds(0);

    // Vibration
    try {
      Vibration.vibrate([0, 100, 100, 100], false);
    } catch (e) {
      console.warn('Vibration failed:', e);
    }

    // Notification
    if (onNotification) {
      await onNotification(`"${recipeName}" için zamanlayıcı bitti! ⏰`);
    }

    // Alert
    Alert.alert(
      '⏰ Süre Doldu!',
      `"${recipeName}" pişirme zamanı tamamlandı.`,
      [
        { text: 'Tamam', onPress: () => setTimerFinished(false) },
        {
          text: '5 dk Daha',
          onPress: () => {
            setTimerFinished(false);
            setInputMinutes('5');
            startTimerWithMinutes(5);
          },
        },
      ]
    );

    onTimerEnd?.();
  }, [recipeName, onTimerEnd, onNotification]);

  const startTimerWithMinutes = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setInputMinutes(String(minutes));
    endTimeRef.current = Date.now() + seconds * 1000;
    setIsRunning(true);
    setTimerFinished(false);
    console.log(`⏱️ Timer başlatıldı: ${minutes} dakika`);
  }, []);

  const startTimer = () => {
    let minutes = parseInt(inputMinutes, 10);
    if (!Number.isNaN(minutes) && minutes > 0) {
      startTimerWithMinutes(minutes);
    } else {
      Alert.alert('Hata', 'Lütfen geçerli bir sayı girin (dakika cinsinden)');
    }
  };

  const pauseTimer = () => {
    if (endTimeRef.current) {
      const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(left);
    }
    endTimeRef.current = null;
    setIsRunning(false);
    console.log(`⏸️ Timer duraklatıldı: ${formatTime(remainingSeconds)}`);
  };

  const resetTimer = () => {
    endTimeRef.current = null;
    setIsRunning(false);
    const minutes = parseInt(inputMinutes, 10) || defaultMinutes;
    const seconds = minutes * 60;
    setRemainingSeconds(seconds);
    setTotalSeconds(seconds);
    setTimerFinished(false);
    console.log(`🔄 Timer sıfırlandı: ${minutes} dakika`);
  };

  const handlePresetTime = (minutes: number) => {
    setInputMinutes(String(minutes));
    startTimerWithMinutes(minutes);
  };

  // Progress animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressAnim]);

  return (
    <View style={styles.container}>
      {/* Başlık */}
      <Text style={styles.title}>⏱️ Pişirme Zamanlayıcısı</Text>

      {/* Ana Timer Ekranı */}
      <View style={styles.timerDisplay}>
        <LinearGradient
          colors={
            timerFinished
              ? ['#EF4444', '#DC2626']
              : isRunning
              ? ['#3B82F6', '#1D4ED8']
              : ['#10B981', '#059669']
          }
          style={styles.timerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Progress Circle */}
          <View style={styles.progressRing}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  height: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Timer Text */}
          <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>

          {/* Tarif Adı */}
          <Text style={styles.recipeNameSmall}>{recipeName}</Text>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {timerFinished ? '✅ Tamamlandı' : isRunning ? '⏳ Çalışıyor' : '⏸️ Duraklatıldı'}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Input Bölümü - Sadece duraklatıldığında */}
      {!isRunning && (
        <View style={styles.inputSection}>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={inputMinutes}
              onChangeText={setInputMinutes}
              placeholder="Dakika"
              placeholderTextColor="#9CA3AF"
              editable={!isRunning}
              maxLength={3}
            />
            <Text style={styles.inputUnit}>dk</Text>
          </View>
        </View>
      )}

      {/* Preset Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.presetScroll}
        contentContainerStyle={styles.presetContainer}
      >
        {PRESET_TIMES.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            onPress={() => handlePresetTime(minutes)}
            style={[
              styles.presetBtn,
              parseInt(inputMinutes, 10) === minutes && styles.presetBtnActive,
            ]}
            disabled={isRunning}
          >
            <Text
              style={[
                styles.presetBtnText,
                parseInt(inputMinutes, 10) === minutes && styles.presetBtnTextActive,
              ]}
            >
              {minutes}
              {minutes >= 60 ? 's' : 'dk'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={isRunning ? pauseTimer : startTimer}
          style={[
            styles.mainBtn,
            isRunning ? styles.pauseBtn : styles.startBtn,
            timerFinished && styles.mainBtnDisabled,
          ]}
          disabled={timerFinished}
        >
          <Text style={styles.mainBtnIcon}>{isRunning ? '⏸️' : '▶️'}</Text>
          <Text style={styles.mainBtnText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={resetTimer}
          style={[styles.secondaryBtn, timerFinished && styles.secondaryBtnActive]}
          disabled={!isRunning && remainingSeconds === 0}
        >
          <Text style={styles.secondaryBtnText}>🔄 Sıfırla</Text>
        </TouchableOpacity>
      </View>

      {/* Info Text */}
      {timerFinished && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ✨ Pişirme zamanı tamamlandı! Yemeği sunmaya hazır mısın?
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  timerDisplay: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  timerGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFF',
    zIndex: 10,
    letterSpacing: 2,
  },
  recipeNameSmall: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 8,
  },
  presetScroll: {
    marginBottom: 16,
  },
  presetContainer: {
    gap: 8,
    paddingHorizontal: 0,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  presetBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  presetBtnTextActive: {
    color: '#FFF',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  mainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startBtn: {
    backgroundColor: '#10B981',
  },
  pauseBtn: {
    backgroundColor: '#F59E0B',
  },
  mainBtnDisabled: {
    opacity: 0.6,
  },
  mainBtnIcon: {
    fontSize: 18,
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  secondaryBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  infoText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
  },
});
