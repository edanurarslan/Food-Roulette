import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Category = 'Tümü' | 'Çorba' | 'Ana Yemek' | 'Kahvaltı' | 'Ara Öğün' | 'Yan Yemek';

interface CategoryFilterProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories: Category[] = [
    'Tümü',
    'Çorba',
    'Ana Yemek',
    'Kahvaltı',
    'Ara Öğün',
    'Yan Yemek',
  ];

  const categoryEmojis: Record<Category, string> = {
    'Tümü': '🍽️',
    'Çorba': '🍲',
    'Ana Yemek': '🍛',
    'Kahvaltı': '🍳',
    'Ara Öğün': '🥪',
    'Yan Yemek': '🥗',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏷️ Kategori</Text>
      </View>

      <FlatList
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        decelerationRate="fast"
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item: category }) => (
          <TouchableOpacity
            onPress={() => onSelectCategory(category)}
            style={styles.button}
            activeOpacity={0.7}
          >
            {selectedCategory === category ? (
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonActive}
              >
                <Text style={styles.emoji}>{categoryEmojis[category]}</Text>
                <Text style={[styles.buttonText, styles.buttonTextActive]}>
                  {category}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.buttonInactive}>
                <Text style={styles.emoji}>{categoryEmojis[category]}</Text>
                <Text style={styles.buttonText}>{category}</Text>
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
  button: {
    marginRight: 8,
  },
  buttonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  buttonTextActive: {
    color: '#FFF',
  },
  emoji: {
    fontSize: 16,
  },
});

