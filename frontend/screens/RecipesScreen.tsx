/**
 * RecipesScreen - Tarifler Sayfası
 * 4-Level Filtering System: Malzeme → Kategori → Mood → Arama
 * LocalStorage Integration für Favorites & History
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
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  fat?: number;
}

interface FilterState {
  ingredients: string[];
  category: string;
  mood: string | null;
  searchQuery: string;
}

const emojis = ['🍕', '🍝', '🍜', '🍲', '🌮', '🍱', '🥘', '🍛', '🥗', '🍗', '🍖', '🥩'];
const moodOptions = [
  { label: 'Hızlı', icon: '⚡', maxTime: 20 },
  { label: 'Tok', icon: '🍖', minCalories: 350 },
  { label: 'Hafif', icon: '🥗', maxCalories: 250 },
  { label: 'Sağlıklı', icon: '💚', maxFat: 15 },
];

export const RecipesScreen: React.FC<Props> = ({ navigation }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Filter States - Level 1 to 4
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['Tümü']));
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const categories = ['Tümü', 'Çorba', 'Ana Yemek', 'Kahvaltı', 'Ara Öğün', 'Yan Yemek'];

  useEffect(() => {
    loadRecipesAndFavorites();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    applyMultiLevelFilters();
  }, [selectedIngredients, selectedCategories, selectedMood, searchQuery, recipes]);

  const loadRecipesAndFavorites = async () => {
    try {
      setLoading(true);
      
      // Load recipes from API
      const response = await apiService.getRecipes(undefined, undefined, 0, 50);
      if (response && Array.isArray(response)) {
        const recipesWithEmoji = response.map((recipe: any, index: number) => ({
          ...recipe,
          emoji: recipe.emoji || emojis[index % emojis.length],
        }));
        setRecipes(recipesWithEmoji);
      }

      // Load favorites from LocalStorage
      const favs = await AsyncStorage.getItem('favorites');
      if (favs) {
        setFavorites(JSON.parse(favs));
      }
    } catch (error) {
      console.error('Tarifler yüklenirken hata:', error);
      setRecipes([
        { id: 1, name: 'Tavuk Pilav', emoji: '�', category: 'Ana Yemek', instructions: [], ingredients: ['Tavuk', 'Pirinç'], cook_time: 25, difficulty: 'Kolay', calories: 420, fat: 8 },
        { id: 2, name: 'Sebze Çorbası', emoji: '🍲', category: 'Çorba', instructions: [], ingredients: ['Sebze', 'Su'], cook_time: 20, difficulty: 'Kolay', calories: 120, fat: 2 },
        { id: 3, name: 'Salatà Yeşil', emoji: '🥗', category: 'Yan Yemek', instructions: [], ingredients: ['Marul', 'Domates'], cook_time: 5, difficulty: 'Kolay', calories: 80, fat: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // LEVEL 1: Malzeme Filtresi
  const getIngredientsFromRecipes = () => {
    const allIngredients = new Set<string>();
    recipes.forEach(r => {
      if (Array.isArray(r.ingredients)) {
        r.ingredients.forEach(ing => allIngredients.add(ing.trim()));
      }
    });
    return Array.from(allIngredients).sort();
  };

  const matchesIngredients = (recipe: Recipe): boolean => {
    if (selectedIngredients.length === 0) return true;
    
    const recipeIngredientsLower = recipe.ingredients.map(i => i.toLowerCase());
    return selectedIngredients.some(ingredient => 
      recipeIngredientsLower.some(recIng => recIng.includes(ingredient.toLowerCase()))
    );
  };

  // LEVEL 2: Kategori Filtresi
  const matchesCategory = (recipe: Recipe): boolean => {
    if (selectedCategories.has('Tümü')) return true;
    
    return Array.from(selectedCategories).some(category => 
      recipe.category?.toLowerCase() === category.toLowerCase()
    );
  };

  // LEVEL 3: Mood Filtresi
  const matchesMood = (recipe: Recipe): boolean => {
    if (!selectedMood) return true;
    
    const mood = moodOptions.find(m => m.label === selectedMood);
    if (!mood) return true;

    if (selectedMood === 'Hızlı') {
      return (recipe.cook_time || 0) <= mood.maxTime!;
    }
    if (selectedMood === 'Tok') {
      return (recipe.calories || 0) >= mood.minCalories!;
    }
    if (selectedMood === 'Hafif') {
      return (recipe.calories || 0) < mood.maxCalories!;
    }
    if (selectedMood === 'Sağlıklı') {
      return (recipe.fat || 0) < mood.maxFat!;
    }
    return true;
  };

  // LEVEL 4: Arama Filtresi
  const matchesSearch = (recipe: Recipe): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return recipe.name.toLowerCase().includes(query);
  };

  // Apply all 4 levels of filters
  const applyMultiLevelFilters = () => {
    let filtered = recipes
      .filter(r => matchesIngredients(r))
      .filter(r => matchesCategory(r))
      .filter(r => matchesMood(r))
      .filter(r => matchesSearch(r));

    setFilteredRecipes(filtered);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', {
      recipeId: recipe.id,
      recipeName: recipe.name,
    });
  };

  const toggleFavorite = async (recipeId: number) => {
    try {
      const newFavorites = favorites.includes(recipeId)
        ? favorites.filter(id => id !== recipeId)
        : [...favorites, recipeId];
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Favoriler kaydedilirken hata:', error);
    }
  };

  const renderRecipeCard = ({ item }: { item: Recipe }) => {
    const isFavorite = favorites.includes(item.id);
    
    return (
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
          {/* Card Header with Favorite Button */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{item.emoji || '🍽️'}</Text>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Text style={{ fontSize: 16 }}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>

          {/* Title - Compact */}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          {/* Meta Info - Compressed */}
          <View style={styles.cardMeta}>
            <View style={styles.metaItemRow}>
              <Text style={styles.metaValue}>⏱️ {item.cook_time}dk</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItemRow}>
              <Text style={styles.metaValue}>📊 {item.difficulty || 'Orta'}</Text>
            </View>
            {item.calories && (
              <>
                <View style={styles.metaDivider} />
                <View style={styles.metaItemRow}>
                  <Text style={styles.metaValue}>🔥 {item.calories}kcal</Text>
                </View>
              </>
            )}
          </View>

          {/* View Button */}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleRecipePress(item)}
          >
            <Text style={styles.viewButtonText}>Tarifi Gör →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyText}>Tarif bulunamadı</Text>
      <Text style={styles.emptySubtext}>
        {selectedIngredients.length > 0 || selectedMood || searchQuery
          ? 'Filtre kriterlerinizi değiştirmeyi deneyin'
          : 'Tarifler yükleniyor...'}
      </Text>
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

        {/* Category Filter - LEVEL 2 */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>🏷️ Kategori:</Text>
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
                onPress={() => {
                  const newCategories = new Set(selectedCategories);
                  
                  if (category === 'Tümü') {
                    newCategories.clear();
                    newCategories.add('Tümü');
                  } else {
                    newCategories.delete('Tümü');
                    
                    if (newCategories.has(category)) {
                      newCategories.delete(category);
                    } else {
                      newCategories.add(category);
                    }
                    
                    if (newCategories.size === 0) {
                      newCategories.add('Tümü');
                    }
                  }
                  
                  setSelectedCategories(newCategories);
                }}
                style={[
                  styles.filterButton,
                  selectedCategories.has(category) && styles.filterButtonActive,
                ]}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCategories.has(category) && styles.filterButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Advanced Filters Button */}
        <View style={styles.advancedFilterBar}>
          <TouchableOpacity
            style={[
              styles.filterIconButton,
              (selectedIngredients.length > 0 || selectedMood) && styles.filterIconButtonActive,
            ]}
            onPress={() => setShowAdvancedFilters(true)}
            activeOpacity={0.6}
          >
            <Text style={styles.filterIconText}>
              ⚙️ {selectedIngredients.length > 0 || selectedMood ? '●' : ''} Filtreler
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Info - Show filtering status */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            ✨ {filteredRecipes.length} tarif
            {selectedIngredients.length > 0 && ` • 🥘 ${selectedIngredients.length} malzeme`}
            {selectedMood && ` • ${selectedMood === 'Hızlı' ? '⚡' : selectedMood === 'Tok' ? '🍖' : selectedMood === 'Hafif' ? '🥗' : '💚'} ${selectedMood}`}
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

      {/* Advanced Filters Modal */}
      <Modal
        visible={showAdvancedFilters}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity 
              onPress={() => setShowAdvancedFilters(false)}
              activeOpacity={0.6}
            >
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtreler</Text>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* LEVEL 1: Ingredients Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>🥘 Evde Hangi Malzemeler Var?</Text>
              <Text style={styles.filterSectionSubtitle}>Seçtiğiniz malzemeleri içeren tarifler listelenir.</Text>
              <View style={styles.ingredientGrid}>
                {getIngredientsFromRecipes().map((ingredient) => (
                  <TouchableOpacity
                    key={ingredient}
                    style={[
                      styles.ingredientChip,
                      selectedIngredients.includes(ingredient) && styles.ingredientChipActive,
                    ]}
                    onPress={() => {
                      setSelectedIngredients(
                        selectedIngredients.includes(ingredient)
                          ? selectedIngredients.filter(i => i !== ingredient)
                          : [...selectedIngredients, ingredient]
                      );
                    }}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.ingredientChipText,
                        selectedIngredients.includes(ingredient) && styles.ingredientChipTextActive,
                      ]}
                    >
                      {selectedIngredients.includes(ingredient) ? '✓ ' : ''}{ingredient}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* LEVEL 3: Mood Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>😋 Bugün Nasıl Hissediyorsun?</Text>
              <Text style={styles.filterSectionSubtitle}>Ruh haline veya zamanına uygun tarifleri bul.</Text>
              <View style={styles.moodGrid}>
                {moodOptions.map((mood) => (
                  <TouchableOpacity
                    key={mood.label}
                    style={[
                      styles.moodButton,
                      selectedMood === mood.label && styles.moodButtonActive,
                    ]}
                    onPress={() => setSelectedMood(selectedMood === mood.label ? null : mood.label)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.moodIcon}>{mood.icon}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        selectedMood === mood.label && styles.moodLabelActive,
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Fixed Footer with Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSelectedIngredients([]);
                setSelectedMood(null);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.resetButtonText}>Temizle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={() => setShowAdvancedFilters(false)}
              activeOpacity={0.6}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.applyFilterGradient}
              >
                <Text style={styles.applyFilterText}>Filtrele ({filteredRecipes.length} Sonuç)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  clearButton: {
    fontSize: 16,
    color: '#9CA3AF',
    paddingLeft: 6,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginHorizontal: 12,
    marginBottom: 6,
  },
  filterContent: {
    paddingHorizontal: 8,
    gap: 6,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  advancedFilterBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterIconButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterIconButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#0369A1',
  },
  filterIconText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  resultsInfo: {
    backgroundColor: '#DBEAFE',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    textAlign: 'center',
  },
  gridContainer: {
    paddingHorizontal: 6,
    paddingBottom: 20,
    paddingTop: 8,
  },
  gridWrapper: {
    justifyContent: 'space-around',
    gap: 10,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  recipeCard: {
    flex: 1,
    maxWidth: '49%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 3,
    minHeight: 280,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  cardContent: {
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 240,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 4,
  },
  cardEmoji: {
    fontSize: 32,
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 5,
    alignSelf: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 0,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 5,
    paddingHorizontal: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 5,
  },
  metaItemRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  metaDivider: {
    width: 0.8,
    height: 18,
    backgroundColor: '#D1D5DB',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewButton: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    width: '100%',
    alignItems: 'center',
    marginTop: 2,
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
  // Modal Styles for Advanced Filters
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  modalCloseIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  filterSectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  ingredientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ingredientChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  ingredientChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  ingredientChipTextActive: {
    color: '#FFF',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  moodButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#10B981',
  },
  moodIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  moodLabelActive: {
    color: '#10B981',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
    gap: 12,
  },
  resetButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  applyFilterButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyFilterGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
