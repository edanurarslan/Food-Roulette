/**
 * RecipeDetailScreen - Tarif Detayları
 * Tarif bilgileri, malzemeler, adımlar, favori butonu
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { CookingTimer } from '../components/CookingTimer';
import {
  scheduleCookingTimerNotification,
  cancelCookingTimerNotification,
  requestNotificationPermissions,
  alertNotificationDenied,
} from '../services/notifications';

const STORAGE_RATINGS = 'recipeRatings';
const STORAGE_STEP_PROGRESS = 'recipeStepProgress';

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

  const [userRating, setUserRating] = useState<number | null>(null);
  const [completedStepIndices, setCompletedStepIndices] = useState<Set<number>>(new Set());

  const recipeKey = String(recipeId);

  const loadLocalRatingAndSteps = useCallback(async () => {
    try {
      const ratingsRaw = await AsyncStorage.getItem(STORAGE_RATINGS);
      const ratings = ratingsRaw ? JSON.parse(ratingsRaw) : {};
      const r = ratings[recipeKey];
      setUserRating(typeof r === 'number' && r >= 1 && r <= 5 ? r : null);

      const stepsRaw = await AsyncStorage.getItem(STORAGE_STEP_PROGRESS);
      const stepsAll = stepsRaw ? JSON.parse(stepsRaw) : {};
      const done: number[] = stepsAll[recipeKey]?.completed ?? [];
      setCompletedStepIndices(new Set(done.filter((n: number) => typeof n === 'number')));
    } catch (e) {
      console.warn('Local rating/steps yüklenemedi', e);
    }
  }, [recipeKey]);

  const persistRating = async (stars: number) => {
    try {
      const ratingsRaw = await AsyncStorage.getItem(STORAGE_RATINGS);
      const ratings = ratingsRaw ? JSON.parse(ratingsRaw) : {};
      ratings[recipeKey] = stars;
      await AsyncStorage.setItem(STORAGE_RATINGS, JSON.stringify(ratings));
    } catch (e) {
      console.warn('Rating kaydedilemedi', e);
    }
  };

  const persistSteps = async (indices: Set<number>) => {
    try {
      const stepsRaw = await AsyncStorage.getItem(STORAGE_STEP_PROGRESS);
      const stepsAll = stepsRaw ? JSON.parse(stepsRaw) : {};
      stepsAll[recipeKey] = { completed: Array.from(indices).sort((a, b) => a - b) };
      await AsyncStorage.setItem(STORAGE_STEP_PROGRESS, JSON.stringify(stepsAll));
    } catch (e) {
      console.warn('Adım ilerlemesi kaydedilemedi', e);
    }
  };

  const toggleStepDone = (index: number) => {
    setCompletedStepIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      void persistSteps(next);
      return next;
    });
  };

  const onSelectRating = async (stars: number) => {
    console.log(`⭐ Rating seçildi: ${stars} yıldız`);
    setUserRating(stars);
    await persistRating(stars);
    const idNum = parseInt(recipeKey, 10);
    if (!Number.isNaN(idNum)) {
      try {
        console.log(`📤 Backend'e rating gönderiliyor: recipeId=${idNum}, rating=${stars}`);
        const result = await apiService.createRating(idNum, stars);
        console.log(`✅ Rating başarıyla kaydedildi:`, result);
      } catch (error: any) {
        console.error(`❌ Rating kaydı başarısız:`, {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        Alert.alert(
          'Puanlama Hatası',
          `Puanlama kaydedilemedi: ${error.message || 'Lütfen tekrar deneyin'}`
        );
      }
    }
  };

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

  // Auto-categorize ingredients
  const getCategoryForIngredient = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase().trim();
    
    // Sebze - Vegetables
    const vegetables = [
      'domates', 'soğan', 'sarımsak', 'biber', 'patlıcan', 'kuru fasulye', 'mısır', 
      'patates', 'lahana', 'marul', 'havuç', 'ıspanak', 'brokoli', 'salata', 'pırasa',
      'turp', 'kabak', 'dereotu', 'rezene', 'kereviz', 'enginar', 'bezelye', 'fasulye',
      'nane', 'maydanoz', 'fesleğen', 'tatsı biber', 'mantı', 'makarna'
    ];
    if (vegetables.some(v => name.includes(v))) return 'Sebze';
    
    // Meyve - Fruits
    const fruits = [
      'elma', 'portakal', 'muz', 'çilek', 'karpuz', 'üzüm', 'limon', 'mandalina', 
      'vişne', 'kayısı', 'şeftali', 'ananas', 'ahududu', 'avokado', 'kiwi', 'mango',
      'nar', 'hurma', 'dut', 'kiraz'
    ];
    if (fruits.some(f => name.includes(f))) return 'Meyve';
    
    // Et/Balık - Meat/Fish
    const meat = [
      'tavuk', 'kıyma', 'biftek', 'balık', 'somon', 'levrek', 'et', 'doner', 'köfte',
      'sos', 'guanciale', 'jambon', 'bacon', 'domuz', 'hindi', 'dana', 'kuzu', 'koyun',
      'sıtıl', 'karides', 'midye', 'tırnak', 'ostrıç', 'sushi', 'steak', 'bonfile',
      'ceviz', 'kaymak', 'balık yumurtası'
    ];
    if (meat.some(m => name.includes(m))) return 'Et/Balık';
    
    // Süt Ürünleri - Dairy
    const dairy = [
      'yoğurt', 'peynir', 'krema', 'sütaş', 'süt', 'tereyağı', 'mozarella', 'cheddar',
      'feta', 'parmesan', 'kaymak', 'ricotta', 'mascarpone', 'beyaz peynir', 'kashkaval',
      'hellim', 'çerkez peyniri', 'krem', 'yağ', 'tat'
    ];
    if (dairy.some(d => name.includes(d))) return 'Süt Ürünleri';
    
    // Baharatlar - Spices/Seasonings
    const spices = [
      'tuz', 'biber', 'karabiber', 'tarçın', 'sumak', 'kimyon', 'kırmızı', 'maydanoz',
      'baharat', 'pulbiber', 'pul', 'zencefil', 'muskatnöz', 'karanfil', 'anason',
      'rezene', 'sarı', 'tuzlama', 'koriant', 'kimyon', 'cardamom', 'kakao', 'şeker',
      'bal', 'asit', 'sirke', 'sos', 'zeytinyağı', 'yağ', 'kepek'
    ];
    if (spices.some(s => name.includes(s))) return 'Baharatlar';
    
    // Default
    return 'Diğer';
  };

  const handleAddToShopping = async () => {
    try {
      // Parse ingredients
      const addedItems: string[] = [];
      const recipeIdNum = parseInt(route.params.recipeId) || 0;

      recipe.ingredients.forEach((ingredient: any) => {
        let name = '';
        let quantity = '1';
        let unit = 'adet';

        // Handle both formats: object {name, amount} or string "Malzeme Miktar"
        if (typeof ingredient === 'string') {
          // API format: "Spaghetti 400g"
          const parts = ingredient.trim().split(' ');
          name = parts.slice(0, -1).join(' ') || ingredient;
          const lastPart = parts[parts.length - 1];
          
          const match = lastPart.match(/^(\d+\.?\d*)(.*)$/);
          if (match) {
            quantity = match[1];
            unit = match[2] || 'adet';
          }
        } else if (ingredient.name && ingredient.amount) {
          // Mock format: {name: "Spaghetti", amount: "400g"}
          name = ingredient.name;
          const parts = ingredient.amount.split(' ');
          quantity = parts[0] || '1';
          unit = parts[1] || 'adet';
        }

        if (name) {
          addedItems.push(name.trim());
          
          // Try to add to backend
          apiService.addShoppingItem(
            name.trim(),
            parseFloat(quantity),
            unit,
            recipeIdNum
          ).catch((error) => {
            console.warn(`Backend'e eklenemedi, sadece local'da: ${name.trim()}`, error);
          });
        }
      });

      if (addedItems.length === 0) {
        Alert.alert('Uyarı', 'Eklenecek malzeme bulunamadı');
        return;
      }

      // Also save to AsyncStorage for offline support
      const shoppingData = await AsyncStorage.getItem('shoppingList');
      const shoppingList = shoppingData ? JSON.parse(shoppingData) : [];
      
      recipe.ingredients.forEach((ingredient: any) => {
        let name = '';
        let quantity = '1';
        let unit = 'adet';

        if (typeof ingredient === 'string') {
          const parts = ingredient.trim().split(' ');
          name = parts.slice(0, -1).join(' ') || ingredient;
          const lastPart = parts[parts.length - 1];
          const match = lastPart.match(/^(\d+\.?\d*)(.*)$/);
          if (match) {
            quantity = match[1];
            unit = match[2] || 'adet';
          }
        } else if (ingredient.name && ingredient.amount) {
          name = ingredient.name;
          const parts = ingredient.amount.split(' ');
          quantity = parts[0] || '1';
          unit = parts[1] || 'adet';
        }

        if (name) {
          const shoppingItem = {
            id: Date.now().toString() + Math.random(),
            name: name.trim(),
            quantity: quantity,
            unit: unit,
            category: getCategoryForIngredient(name.trim()),
            isChecked: false,
            createdAt: Date.now(),
          };
          shoppingList.push(shoppingItem);
        }
      });
      
      await AsyncStorage.setItem('shoppingList', JSON.stringify(shoppingList));
      
      console.log(`✅ ${addedItems.length} malzeme eklendi (Backend + Local)`);
      
      Alert.alert(
        '✅ Başarılı!',
        `"${recipe.name}" tarifinin tüm malzemeleri alışveriş listesine eklendi.\n\n${addedItems.slice(0, 3).join('\n')}${addedItems.length > 3 ? `\n+ ${addedItems.length - 3} daha` : ''}`,
        [
          { text: 'Tamam', onPress: () => {} },
        ]
      );
    } catch (error) {
      console.error('Alışveriş listesine ekleme hatası:', error);
      Alert.alert('Hata', 'Malzemeler eklenirken hata oluştu');
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
              style={[styles.actionButtonSecondary, styles.shoppingButton]}
              onPress={handleAddToShopping}
            >
              <Text style={styles.buttonIconSecondary}>🛒</Text>
            </TouchableOpacity>

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
          {recipe.ingredients.map((ingredient: any, index: number) => {
            const isStr = typeof ingredient === 'string';
            const name = isStr ? ingredient : ingredient?.name ?? '';
            const amount = isStr ? '' : ingredient?.amount ?? '';
            return (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientDot} />
                <View style={styles.ingredientContent}>
                  <Text style={styles.ingredientName}>{name}</Text>
                  {!!amount && <Text style={styles.ingredientAmount}>{amount}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* --- GELİŞMİŞ PIŞIRME ZAMANLAYICISI --- */}
        <CookingTimer
          recipeName={recipe.name}
          defaultMinutes={recipe.cookTime || 20}
          onNotification={async (message) => {
            Alert.alert('⏰ Bildirim', message);
          }}
          onTimerEnd={() => {
            console.log(`🎉 Zamanlayıcı bitti: ${recipe.name}`);
          }}
        />

        {/* Instructions Section — interactive checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🍳 Adım adım talimatlar</Text>
          {recipe.instructions.length > 0 ? (
            <>
              <View style={styles.progressBarOuter}>
                <View
                  style={[
                    styles.progressBarInner,
                    {
                      width: `${Math.round(
                        (Array.from(completedStepIndices).filter((i) => i < recipe.instructions.length).length /
                          recipe.instructions.length) *
                          100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                İlerleme:{' '}
                {Array.from(completedStepIndices).filter((i) => i < recipe.instructions.length).length} /{' '}
                {recipe.instructions.length}
              </Text>
            </>
          ) : null}
          {recipe.instructions.map((instruction: string, index: number) => {
            const done = completedStepIndices.has(index);
            return (
              <TouchableOpacity
                key={index}
                style={[styles.instructionRow, done && styles.instructionRowDone]}
                onPress={() => toggleStepDone(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.stepCheck, done && styles.stepCheckDone]}>
                  <Text style={styles.stepCheckMark}>{done ? '✓' : ''}</Text>
                </View>
                <View style={styles.stepNumberSmall}>
                  <Text style={styles.stepNumberSmallText}>{index + 1}</Text>
                </View>
                <Text style={[styles.instructionText, done && styles.instructionTextDone]}>{instruction}</Text>
              </TouchableOpacity>
            );
          })}
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

        {/* Review Section — local 1–5 stars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Tarifini değerlendir</Text>
          <Text style={styles.ratingSubtext}>
            1–5 yıldız; tarif başına bir puan (istediğin zaman değiştirebilirsin). Cihazında saklanır.
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => onSelectRating(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                <Text style={[styles.starGlyph, userRating && star <= userRating ? styles.starActive : styles.starInactive]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {userRating ? (
            <Text style={styles.ratingSummary}>
              Senin puanın: {userRating}/5 {userRating >= 4 ? '— Harika!' : userRating <= 2 ? '— Not aldık, geliştireceğiz.' : ''}
            </Text>
          ) : (
            <Text style={styles.ratingSummaryMuted}>Henüz puan vermedin.</Text>
          )}
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
  shoppingButton: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1.5,
    borderColor: '#FED7AA',
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
  timerCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  timerHint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  timerInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  timerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  timerBtnPrimary: {
    backgroundColor: '#10B981',
  },
  timerBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  timerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  timerBtnTextDark: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
  progressBarOuter: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarInner: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    fontWeight: '600',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructionRowDone: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  stepCheck: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepCheckDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCheckMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  stepNumberSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberSmallText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  instructionTextDone: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  ratingSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starGlyph: {
    fontSize: 36,
  },
  starActive: {
    color: '#f59e0b',
  },
  starInactive: {
    color: '#e5e7eb',
  },
  ratingSummary: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
  },
  ratingSummaryMuted: {
    textAlign: 'center',
    fontSize: 14,
    color: '#9ca3af',
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
  // --- YENİ SAAT TASARIMI STİLLERİ ---
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  clockOuterRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 6,
    borderColor: '#ffffff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  clockProgress: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#10B981',
    opacity: 0.15,
  },
  clockInnerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  timerDisplay: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e293b',
    ...Platform.select({ ios: { fontVariant: ['tabular-nums'] } }), // Sayıların kaymasını engeller
  },
  timerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  timerInputMinimal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
    padding: 0,
    minWidth: 30,
  },
  minLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 2,
    fontWeight: '600',
  },
  timerControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    gap: 20,
  },
  timerCircleBtn: {
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  startBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  pauseBtn: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
  },
  timerCircleBtnSecondary: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  timerBtnIcon: {
    fontSize: 28,
    color: '#ffffff',
    marginLeft: 3, // Play ikonu tam ortalı dursun diye
  },
  timerBtnIconSmall: {
    fontSize: 18,
  },
});
