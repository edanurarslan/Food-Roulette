/**
 * FavoritesScreen - Beğenilmiş Tarifler
 * LocalStorage'dan favori tarifler yükle, sıralama özelliği
 * Kalp butonuyla kaydedilen favorileri gösterir
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

type RootStackParamList = {
  FavoritesMain: undefined;
  RecipeDetail: { recipeId: number; recipeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'FavoritesMain'>;

interface Recipe {
  id: number;
  name: string;
  emoji?: string;
  category: string;
  description?: string;
  cook_time: number;
  difficulty?: string;
  servings?: number;
  calories?: number;
  addedAt?: number;
}

interface FavoriteItem {
  recipeId: number;
  addedAt: number;
}

export const FavoritesScreen: React.FC<Props> = ({ navigation }) => {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'difficulty'>('recent');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['Tümü']));
  const [categories, setCategories] = useState<string[]>(['Tümü']);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      
      // Load favorite recipe IDs from LocalStorage (simple array or complex objects)
      const favoritesData = await AsyncStorage.getItem('favorites');
      let favoriteIds: number[] = [];
      let favoritesMap: { [key: number]: number } = {}; // recipeId -> addedAt

      if (favoritesData) {
        const parsed = JSON.parse(favoritesData);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 && typeof parsed[0] === 'object') {
            // Complex format: [{recipeId: 1, addedAt: timestamp}, ...]
            favoriteIds = parsed.map((f: any) => f.recipeId || f.id || f);
            parsed.forEach((f: any) => {
              favoritesMap[f.recipeId || f.id || f] = f.addedAt || Date.now();
            });
          } else {
            // Simple format: [1, 2, 3, ...]
            favoriteIds = parsed;
            parsed.forEach((id: number) => {
              favoritesMap[id] = Date.now();
            });
          }
        }
      }

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setFilteredFavorites([]);
        setCategories(['Tümü']);
        setLoading(false);
        return;
      }

      // Fetch recipe details from API for each favorite ID
      const response = await apiService.getRecipes(undefined, undefined, 0, 100);
      if (response && Array.isArray(response)) {
        const favoritesRecipes = response.filter(r => favoriteIds.includes(r.id));
        
        const enrichedFavorites = favoritesRecipes.map(recipe => ({
          ...recipe,
          addedAt: favoritesMap[recipe.id] || Date.now(),
        }));
        
        setFavorites(enrichedFavorites);
        applyFilters(enrichedFavorites);
        
        // Extract unique categories
        const uniqueCategories = ['Tümü', ...new Set(enrichedFavorites.map(r => r.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (recipesToFilter: Recipe[] = favorites) => {
    let filtered = recipesToFilter;
    
    // Category filter - support multiple categories
    if (!selectedCategories.has('Tümü')) {
      filtered = filtered.filter(r => selectedCategories.has(r.category));
    }
    
    // Sort
    let sorted = [...filtered];
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      case 'difficulty':
        const difficultyOrder = { 'Kolay': 1, 'Orta': 2, 'Zor': 3 };
        sorted.sort((a, b) => 
          (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2) - 
          (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2)
        );
        break;
    }
    
    setFilteredFavorites(sorted);
  };

  const handleRemoveFavorite = (recipeId: number, recipeName: string) => {
    Alert.alert(
      'Favorilerden Çıkar',
      `"${recipeName}" favorilerinden çıkarmak istediğinize emin misiniz?`,
      [
        { text: 'İptal', onPress: () => {} },
        {
          text: 'Evet, Çıkar',
          onPress: async () => {
            try {
              console.log(`Removing recipe ${recipeId} from favorites...`);
              
              // Remove from LocalStorage
              const favoritesData = await AsyncStorage.getItem('favorites');
              if (favoritesData) {
                const parsed = JSON.parse(favoritesData);
                let updated: any[];
                
                if (Array.isArray(parsed)) {
                  if (parsed.length > 0 && typeof parsed[0] === 'object') {
                    // Complex format: remove by recipeId field
                    updated = parsed.filter((f: any) => (f.recipeId || f.id || f) !== recipeId);
                  } else {
                    // Simple format: just filter out the ID
                    updated = parsed.filter((id: number) => id !== recipeId);
                  }
                  
                  console.log(`Before: ${parsed.length} items, After: ${updated.length} items`);
                  await AsyncStorage.setItem('favorites', JSON.stringify(updated || []));
                }
              }
              
              // Update state - remove from favorites list
              const updatedFavorites = favorites.filter(f => f.id !== recipeId);
              setFavorites(updatedFavorites);
              
              // Reapply filters with updated list
              let filtered = updatedFavorites;
              if (!selectedCategories.has('Tümü')) {
                filtered = filtered.filter(r => selectedCategories.has(r.category));
              }
              
              let sorted = [...filtered];
              switch (sortBy) {
                case 'recent':
                  sorted.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
                  break;
                case 'name':
                  sorted.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
                  break;
                case 'difficulty':
                  const difficultyOrder = { 'Kolay': 1, 'Orta': 2, 'Zor': 3 };
                  sorted.sort((a, b) => 
                    (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2) - 
                    (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2)
                  );
                  break;
              }
              setFilteredFavorites(sorted);
              
              Alert.alert('Başarılı', `${recipeName} favorilerden çıkarıldı`);
            } catch (error) {
              Alert.alert('Hata', 'Favoriden çıkarmada hata oluştu');
              console.error('Remove favorite error:', error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', {
      recipeId: recipe.id,
      recipeName: recipe.name,
    });
  };

  // Update filters when sort or category changes
  React.useEffect(() => {
    applyFilters();
  }, [sortBy, selectedCategories, favorites]);

  const renderFavoriteCard = ({ item }: { item: Recipe }) => (
    <View style={styles.favoriteCard}>
      <LinearGradient
        colors={['#fff5e6', '#ffe6cc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleRecipePress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{item.emoji || '🍽️'}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.cardCategory}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.metaItem}>⏱️ {item.cook_time} dk</Text>
            <Text style={styles.metaItem}>📊 {item.difficulty || 'Orta'}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleRecipePress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewButtonText}>Tarifi Aç →</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Remove button - overlays on top */}
        <TouchableOpacity
          style={styles.removeButtonInside}
          onPress={() => {
            console.log('Remove button pressed for recipe:', item.id, item.name);
            handleRemoveFavorite(item.id, item.name);
          }}
          activeOpacity={0.5}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>💔</Text>
      <Text style={styles.emptyText}>Henüz favori tarif yok</Text>
      <Text style={styles.emptySubtext}>Beğendiğin tarifler burada gösterilecek</Text>
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
          <Text style={styles.headerTitle}>❤️ Favorilerim</Text>
          <Text style={styles.headerSubtitle}>Beğendiğim tarifler</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Favoriler yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>❤️ Favorilerim</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length} tarif kaydedildi
        </Text>
      </LinearGradient>

      {favorites.length > 0 && (
        <>
          {/* Category Filter */}
          <View style={styles.categoryFilterContainer}>
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
                    styles.categoryFilterButton,
                    selectedCategories.has(category) && styles.categoryFilterButtonActive,
                  ]}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.categoryFilterButtonText,
                      selectedCategories.has(category) && styles.categoryFilterButtonTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Sort Buttons */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sırala:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'recent' && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy('recent')}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'recent' && styles.sortButtonTextActive,
                  ]}
                >
                  En Yeni
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'name' && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy('name')}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'name' && styles.sortButtonTextActive,
                  ]}
                >
                  İsim
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'difficulty' && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy('difficulty')}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === 'difficulty' && styles.sortButtonTextActive,
                  ]}
                >
                  Zorluk
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <FlatList
          scrollEnabled={false}
          data={filteredFavorites}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
        />
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
    paddingTop: 50,
    paddingBottom: 24,
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
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 0,
    gap: 6,
  },
  categoryFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  categoryFilterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryFilterButtonTextActive: {
    color: '#FFF',
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listContainer: {
    gap: 10,
  },
  favoriteCard: {
    borderRadius: 10,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 2,
    position: 'relative',
  },
  cardTouchable: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardContent: {
    width: '100%',
  },
  cardContentWrapper: {
    width: '100%',
  },
  cardGradient: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardEmoji: {
    fontSize: 32,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonInside: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 8,
  },
  removeButtonAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 5,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  cardCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#10B981',
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metaItem: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 13,
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
    textAlign: 'center',
  },
});
