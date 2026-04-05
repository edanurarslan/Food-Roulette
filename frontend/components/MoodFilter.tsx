import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type MoodType = 'Tümü' | 'Hızlı' | 'Tok' | 'Hafif' | 'Sağlıklı';

interface MoodFilterProps {
  selectedMood: MoodType;
  onSelectMood: (mood: MoodType) => void;
}

export const MoodFilter: React.FC<MoodFilterProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  const moods: { name: MoodType; emoji: string; description: string }[] = [
    { name: 'Tümü', emoji: '🎯', description: 'Hepsi' },
    { name: 'Hızlı', emoji: '⚡', description: '<20 dk' },
    { name: 'Tok', emoji: '💪', description: 'Doyurucu' },
    { name: 'Hafif', emoji: '🌿', description: '<250 kcal' },
    { name: 'Sağlıklı', emoji: '🥗', description: 'Düşük yağ' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✨ Mod Seç</Text>
      </View>

      <FlatList
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        decelerationRate="fast"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        data={moods}
        keyExtractor={(item) => item.name}
        renderItem={({ item: mood }) => (
          <TouchableOpacity
            onPress={() => onSelectMood(mood.name)}
            style={styles.moodButton}
            activeOpacity={0.7}
          >
            {selectedMood === mood.name ? (
              <LinearGradient
                colors={['#A855F7', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.moodActive}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodName}>{mood.name}</Text>
                <Text style={styles.moodDesc}>{mood.description}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.moodInactive}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodName}>{mood.name}</Text>
                <Text style={styles.moodDesc}>{mood.description}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  scroll: {
    paddingHorizontal: 12,
  },
  scrollContent: {
    paddingRight: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  moodButton: {
    marginRight: 4,
  },
  moodActive: {
    width: 100,
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  moodInactive: {
    width: 100,
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#F3F4F6',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  moodDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
  },
});
