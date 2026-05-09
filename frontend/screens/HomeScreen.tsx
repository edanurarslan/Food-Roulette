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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [categorizedRecipes, setCategorizedRecipes] = useState<{
    exactMatch: Recipe[];
    partialMatch: Recipe[];
    singleMatch: Recipe[];
  }>({
    exactMatch: [],
    partialMatch: [],
    singleMatch: [],
  });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestedRecipes, setSuggestedRecipes] = useState<Recipe[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // New Feature States
  const [historyRecipes, setHistoryRecipes] = useState<Recipe[]>([]);
  const [recipeOfTheDay, setRecipeOfTheDay] = useState<Recipe | null>(null);
  const [seasonalRecipes, setSeasonalRecipes] = useState<Recipe[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<Recipe[]>([]);

  // Extra Features States
  const [weeklyMenuSummary, setWeeklyMenuSummary] = useState<any[]>([]);
  const [badges, setBadges] = useState<{ icon: string, text: string }[]>([]);
  const [cookingTip, setCookingTip] = useState('');
  const [pantryIngredients, setPantryIngredients] = useState<string[]>(['Tuz', 'Karabiber', 'Zeytinyağı', 'Soğan', 'Sarımsak', 'Tereyağı']);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

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

    // Ingredients filter - AKILLI KATEGORİZASYON
    if (ingredients.length > 0) {
      const exactMatch: Recipe[] = [];
      const partialMatch: Recipe[] = [];
      const singleMatch: Recipe[] = [];
      const seen = new Set<number>(); // Duplikasyonu önlemek için

      filtered.forEach(r => {
        if (!r.ingredients || r.ingredients.length === 0) return;

        const normalizedRecipeIng = r.ingredients.map(ing => ing.toLowerCase().trim());

        // Her seçilen malzeme için match sayısı
        let matchCount = 0;
        ingredients.forEach(selectedIng => {
          const normalizedSelected = selectedIng.toLowerCase().trim();
          const hasMatch = normalizedRecipeIng.some(recIng =>
            recIng.includes(normalizedSelected) || normalizedSelected.includes(recIng)
          );
          if (hasMatch) matchCount++;
        });

        if (matchCount === 0) return; // Eğer hiçbir malzeme match etmezse atla

        if (!seen.has(r.id)) {
          // TÜM malzemeleri içeren → Exact Match (en yüksek öncelik)
          if (matchCount === ingredients.length) {
            exactMatch.push(r);
            seen.add(r.id);
          }
          // BAZISI match → Partial Match
          else if (matchCount > 1 || (matchCount === 1 && ingredients.length > 1)) {
            partialMatch.push(r);
            seen.add(r.id);
          }
          // Sadece BİRİ match → Single Match (en düşük öncelik)
          else {
            singleMatch.push(r);
            seen.add(r.id);
          }
        }
      });

      setFilteredRecipes([...exactMatch, ...partialMatch, ...singleMatch]);
      setCategorizedRecipes({ exactMatch, partialMatch, singleMatch });

      console.log(`🔍 Malzeme Filtrelemesi:`);
      console.log(`  ✅ Tam Eşleşme: ${exactMatch.length}`);
      console.log(`  🟡 Kısmi Eşleşme: ${partialMatch.length}`);
      console.log(`  🔵 Tek Malzeme: ${singleMatch.length}`);
    } else {
      setFilteredRecipes(filtered);
      setCategorizedRecipes({ exactMatch: [], partialMatch: [], singleMatch: [] });
    }
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
    loadExtras();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      alert('🔔 Zamanlayıcı bitti! Yemeğiniz hazır olabilir.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const startTimer = (mins: number) => {
    setTimerSeconds(mins * 60);
    setTimerActive(true);
  };

  const formatTimer = () => {
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const loadExtras = async () => {
    const COOKING_TIPS = [
      "Makarna suyunu sosunuzu bağlamak için kullanabilirsiniz.",
      "Etleri pişirmeden önce oda sıcaklığına getirmek daha iyi mühürlenmesini sağlar.",
      "Soğan doğrarken sakız çiğnemek göz yaşarmasını önleyebilir.",
      "Tuzlu yemeklerin kurtarıcısı: İçine yarım patates atıp kaynatın.",
      "Yumurta haşlarken suya bir damla sirke damlatırsanız, kabukları daha kolay soyulur."
    ];
    setCookingTip(COOKING_TIPS[Math.floor(Math.random() * COOKING_TIPS.length)]);

    try {
      const hData = await AsyncStorage.getItem('history');
      const hItems = hData ? JSON.parse(hData) : [];
      const newBadges = [];
      if (hItems.length >= 5) newBadges.push({ icon: '🥉', text: 'Çaylak Aşçı' });
      if (hItems.length >= 20) newBadges.push({ icon: '🥈', text: 'Mutfak Dostu' });
      const unique = new Set(hItems.map((h: any) => h.recipeId));
      if (unique.size >= 10) newBadges.push({ icon: '🎖️', text: 'Maceraperest' });
      if (unique.size >= 30) newBadges.push({ icon: '🏆', text: 'Usta Şef' });
      setBadges(newBadges);
    } catch (e) { }

    try {
      const menu = await apiService.getCurrentWeeklyMenu();
      if (menu && menu.menu_data) {
        setWeeklyMenuSummary(menu.menu_data.filter((d: any) => d.recipe));
      }
    } catch (e) { }

    try {
      const pData = await AsyncStorage.getItem('pantry');
      if (pData) {
        setPantryIngredients(JSON.parse(pData));
      }
    } catch (e) { }
  };

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

        // --- Yeni Özellikler ---
        // 1. Bugünün Önerisi
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        if (recipesWithEmoji.length > 0) {
          setRecipeOfTheDay(recipesWithEmoji[dayOfYear % recipesWithEmoji.length]);
        }

        // 2. Mevsimlik Öneriler (Aylara göre basit bir mantık)
        const currentMonth = new Date().getMonth();
        let seasonalIngredients = ['domates', 'biber', 'patlıcan', 'fasulye', 'kabak', 'çilek'];
        if (currentMonth >= 9 || currentMonth <= 2) {
          seasonalIngredients = ['havuç', 'lahana', 'pırasa', 'ıspanak', 'karnabahar', 'pancar', 'balık'];
        }
        let seasonal = recipesWithEmoji.filter((r: Recipe) =>
          r.ingredients?.some((i: string) => seasonalIngredients.some(s => i.toLowerCase().includes(s)))
        ).slice(0, 5);
        if (seasonal.length === 0) seasonal = recipesWithEmoji.slice(0, 5);
        setSeasonalRecipes(seasonal);

        // 3. Son Çevirilenler & Popüler (Local History üzerinden okuyoruz)
        try {
          const historyData = await AsyncStorage.getItem('history');
          const historyItems = historyData ? JSON.parse(historyData) : [];
          if (historyItems.length > 0) {
            // Son Çevirilenler
            const sortedRecent = [...historyItems].sort((a: any, b: any) => b.viewedAt - a.viewedAt);
            const recentIds = sortedRecent.slice(0, 5).map((h: any) => h.recipeId);
            const recent = recentIds.map((id: number) => recipesWithEmoji.find((r: Recipe) => r.id === id)).filter(Boolean);
            setHistoryRecipes(recent);

            // Popüler
            const sortedPopular = [...historyItems].sort((a: any, b: any) => b.viewCount - a.viewCount);
            const popIds = sortedPopular.slice(0, 5).map((h: any) => h.recipeId);
            const pops = popIds.map((id: number) => recipesWithEmoji.find((r: Recipe) => r.id === id)).filter(Boolean);
            setPopularRecipes(pops);
          } else {
            setPopularRecipes(recipesWithEmoji.slice(0, 5));
          }
        } catch (e) {
          console.error('History yüklenemedi', e);
          setPopularRecipes(recipesWithEmoji.slice(0, 5));
        }
        // --- Yeni Özellikler Sonu ---
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

    // Load suggestions after recipes
    loadSuggestions();
  };

  const loadSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const suggestions = await apiService.getSuggestedRecipes(4);
      setSuggestedRecipes(suggestions);
    } catch (error) {
      console.error('Öneriler yüklenirken hata:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const generateRandomMenu = async () => {
    try {
      setSuggestionsLoading(true);
      // Get fresh random recipes every time
      const randomRecipes = await apiService.getSuggestedRecipes(4);
      setSuggestedRecipes(randomRecipes);
      console.log(`🎲 Rastgele menü oluşturuldu: ${randomRecipes.map(r => r.name).join(', ')}`);
    } catch (error) {
      console.error('Rastgele menü oluşturulurken hata:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSpin = () => {
    const spinRecipes = filteredRecipes;
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
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      currentRotationRef.current = finalRotation;
      setIsSpinning(false);
      setSelectedRecipe(spinRecipes[selectedIndex]);
      console.log(`🎉 Spin tamamlandı - Sonuç: ${spinRecipes[selectedIndex]?.name}`);
    });
  };

  const handleQuickSpin = () => {
    setSearchQuery('');
    setSelectedCategory('Tümü');
    setSelectedMood('Tümü');
    setIngredients([]);

    const spinRecipes = recipes;
    if (isSpinning || spinRecipes.length === 0) return;

    setIsSpinning(true);
    const selectedIndex = Math.floor(Math.random() * spinRecipes.length);
    selectedIndexRef.current = selectedIndex;

    const segmentAngle = 360 / spinRecipes.length;
    const targetAngle = selectedIndex * segmentAngle;
    const spins = 5;
    const finalRotation = currentRotationRef.current + 360 * spins + (360 - targetAngle) + segmentAngle / 2;

    spinAnim.setValue(currentRotationRef.current);
    Animated.timing(spinAnim, {
      toValue: finalRotation,
      duration: 4500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => {
      currentRotationRef.current = finalRotation;
      setIsSpinning(false);
      setSelectedRecipe(spinRecipes[selectedIndex]);
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

  const renderRecipeList = (title: string, subtitle: string, data: Recipe[], icon: string) => {
    if (!data || data.length === 0) return null;
    return (
      <View style={styles.suggestionsSection}>
        <View style={styles.suggestionsHeader}>
          <View>
            <Text style={styles.suggestionsTitle}>{icon} {title}</Text>
            <Text style={styles.suggestionsSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          {data.map((recipe) => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.horizontalCard}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id, recipeName: recipe.name })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors[recipe.id % colors.length], colors[(recipe.id + 1) % colors.length]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.horizontalGradient}
              >
                <Text style={styles.suggestionEmoji}>{recipe.emoji}</Text>
                <Text style={styles.suggestionName} numberOfLines={2}>{recipe.name}</Text>
                {recipe.cook_time && <Text style={styles.suggestionTime}>⏱️ {recipe.cook_time}dk</Text>}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const segmentAngle = filteredRecipes.length > 0 ? 360 / filteredRecipes.length : 0;

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

  if (recipes.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Tarif Çarkı</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>❌ Tarifler yüklenemedi</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <Text style={styles.headerTitle}>🎯 Tarif Çarkı</Text>
          <Text style={styles.headerSubtitle}>Çevir, keşfet, pişir!</Text>
          
          {cookingTip ? (
            <View style={styles.tipContainer}>
              <Text style={styles.tipText}>💡 {cookingTip}</Text>
            </View>
          ) : null}

          {badges.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesWrapper}>
              {badges.map((b, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{b.icon}</Text>
                  <Text style={styles.badgeText}>{b.text}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </LinearGradient>
        {weeklyMenuSummary.length > 0 && (
          <View style={styles.weeklyMenuSummary}>
            <Text style={styles.sectionTitle}>📅 Haftanın Menüsü Özeti</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              {weeklyMenuSummary.map((dayData, idx) => (
                <View key={idx} style={styles.weeklyMenuDay}>
                  <Text style={styles.weeklyDayName}>{dayData.day}</Text>
                  <Text style={styles.weeklyDayRecipe} numberOfLines={1}>{dayData.recipe.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Hızlı Çevir Button */}
        <TouchableOpacity
          style={styles.quickSpinBtnContainer}
          onPress={handleQuickSpin}
          disabled={isSpinning}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickSpinGradient}
          >
            <Text style={styles.quickSpinText}>🎲 Hızlı Çevir (Şansımı Dene)</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
          <MoodFilter selectedMood={selectedMood} onSelectMood={setSelectedMood} />

          <View style={styles.pantryContainer}>
            <Text style={styles.pantryTitle}>🥫 Dolabındaki Malzemeler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {pantryIngredients.map((item, idx) => {
                const isSelected = ingredients.includes(item);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.pantryChip, isSelected && styles.pantryChipActive]}
                    onPress={() => {
                      if (isSelected) setIngredients(ingredients.filter(i => i !== item));
                      else setIngredients([...ingredients, item]);
                    }}
                  >
                    <Text style={[styles.pantryChipText, isSelected && styles.pantryChipTextActive]}>
                      {isSelected ? '✓ ' : '+ '}{item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <IngredientInput
            ingredients={ingredients}
            onAddIngredient={(ing) => {
              const newIng = [...ingredients, ing];
              setIngredients(newIng);
              console.log(`✅ Malzeme listesi güncellendi:`, newIng);
            }}
            onRemoveIngredient={(idx) => {
              const newIng = ingredients.filter((_, i) => i !== idx);
              setIngredients(newIng);
              console.log(`❌ Malzeme kaldırıldı:`, newIng);
            }}
          />
        </View>

        {/* Debug Info */}
        {ingredients.length > 0 && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              🔍 Arama: {ingredients.join(', ')} → {filteredRecipes.length} tarif
            </Text>
          </View>
        )}

        {/* Results info */}
        {filteredRecipes.length !== recipes.length && (
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              ✨ {filteredRecipes.length} tarif çarka eklendi
            </Text>
            <TouchableOpacity
              style={styles.clearAllFiltersBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('Tümü');
                setSelectedMood('Tümü');
                setIngredients([]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearAllFiltersText}>✕ Temizle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Malzeme Kategorileri */}
        {ingredients.length > 0 && filteredRecipes.length > 0 && (
          <View style={styles.ingredientCategoryContainer}>
            {/* Tam Eşleşme */}
            {categorizedRecipes.exactMatch.length > 0 && (
              <View style={styles.categorySection}>
                <View style={[styles.categoryBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.categoryBadgeText}>✅ Tam Eşleşme ({categorizedRecipes.exactMatch.length})</Text>
                </View>
                <Text style={styles.categoryDescription}>
                  Tüm malzemeleri içeren tarifler
                </Text>
              </View>
            )}

            {/* Kısmi Eşleşme */}
            {categorizedRecipes.partialMatch.length > 0 && (
              <View style={styles.categorySection}>
                <View style={[styles.categoryBadge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.categoryBadgeText}>🟡 Kısmi Eşleşme ({categorizedRecipes.partialMatch.length})</Text>
                </View>
                <Text style={styles.categoryDescription}>
                  Birkaç malzemeyi içeren tarifler
                </Text>
              </View>
            )}

            {/* Tek Malzeme */}
            {categorizedRecipes.singleMatch.length > 0 && (
              <View style={styles.categorySection}>
                <View style={[styles.categoryBadge, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.categoryBadgeText}>🔵 Tek Malzeme ({categorizedRecipes.singleMatch.length})</Text>
                </View>
                <Text style={styles.categoryDescription}>
                  En az bir malzemeyi içeren tarifler
                </Text>
              </View>
            )}
          </View>
        )}

        {filteredRecipes.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateEmoji}>🔍</Text>
            <Text style={styles.emptyStateTitle}>Tarif Bulunamadı</Text>
            <Text style={styles.emptyStateText}>Filtreleri veya aramanızı değiştirerek tekrar deneyin.</Text>
          </View>
        ) : (
          <View style={styles.wheelWrapper}>
            <View style={styles.pointer} />

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
                {filteredRecipes.length === 1 ? (
                  <G>
                    <Circle cx="100" cy="100" r="100" fill={colors[0]} />
                    <SvgText
                      x="100"
                      y="110"
                      fill="white"
                      fontSize="40"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {filteredRecipes[0].emoji || '🍽️'}
                    </SvgText>
                  </G>
                ) : (
                  filteredRecipes.map((recipe, index) => {
                    const segAngle = 360 / filteredRecipes.length;
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

                    const textAngle = startAngle + segAngle / 2;
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
                  })
                )}

                <Circle cx="100" cy="100" r="32" fill="white" stroke="#E0E0E0" strokeWidth="3" />
              </Svg>
            </Animated.View>
          </View>
        )}

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

        <View style={styles.timerContainer}>
          <Text style={styles.sectionTitle}>⏱️ Hızlı Zamanlayıcı</Text>
          <View style={styles.timerButtons}>
            {[5, 10, 15, 30].map(mins => (
              <TouchableOpacity key={mins} style={styles.timerBtn} onPress={() => startTimer(mins)}>
                <Text style={styles.timerBtnText}>{mins} dk</Text>
              </TouchableOpacity>
            ))}
            {timerActive && (
              <TouchableOpacity style={styles.timerCancelBtn} onPress={() => setTimerActive(false)}>
                <Text style={styles.timerCancelBtnText}>İptal</Text>
              </TouchableOpacity>
            )}
          </View>
          {timerActive && (
            <Text style={styles.timerDisplay}>{formatTimer()}</Text>
          )}
        </View>

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

        {/* Menu Suggestions Section - Bottom */}
        {renderRecipeList('Bugünün Önerisi', 'Sana özel günlük tarif', recipeOfTheDay ? [recipeOfTheDay] : [], '🌟')}
        {renderRecipeList('Son Çevirilen Tarifler', 'Yakın zamanda denk geldiklerin', historyRecipes, '🕒')}
        {renderRecipeList('Popüler Tarifler', 'Topluluğun favorileri', popularRecipes, '🔥')}
        {renderRecipeList('Mevsimlik Öneriler', 'Bu aya özel lezzetler', seasonalRecipes, '🌸')}
        {renderRecipeList('Sana Özel', 'Alternatif menü önerileri', suggestedRecipes, '💡')}

        {suggestionsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#10B981" />
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
  quickSpinBtnContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  quickSpinGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSpinText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    marginHorizontal: 16,
    height: 360,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  emptyStateEmoji: {
    fontSize: 54,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1,
  },
  clearAllFiltersBtn: {
    backgroundColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearAllFiltersText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  debugInfo: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  debugText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  ingredientCategoryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  categorySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },
  categoryBadge: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  suggestionsSection: {
    marginHorizontal: 12,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  suggestionsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  suggestionCard: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  horizontalCard: {
    width: 140,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  horizontalGradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  suggestionEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  suggestionTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  randomMenuButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  randomMenuButtonText: {
    fontSize: 24,
    fontWeight: '700',
  },
  tipContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  tipText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  badgesWrapper: {
    flexDirection: 'row',
    marginTop: 12,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  weeklyMenuSummary: {
    marginVertical: 16,
  },
  weeklyMenuDay: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  weeklyDayName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  weeklyDayRecipe: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  pantryContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  pantryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  pantryChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pantryChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  pantryChipText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  pantryChipTextActive: {
    color: '#FFF',
  },
  timerContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  timerBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 14,
  },
  timerCancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  timerCancelBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
  },
});
