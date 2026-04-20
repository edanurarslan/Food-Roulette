/**
 * HistoryScreen - Tarif Geçmişi
 * LocalStorage'dan tarih kaydı yükle, son 20 tarif
 * Otomatik olarak RecipeDetail sayfasını ziyaret ettiğinde kaydedilir
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
  HistoryMain: undefined;
  RecipeDetail: { recipeId: number; recipeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'HistoryMain'>;

interface HistoryRecipe {
  id: number;
  name: string;
  emoji?: string;
  category: string;
  cook_time: number;
  difficulty?: string;
  viewedAt: number;
  viewCount: number;
}

interface HistoryItem {
  recipeId: number;
  viewedAt: number;
  viewCount: number;
}

const MAX_HISTORY_ITEMS = 20;

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [history, setHistory] = useState<HistoryRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set(['Tümü']));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const categories = ['Tümü', 'Çorba', 'Ana Yemek', 'Kahvaltı', 'Ara Öğün', 'Yan Yemek'];

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Load history from LocalStorage
      const historyData = await AsyncStorage.getItem('history');
      const historyItems: HistoryItem[] = historyData ? JSON.parse(historyData) : [];

      if (historyItems.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Fetch recipe details from API
      const response = await apiService.getRecipes(undefined, undefined, 0, 100);
      if (response && Array.isArray(response)) {
        const historyRecipes = response
          .filter(r => historyItems.some(h => h.recipeId === r.id))
          .map(recipe => {
            const historyItem = historyItems.find(h => h.recipeId === recipe.id);
            return {
              ...recipe,
              viewedAt: historyItem?.viewedAt || Date.now(),
              viewCount: historyItem?.viewCount || 1,
            };
          })
          // Sort by most recently viewed first
          .sort((a, b) => b.viewedAt - a.viewedAt);

        setHistory(historyRecipes);
      }
    } catch (error) {
      console.error('Geçmiş yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromHistory = async (recipeId: number, recipeName: string) => {
    Alert.alert(
      'Geçmişten Sil',
      `"${recipeName}" geçmişten silinsin mi?`,
      [
        { text: 'İptal', onPress: () => {} },
        {
          text: 'Sil',
          onPress: async () => {
            try {
              // Remove from LocalStorage
              const historyData = await AsyncStorage.getItem('history');
              const historyItems: HistoryItem[] = historyData ? JSON.parse(historyData) : [];
              const updated = historyItems.filter(h => h.recipeId !== recipeId);
              await AsyncStorage.setItem('history', JSON.stringify(updated));
              
              // Update state - history'den kaldır
              const updatedHistory = history.filter(h => h.id !== recipeId);
              setHistory(updatedHistory);
              
              console.log(`Recipe removed: ${recipeName}. Remaining: ${updatedHistory.length} items`);
              Alert.alert('Başarılı', `${recipeName} geçmişten silindi`);
            } catch (error) {
              Alert.alert('Hata', 'Geçmişten silinirken hata oluştu');
              console.error('Remove from history error:', error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearHistory = () => {
    console.log('handleClearHistory called - Alert will be shown');
    Alert.alert(
      'Tüm Geçmişi Sil',
      'Bütün tarih kaydları silinecek. Emin misiniz?',
      [
        { text: 'İptal', onPress: () => { console.log('Clear canceled'); } },
        {
          text: 'Sil',
          onPress: async () => {
            console.log('Clear confirmed - Starting deletion process');
            try {
              // 1. AsyncStorage'den sil
              await AsyncStorage.removeItem('history');
              console.log('History cleared from AsyncStorage');
              
              // 2. State'i güncelle
              setHistory([]);
              console.log('State updated - history set to empty array');
              
              // 3. Backend'de clear history endpoint'i varsa çağır
              try {
                await apiService.clearHistory();
                console.log('Backend history cleared');
              } catch (apiError) {
                console.log('Backend clear history not available or failed:', apiError);
                // Backend sonucu başarısız olsa da local geçmiş silinmiş
              }
              
              // 4. Success mesajı göster
              Alert.alert('Başarılı', 'Tüm geçmiş silindi');
            } catch (error) {
              console.error('Clear history error:', error);
              Alert.alert('Hata', 'Geçmiş silinirken hata oluştu');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleRecipePress = (recipe: HistoryRecipe) => {
    navigation.navigate('RecipeDetail', {
      recipeId: recipe.id,
      recipeName: recipe.name,
    });
  };

  const getFilteredHistory = () => {
    if (filterCategories.has('Tümü')) {
      return history;
    }
    // Kategorileri normalize et ve karşılaştır
    const normalized = history.filter(h => {
      const historyCategory = h.category?.trim().toLowerCase() || '';
      return Array.from(filterCategories).some(cat =>
        (cat as string).trim().toLowerCase() === historyCategory
      );
    });
    console.log(`Filtering by: ${Array.from(filterCategories).join(', ')}, Found: ${normalized.length} items`);
    return normalized;
  };

  const renderHistoryCard = ({ item }: { item: HistoryRecipe }) => (
    <View style={styles.historyCard}>
      <LinearGradient
        colors={['#e0f2fe', '#cff0ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Main touchable content */}
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => handleRecipePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardEmoji}>{item.emoji || '🍽️'}</Text>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardCategory}>{item.category}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>⏱️ {item.cook_time} dk</Text>
              <Text style={styles.metaText}>📊 {item.difficulty || 'Orta'}</Text>
              {item.viewCount && <Text style={styles.metaText}>👁️ {item.viewCount}x</Text>}
            </View>
            <TouchableOpacity
              style={styles.viewArrow}
              onPress={() => handleRecipePress(item)}
              activeOpacity={0.6}
            >
              <Text style={styles.viewArrowText}>→</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Delete button - absolute positioned */}
        <TouchableOpacity
          style={styles.deleteButtonAbsolute}
          onPress={() => {
            console.log('Delete button pressed for recipe:', item.id, item.name);
            handleRemoveFromHistory(item.id, item.name);
          }}
          activeOpacity={0.5}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyText}>Tarih kaydı yok</Text>
      <Text style={styles.emptySubtext}>Çevirdiğiniz tarifler burada görülecek</Text>
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
          <Text style={styles.headerTitle}>🕐 Tarih</Text>
          <Text style={styles.headerSubtitle}>Daha önce çevirilen tarifler</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Geçmiş yükleniyor...</Text>
        </View>
      </View>
    );
  }

  const filteredHistory = getFilteredHistory();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🕐 Tarih</Text>
        <Text style={styles.headerSubtitle}>
          {history.length} tarif çevirildi
        </Text>
      </LinearGradient>

      {history.length > 0 && (
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
                onPress={() => {
                  const newCategories = new Set(filterCategories);
                  
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
                  
                  setFilterCategories(newCategories);
                }}
                style={[
                  styles.filterButton,
                  filterCategories.has(category) && styles.filterButtonActive,
                ]}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filterCategories.has(category) && styles.filterButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <FlatList
          scrollEnabled={false}
          data={filteredHistory}
          renderItem={renderHistoryCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={1}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContainer}
        />
      </ScrollView>

      {history.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              console.log('Clear History button pressed');
              handleClearHistory();
            }}
            activeOpacity={0.6}
          >
            <Text style={styles.clearButtonText}>🗑️ Tüm Geçmişi Sil</Text>
          </TouchableOpacity>
        </View>
      )}
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
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  listContainer: {
    gap: 10,
  },
  historyCard: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  cardGradient: {
    padding: 10,
    position: 'relative',
  },
  cardContent: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardCategory: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  metaText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  viewArrow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewArrowText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
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
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clearButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
