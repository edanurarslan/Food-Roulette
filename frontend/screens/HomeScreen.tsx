/**
 * HomeScreen - Anasayfa (Food Wheel with Database Integration)
 * Rastgele tarif seçimi için dönen tekerlek (database'den tarifler)
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
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { apiService } from '../services/api';
import { SearchBar } from '../components/SearchBar';
import { IngredientInput } from '../components/IngredientInput';
import { CategoryFilter } from '../components/CategoryFilter';
import { MoodFilter, MoodType } from '../components/MoodFilter';

type RootStackParamList = {
  HomeMain: undefined;
  RecipeDetail: { recipeId: number; recipeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'HomeMain'>;

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

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Tümü' | 'Çorba' | 'Ana Yemek' | 'Kahvaltı' | 'Ara Öğün' | 'Yan Yemek'>('Tümü');
  const [selectedMood, setSelectedMood] = useState<MoodType>('Tümü');
  const [ingredients, setIngredients] = useState<string[]>([]);
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const selectedIndexRef = useRef<number>(0);
  const currentRotationRef = useRef<number>(0);

  // Filter recipes whenever search, category, mood, or ingredients change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedMood, ingredients, recipes]);

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

    // Mood filter
    if (selectedMood !== 'Tümü') {
      filtered = filtered.filter(r => {
        if (selectedMood === 'Hızlı') return r.cook_time && r.cook_time < 20;
        if (selectedMood === 'Tok') return r.difficulty !== 'Kolay';
        if (selectedMood === 'Hafif') return r.calories && r.calories < 250;
        if (selectedMood === 'Sağlıklı') return r.difficulty === 'Kolay' || r.difficulty === 'Orta';
        return true;
      });
    }

    // Ingredients filter - all selected ingredients must be in recipe
    if (ingredients.length > 0) {
      filtered = filtered.filter(r =>
        ingredients.every(ing =>
          r.ingredients?.some(recIng =>
            recIng.toLowerCase().includes(ing.toLowerCase())
          )
        )
      );
    }

    setFilteredRecipes(filtered);
  };

  useEffect(() => {
    // Parallel animations for smooth entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      // TÜM TAREFLERİ YÜKLEYİN - limit 50 veya daha fazla
      const response = await apiService.getRecipes(undefined, undefined, 0, 50);
      
      if (response && Array.isArray(response)) {
        const recipesWithEmoji = response.map((recipe: any, index: number) => ({
          ...recipe,
          emoji: recipe.emoji || ['🍕', '🍝', '🍜', '🍲', '🌮', '🍱', '🥘', '🍛', '🥗', '🍗', '🍖', '🥩'][index % 12],
        }));
        setRecipes(recipesWithEmoji);
        console.log(`✅ ${recipesWithEmoji.length} tarif yüklendi`);
      }
    } catch (error) {
      console.error('Tarifler yüklenirken hata:', error);
      // Fallback - tüm kategorileri temsil et
      setRecipes([
        { id: 1, name: 'Pasta', emoji: '🍝', category: 'Ana Yemek', instructions: [], ingredients: [], cook_time: 30, difficulty: 'Kolay' },
        { id: 2, name: 'Biryani', emoji: '🍲', category: 'Ana Yemek', instructions: [], ingredients: [], cook_time: 45, difficulty: 'Orta' },
        { id: 3, name: 'Pizza', emoji: '🍕', category: 'Ana Yemek', instructions: [], ingredients: [], cook_time: 35, difficulty: 'Kolay' },
        { id: 4, name: 'Sushi', emoji: '🍣', category: 'Ara Öğün', instructions: [], ingredients: [], cook_time: 40, difficulty: 'Zor' },
        { id: 5, name: 'Steak', emoji: '🥩', category: 'Ana Yemek', instructions: [], ingredients: [], cook_time: 25, difficulty: 'Orta' },
        { id: 6, name: 'Tacos', emoji: '🌮', category: 'Ana Yemek', instructions: [], ingredients: [], cook_time: 20, difficulty: 'Kolay' },
        { id: 7, name: 'Ramen', emoji: '🍜', category: 'Çorba', instructions: [], ingredients: [], cook_time: 50, difficulty: 'Zor' },
        { id: 8, name: 'Curry', emoji: '🍛', category: 'Ana Yemek', instructions: [], ingredients: [], cook_time: 60, difficulty: 'Orta' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = () => {
    const spinRecipes = filteredRecipes.length > 0 ? filteredRecipes : recipes;
    console.log(`🎡 Spin başlatılıyor - Toplam tarifler: ${spinRecipes.length}`);
    
    if (isSpinning || spinRecipes.length === 0) {
      console.log(`❌ Spin yapılamıyor - isSpinning: ${isSpinning}, tarifler: ${spinRecipes.length}`);
      return;
    }

    setIsSpinning(true);

    const selectedIndex = Math.floor(Math.random() * spinRecipes.length);
    selectedIndexRef.current = selectedIndex;
    console.log(`✓ Seçilen tarif indeksi: ${selectedIndex} - ${spinRecipes[selectedIndex]?.name}`);

    const segmentAngle = 360 / spinRecipes.length;
    const targetAngle = selectedIndex * segmentAngle;
    const spins = 5;
    const finalRotation =
      currentRotationRef.current + 360 * spins + (360 - targetAngle) + segmentAngle / 2;

    spinAnim.setValue(currentRotationRef.current);

    Animated.timing(spinAnim, {
      toValue: finalRotation,
      duration: 4500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth cubic-bezier easing
      useNativeDriver: false,
    }).start(() => {
      currentRotationRef.current = finalRotation;
      setIsSpinning(false);
      setSelectedRecipe(spinRecipes[selectedIndex]);
      console.log(`🎉 Spin tamamlandı - Sonuç: ${spinRecipes[selectedIndex]?.name}`);
    });
  };

  const handleViewRecipe = () => {
    if (selectedRecipe) {
      navigation.navigate('RecipeDetail', {
        recipeId: selectedRecipe.id,
        recipeName: selectedRecipe.name,
      });
    }
  };

  const displayRecipes = filteredRecipes.length > 0 ? filteredRecipes : recipes;
  const segmentAngle = displayRecipes.length > 0 ? 360 / displayRecipes.length : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Tarif Çarkı</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Tarifler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (recipes.length === 0 || displayRecipes.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Tarif Çarkı</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{recipes.length === 0 ? '❌ Tarifler yüklenemedi' : '🔍 Kriterlere uygun tarif bulunamadı'}</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Tarif Çarkı</Text>
        <Text style={styles.headerSubtitle}>Çevir, keşfet, pişir!</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Section */}
        <View style={styles.filterSection}>
          <SearchBar onSearch={setSearchQuery} />
          <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <MoodFilter selectedMood={selectedMood} onSelectMood={setSelectedMood} />
          <IngredientInput
            ingredients={ingredients}
            onAddIngredient={(ing) => setIngredients([...ingredients, ing])}
            onRemoveIngredient={(idx) => setIngredients(ingredients.filter((_, i) => i !== idx))}
          />
        </View>

        {/* Results info */}
        {filteredRecipes.length !== recipes.length && (
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              ✨ {filteredRecipes.length} tarif bulundu
            </Text>
          </View>
        )}

        <View style={styles.wheelWrapper}>
          <View style={styles.pointer} />

          {(filteredRecipes.length > 0 ? filteredRecipes : recipes).length > 0 && (
            <Animated.View style={[
              styles.wheelAnimated,
              {
                transform: [
                  { 
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 3600],
                      outputRange: ['0deg', '3600deg'],
                    })
                  },
                  { scale: scaleAnim }
                ],
              }
            ]}>
              <Svg width={300} height={300} viewBox="0 0 200 200">
                {(filteredRecipes.length > 0 ? filteredRecipes : recipes).map((recipe, index) => {
                  const displayRecipes = filteredRecipes.length > 0 ? filteredRecipes : recipes;
                  const segAngle = 360 / displayRecipes.length;
                  const startAngle = index * segAngle - 90;
                  const endAngle = startAngle + segAngle;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;

                  const x1 = 100 + 100 * Math.cos(startRad);
                  const y1 = 100 + 100 * Math.sin(startRad);
                  const x2 = 100 + 100 * Math.cos(endRad);
                  const y2 = 100 + 100 * Math.sin(endRad);

                  const largeArc = segAngle > 180 ? 1 : 0;

                  const pathData = [
                    `M 100 100`,
                    `L ${x1} ${y1}`,
                    `A 100 100 0 ${largeArc} 1 ${x2} ${y2}`,
                    `Z`,
                  ].join(' ');

                  const textAngle = startAngle + segmentAngle / 2;
                  const textRad = (textAngle * Math.PI) / 180;
                  const textX = 100 + 60 * Math.cos(textRad);
                  const textY = 100 + 60 * Math.sin(textRad);

                  return (
                    <G key={recipe.id}>
                      <Path
                        d={pathData}
                        fill={colors[index % colors.length]}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <SvgText
                        x={textX}
                        y={textY}
                        fill="white"
                        fontSize="24"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {recipe.emoji || '🍽️'}
                      </SvgText>
                    </G>
                  );
                })}

                <Circle cx="100" cy="100" r="32" fill="white" stroke="#E0E0E0" strokeWidth="3" />
              </Svg>
            </Animated.View>
          )}
        </View>

        <TouchableOpacity
          disabled={isSpinning}
          onPress={handleSpin}
          style={styles.spinButtonContainer}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSpinning ? ['#D1D5DB', '#9CA3AF'] : ['#F97316', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.spinButton}
          >
            <Text style={styles.spinButtonEmoji}>{isSpinning ? '🎰' : '🎯'}</Text>
            <Text style={styles.spinButtonText}>{isSpinning ? 'Dönüyor...' : 'Çarkı Çevir!'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>✨</Text>
            <Text style={styles.infoTitle}>Rastgele</Text>
            <Text style={styles.infoText}>Her gün yeni</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>⭐</Text>
            <Text style={styles.infoTitle}>Beğeni</Text>
            <Text style={styles.infoText}>En sevdiklerin</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>📝</Text>
            <Text style={styles.infoTitle}>Tarif</Text>
            <Text style={styles.infoText}>Adım adım</Text>
          </View>
        </View>

        {selectedRecipe && (
          <View style={styles.selectedRecipeContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectedRecipeCard}
            >
              <Text style={styles.selectedRecipeEmoji}>{selectedRecipe.emoji || '🍽️'}</Text>
              <Text style={styles.selectedRecipeName}>{selectedRecipe.name}</Text>
              
              <View style={styles.recipeMetaRow}>
                <Text style={styles.recipeMeta}>⏱️ {selectedRecipe.cook_time} dk</Text>
                {selectedRecipe.difficulty && <Text style={styles.recipeMeta}>📊 {selectedRecipe.difficulty}</Text>}
                {selectedRecipe.calories && <Text style={styles.recipeMeta}>🔥 {selectedRecipe.calories} kcal</Text>}
              </View>

              {selectedRecipe.description && (
                <Text style={styles.recipeDescription}>{selectedRecipe.description}</Text>
              )}

              <TouchableOpacity onPress={handleViewRecipe} activeOpacity={0.8}>
                <View style={styles.viewRecipeButton}>
                  <Text style={styles.viewRecipeButtonText}>📖 Tarifi Gör</Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}
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
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    marginHorizontal: 16,
    position: 'relative',
    height: 360,
    width: 'auto',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  wheelAnimated: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DC2626',
    zIndex: 20,
  },
  spinButtonContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  spinButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  spinButtonEmoji: {
    fontSize: 22,
  },
  spinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
    marginHorizontal: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  infoEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#030213',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 10,
    color: '#6B7280',
  },
  selectedRecipeContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  selectedRecipeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedRecipeEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  selectedRecipeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  recipeMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  recipeMeta: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  viewRecipeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  viewRecipeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  filterSection: {
    marginVertical: 12,
  },
  resultsInfo: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    textAlign: 'center',
  },
});
