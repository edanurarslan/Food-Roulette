/**
 * RecipeDetailScreen - Tarif Detayları
 * Tarif bilgileri, malzemeler, adımlar, favori butonu
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

type RootStackParamList = {
  RecipeDetail: { recipeId: string; recipeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

// Mock recipe data
const mockRecipeData = {
  id: '1',
  name: 'Pasta Carbonara',
  emoji: '🍝',
  rating: 4.8,
  reviews: 234,
  servings: 4,
  cookTime: 20,
  difficulty: 'Kolay',
  description:
    'İtalya\'nın en ünlü pasta tariflerinden biri. Krema, peynir ve domuz eti ile yapılır.',
  ingredients: [
    { name: 'Spaghetti', amount: '400g' },
    { name: 'Guanciale (domuz eti)', amount: '200g' },
    { name: 'Pecorino Romano Peynir', amount: '100g' },
    { name: 'Yumurta', amount: '4 adet' },
    { name: 'Karabiber', amount: 'Tuz çiçeğine göre' },
    { name: 'Tuz', amount: 'Tat vermek için' },
  ],
  instructions: [
    'Tuzlu su kaynatan bir tencereyi ısıtın ve spagettini al dente oluncaya kadar pişirin.',
    'Guanciale\'i istif et ve kıcır kıcır oluncaya kadar pişirin.',
    'Yumurta, peynir ve karabiberi bir kapta karıştırın.',
    'Pasta pişerken, guanciale yağını 2 kaşık ayırın.',
    'Spagetti süzdükten sonra guanciale ve yağı ile karıştırın.',
    'Yumurta karışımını ekleyin ve hızlı bir şekilde karıştırın - kaynama noktası altında tutun.',
    'Tuzla tat verin ve sıcak servis edin.',
  ],
  isFavorite: false,
};

export const RecipeDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { recipeId, recipeName } = route.params;
  const [recipe, setRecipe] = useState(mockRecipeData);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fetch recipe from API and track viewing history
    loadRecipeDetails();
    trackHistory(parseInt(recipeId as string));
    
    // Screen fade-in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [recipeId]);

  const trackHistory = async (recipeId: number) => {
    try {
      // Get current history from LocalStorage
      const historyData = await AsyncStorage.getItem('history');
      const history = historyData ? JSON.parse(historyData) : [];

      // Check if recipe already in history
      const existingIndex = history.findIndex((h: any) => h.recipeId === recipeId);
      
      if (existingIndex !== -1) {
        // Move to top and increment view count
        const item = history.splice(existingIndex, 1)[0];
        item.viewedAt = Date.now();
        item.viewCount = (item.viewCount || 1) + 1;
        history.unshift(item);
      } else {
        // Add new item
        history.unshift({
          recipeId,
          viewedAt: Date.now(),
          viewCount: 1,
        });
      }

      // Keep only last 20 items
      const maxItems = history.slice(0, 20);
      await AsyncStorage.setItem('history', JSON.stringify(maxItems));
    } catch (error) {
      console.error('Tarih kaydedilirken hata:', error);
    }
  };

  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      // API'den tarif çek
      const response = await apiService.getRecipes(undefined, undefined, 0, 100);
      
      if (response && Array.isArray(response)) {
        // recipeId ile matching tarifi bul
        const foundRecipe = response.find((r: any) => r.id === parseInt(recipeId as string));
        
        if (foundRecipe) {
          setRecipe({
            id: foundRecipe.id,
            name: foundRecipe.name,
            emoji: foundRecipe.emoji || '🍽️',
            rating: 4.5,
            reviews: 100,
            servings: foundRecipe.servings || 4,
            cookTime: foundRecipe.cook_time || 30,
            difficulty: foundRecipe.difficulty || 'Orta',
            description: foundRecipe.description || 'Lezzetli bir tarif',
            ingredients: foundRecipe.ingredients.map((ing: string, idx: number) => ({
              name: ing,
              amount: `Miktar ${idx + 1}`,
            })) || [],
            instructions: foundRecipe.instructions || [],
            isFavorite: false,
          });
        }
      }
    } catch (error) {
      console.error('Tarif yüklenirken hata:', error);
      // Hata durumunda mock data kalacak
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);

    // Heart pop animation
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // API'ye kaydet
    try {
      const recipeId = typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id;
      if (newFavoriteState) {
        await apiService.addFavorite(recipeId);
      } else {
        await apiService.removeFavorite(recipeId);
      }
    } catch (error) {
      console.error('Favori güncellenirken hata:', error);
      // Hata durumunda state'i geri al
      setIsFavorite(!newFavoriteState);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${recipeName} tarifine bak! Food Roulette uygulamasında buldum.`,
        title: recipeName,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const heartScale = heartAnim.interpolate({
    inputRange: [1, 1.3],
    outputRange: [1, 1.3],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Tarif yükleniyor...</Text>
      </View>
    );
  }

  if (!recipe || !recipe.name) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Tarif bulunamadı</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
          <Text style={styles.recipeName}>{recipe.name}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {recipe.rating}</Text>
            <Text style={styles.reviewsText}>({recipe.reviews} değerlendirme)</Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🍽️</Text>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
              <Text style={styles.metaLabel}>Porsiyon</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaValue}>{recipe.cookTime} dk</Text>
              <Text style={styles.metaLabel}>Süre</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📊</Text>
              <Text style={styles.metaValue}>{recipe.difficulty}</Text>
              <Text style={styles.metaLabel}>Zorluk</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{recipe.description}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={isFavorite ? ['#d4183d', '#b3162b'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={toggleFavorite}
              >
                <Animated.Text
                  style={[
                    styles.buttonIcon,
                    { transform: [{ scale: heartScale }] },
                  ]}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </Animated.Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={[styles.actionButtonSecondary, styles.shareButton]}
              onPress={handleShare}
            >
              <Text style={styles.buttonIconSecondary}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Malzemeler</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <View style={styles.ingredientDot} />
              <View style={styles.ingredientContent}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳 Hazırlama Talimatları</Text>
          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 İpuçları</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🔥</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Aşçı Tavsiyesi</Text>
              <Text style={styles.tipText}>
                Sos pişmesin, yumurta akışkan kalsın. Tencereyi ocaktan al ve karıştırırken yumurta karışımını ekle.
              </Text>
            </View>
          </View>
        </View>

        {/* Nutrition Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥗 Besin Bilgileri (100g)</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Kalori</Text>
              <Text style={styles.nutritionValue}>280</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>12g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Karbohidrat</Text>
              <Text style={styles.nutritionValue}>28g</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Yağ</Text>
              <Text style={styles.nutritionValue}>14g</Text>
            </View>
          </View>
        </View>

        {/* Review Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Değerlendir</Text>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ratingButtonGradient}
          >
            <TouchableOpacity style={styles.ratingButton}>
              <Text style={styles.ratingButtonText}>Tarifte Puan Ver</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerCard: {
    backgroundColor: '#f0fdf7',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    elevation: 5,
  },
  recipeEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  recipeName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#030213',
  },
  reviewsText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  metaItem: {
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 24,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#030213',
  },
  metaLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#717182',
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButtonGradient: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    elevation: 8,
  },
  actionButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 24,
  },
  actionButtonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  buttonIconSecondary: {
    fontSize: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#030213',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 12,
    marginTop: 2,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#030213',
    marginBottom: 4,
  },
  ingredientAmount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#717182',
    fontWeight: '500',
    lineHeight: 22,
  },
  tipCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#b45309',
    fontWeight: '500',
    lineHeight: 18,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    elevation: 2,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 6,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#030213',
  },
  ratingButtonGradient: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    elevation: 8,
  },
  ratingButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
  },
});
