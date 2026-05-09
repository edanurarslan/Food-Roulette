/**
 * WeeklyMenuScreen - Haftalık Menu Planlama
 * Günlere tarif atama, taşıma, silme
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
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

type RootStackParamList = {
  WeeklyMain: undefined;
  RecipeDetail: { recipeId: number; recipeName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyMain'>;

interface Recipe {
  id: number;
  name: string;
  emoji?: string;
  category: string;
  cook_time: number;
  difficulty?: string;
}

interface DailyMenu {
  day: string;
  date: string;
  breakfast?: Recipe | null;
  lunch?: Recipe | null;
  dinner?: Recipe | null;
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;
const MEAL_LABELS = {
  breakfast: '🌅 Kahvaltı',
  lunch: '☀️ Öğle',
  dinner: '🌙 Akşam',
};

export const WeeklyMenuScreen: React.FC<Props> = ({ navigation }) => {
  const [weeklyMenu, setWeeklyMenu] = useState<DailyMenu[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadWeeklyMenu();
      loadRecipes();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const loadRecipes = async () => {
    try {
      const response = await apiService.getRecipes(undefined, undefined, 0, 50);
      if (response && Array.isArray(response)) {
        setRecipes(response);
      }
    } catch (error) {
      console.error('Tarifler yüklenirken hata:', error);
    }
  };

  const loadWeeklyMenu = async () => {
    try {
      setLoading(true);
      // Try to load from backend first
      const weekStart = currentWeekStart.toISOString().split('T')[0];
      const backendMenu = await apiService.getWeeklyMenu(weekStart).catch(() => null);
      
      if (backendMenu) {
        if (backendMenu.menu_data && Array.isArray(backendMenu.menu_data)) {
          setWeeklyMenu(backendMenu.menu_data);
          await AsyncStorage.setItem('weeklyMenu', JSON.stringify(backendMenu.menu_data));
        } else {
          // Fallback to legacy single-recipe fields
          const week: DailyMenu[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            const recipeField = `${DAYS[i].toLowerCase()}_recipe`; // Adjusted from _recipe_id based on schema
            const recipeId = (backendMenu as any)[recipeField];
            const recipe = recipes.find(r => r.id === recipeId) || null;
            
            week.push({
              day: DAYS[i],
              date: date.toISOString().split('T')[0],
              breakfast: null,
              lunch: null,
              dinner: recipe, // Use the only available slot
            });
          }
          setWeeklyMenu(week);
          await AsyncStorage.setItem('weeklyMenu', JSON.stringify(week));
        }
      } else {
        // Fallback to AsyncStorage or create new week
        const data = await AsyncStorage.getItem('weeklyMenu');
        if (data) {
          const parsed = JSON.parse(data);
          setWeeklyMenu(parsed);
        } else {
          const newWeek = generateEmptyWeek();
          setWeeklyMenu(newWeek);
          await saveWeeklyMenu(newWeek);
        }
      }
    } catch (error) {
      console.error('Haftalık menu yüklenirken hata:', error);
      // Fallback to AsyncStorage
      try {
        const data = await AsyncStorage.getItem('weeklyMenu');
        if (data) {
          const parsed = JSON.parse(data);
          setWeeklyMenu(parsed);
        } else {
          const newWeek = generateEmptyWeek();
          setWeeklyMenu(newWeek);
          await saveWeeklyMenu(newWeek);
        }
      } catch (storageError) {
        console.error('Fallback başarısız:', storageError);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyWeek = () => {
    const week: DailyMenu[] = [];
    const startDate = currentWeekStart;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      week.push({
        day: DAYS[i],
        date: date.toISOString().split('T')[0],
        breakfast: null,
        lunch: null,
        dinner: null,
      });
    }
    return week;
  };

  const saveWeeklyMenu = async (menu: DailyMenu[]) => {
    try {
      // Save to AsyncStorage for offline support
      await AsyncStorage.setItem('weeklyMenu', JSON.stringify(menu));
      
      // Also save to backend
      const weekStart = currentWeekStart.toISOString().split('T')[0];
      const menuData: any = {
        monday_recipe_id: null,
        tuesday_recipe_id: null,
        wednesday_recipe_id: null,
        thursday_recipe_id: null,
        friday_recipe_id: null,
        saturday_recipe_id: null,
        sunday_recipe_id: null,
      };
      
      // Map meals to recipe IDs for each day
      menu.forEach((day, idx) => {
        const dayName = DAYS[idx].toLowerCase();
        // For legacy support
        const recipeId = (day.breakfast?.id || day.lunch?.id || day.dinner?.id) || null;
        menuData[`${dayName}_recipe`] = recipeId;
      });
      
      // Store full JSON data
      menuData.menu_data = menu;
      
      await apiService.createWeeklyMenu(weekStart, menuData).catch((error) => {
        console.warn('Backend kaydedilirken hata, sadece local\'da kaydedildi:', error);
        throw error;
      });
      
      Alert.alert('Başarılı', 'Haftalık menü kaydedildi!');
      console.log('✅ Haftalık menu kaydedildi');
    } catch (error) {
      console.error('Kaydetme hatası:', error);
    }
  };

  const assignRecipeToMeal = (recipeId: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const updated = [...weeklyMenu];
    if (selectedDay !== null) {
      (updated[selectedDay] as any)[mealType] = recipe;
      setWeeklyMenu(updated);
      setShowRecipeModal(false);
      setSelectedMealType(null);
      console.log(`✓ ${recipe.name} - ${DAYS[selectedDay]} ${MEAL_LABELS[mealType]}'a atandı`);
    }
  };

  const removeMeal = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    const updated = [...weeklyMenu];
    const mealName = (updated[dayIndex] as any)[mealType]?.name;
    
    (updated[dayIndex] as any)[mealType] = null;
    setWeeklyMenu(updated);
    console.log(`🗑️ ${mealName} kaldırıldı`);
  };

  const renderRecipeSelection = () => (
    <Modal
      visible={showRecipeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowRecipeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {DAYS[selectedDay]} - {selectedMealType && MEAL_LABELS[selectedMealType]}
            </Text>
            <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={recipes}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recipeOption}
                onPress={() => assignRecipeToMeal(item.id, selectedMealType!)}
              >
                <Text style={styles.recipeEmoji}>{item.emoji || '🍽️'}</Text>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.recipeMeta}>
                    {item.category} • ⏱️ {item.cook_time} dk
                  </Text>
                </View>
                <Text style={styles.recipeArrow}>→</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.recipesList}
          />
        </View>
      </View>
    </Modal>
  );

  const renderMealSlot = (
    dayIndex: number,
    mealType: 'breakfast' | 'lunch' | 'dinner'
  ) => {
    const meal = (weeklyMenu[dayIndex] as any)?.[mealType];
    
    return (
      <TouchableOpacity
        style={[styles.mealSlot, meal && styles.mealSlotFilled]}
        onPress={() => {
          setSelectedDay(dayIndex);
          setSelectedMealType(mealType);
          setShowRecipeModal(true);
        }}
      >
        {meal ? (
          <LinearGradient
            colors={['#fff5e6', '#ffe6cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mealContent}
          >
            <Text style={styles.mealEmoji}>{meal.emoji || '🍽️'}</Text>
            <Text style={styles.mealName} numberOfLines={2}>
              {meal.name}
            </Text>
            <Text style={styles.mealTime}>⏱️ {meal.cook_time} dk</Text>
            
            {/* Delete Button - X */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                removeMeal(dayIndex, mealType);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <View style={styles.mealPlaceholder}>
            <Text style={styles.mealPlaceholderText}>+</Text>
            <Text style={styles.mealPlaceholderLabel}>{MEAL_LABELS[mealType]}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDay = (dayIndex: number) => {
    const day = weeklyMenu[dayIndex];
    if (!day) return null;

    return (
      <View key={dayIndex} style={styles.dayCard}>
        <LinearGradient
          colors={['#f0fdf4', '#dcfce7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dayHeader}
        >
          <View>
            <Text style={styles.dayName}>{day.day}</Text>
            <Text style={styles.dayDate}>{new Date(day.date).toLocaleDateString('tr-TR')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.mealsContainer}>
          {MEAL_TYPES.map((mealType) =>
            renderMealSlot(dayIndex, mealType)
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>📅 Haftalık Menu</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
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
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>📅 Haftalık Menu</Text>
            <Text style={styles.headerSubtitle}>Öğünleri düzenle ve kaydet</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>🛒 Dön</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => saveWeeklyMenu(weeklyMenu)}
            >
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* DEBUG: Show current state */}
      {weeklyMenu.length === 0 && (
        <View style={{ padding: 10, backgroundColor: '#FEE2E2' }}>
          <Text style={{ color: '#DC2626', fontSize: 12 }}>⚠️ Hafta boş durumda</Text>
        </View>
      )}
      {weeklyMenu.some((day: any) => day.breakfast || day.lunch || day.dinner) && (
        <View style={{ padding: 10, backgroundColor: '#DBEAFE' }}>
          <Text style={{ color: '#0369A1', fontSize: 12 }}>✓ Tarifler mevcut</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {weeklyMenu.map((_, index) => renderDay(index))}
      </ScrollView>

      {renderRecipeSelection()}
    </Animated.View>
  );
};

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

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
  headerContent: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  saveButtonText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 16,
    paddingBottom: 80,
  },
  dayCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    elevation: 3,
  },
  dayHeader: {
    padding: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  mealsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    gap: 10,
  },
  mealSlot: {
    minHeight: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mealSlotFilled: {
    minHeight: 120,
  },
  mealPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealPlaceholderText: {
    fontSize: 28,
    color: '#D1D5DB',
    fontWeight: '200',
  },
  mealPlaceholderLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
  },
  mealContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mealEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
  },
  recipesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  recipeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  recipeEmoji: {
    fontSize: 24,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  recipeMeta: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  recipeArrow: {
    fontSize: 18,
    color: '#10B981',
  },
});
