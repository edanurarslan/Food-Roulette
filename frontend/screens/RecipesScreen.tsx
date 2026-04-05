/**
 * RecipesScreen - Tarifler Sayfası
 * Tüm tarifler grid/list şeklinde, arama ve filtreler
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiService } from '../services/api';

type RootStackParamList = {
  RecipesMain: undefined;
  RecipeDetail: { recipeId: number; recipeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'RecipesMain'>;

interface Recipe {
  id: number;
  name: string;
  emoji?: string;
  category: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  cook_time: number;
  difficulty?: string;
  servings?: number;
  calories?: number;
}

const emojis = ['🍕', '🍝', '🍜', '🍲', '🌮', '🍱', '🥘', '🍛', '🥗', '🍗', '🍖', '🥩'];

export const RecipesScreen: React.FC<Props> = ({ navigation }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const categories = ['Tümü', 'Çorba', 'Ana Yemek', 'Kahvaltı', 'Ara Öğün', 'Yan Yemek'];

  useEffect(() => {
    loadRecipes();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, recipes]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRecipes(undefined, undefined, 0, 50);

      if (response && Array.isArray(response)) {
        const recipesWithEmoji = response.map((recipe: any, index: number) => ({
          ...recipe,
          emoji: recipe.emoji || emojis[index % emojis.length],
        }));
        setRecipes(recipesWithEmoji);
      }
    } catch (error) {
      console.error('Tarifler yüklenirken hata:', error);
      setRecipes([
        { id: 1, name: 'Pasta', emoji: '🍝', category: 'Ana Yemek', instructions: [], ingredients: ['Pasta', 'Sos'], cook_time: 20, difficulty: 'Kolay' },
        { id: 2, name: 'Çorba', emoji: '🍲', category: 'Çorba', instructions: [], ingredients: ['Su', 'Sebze'], cook_time: 30, difficulty: 'Kolay' },
        { id: 3, name: 'Salata', emoji: '🥗', category: 'Yan Yemek', instructions: [], ingredients: ['Sebze', 'Zeytin yağı'], cook_time: 10, difficulty: 'Kolay' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = recipes;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'Tümü') {
      filtered = filtered.filter(r =>
        r.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', {
      recipeId: recipe.id,
      recipeName: recipe.name,
    });
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#f0fdf7', '#dbeafe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Emoji */}
          <Text style={styles.cardEmoji}>{item.emoji || '🍽️'}</Text>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          {/* Meta Info */}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>⏱️</Text>
              <Text style={styles.metaValue}>{item.cook_time} dk</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>📊</Text>
              <Text style={styles.metaValue}>{item.difficulty || 'Orta'}</Text>
            </View>
          </View>

          {/* View Button */}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleRecipePress(item)}
          >
            <Text style={styles.viewButtonText}>Tarifi Gör</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyText}>Tarif bulunamadı</Text>
      <Text style={styles.emptySubtext}>Arama kriterlerinizi değiştirmeyi deneyin</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>📖 Tarifler</Text>
          <Text style={styles.headerSubtitle}>Tüm tariflerimizi keşfet</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Tarifler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📖 Tarifler</Text>
        <Text style={styles.headerSubtitle}>Tüm tariflerimizi keşfet</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tarif ara..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            nestedScrollEnabled={true}
            decelerationRate="fast"
            data={categories}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterContent}
            renderItem={({ item: category }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.filterButtonActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCategory === category && styles.filterButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            ✨ {filteredRecipes.length} tarif bulundu
          </Text>
        </View>

        {/* Recipes Grid */}
        <FlatList
          scrollEnabled={false}
          data={filteredRecipes}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridWrapper}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.gridContainer}
        />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 18,
    color: '#9CA3AF',
    paddingLeft: 8,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  resultsInfo: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369A1',
    textAlign: 'center',
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridWrapper: {
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  recipeCard: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 3,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 240,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaLabel: {
    fontSize: 12,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});
