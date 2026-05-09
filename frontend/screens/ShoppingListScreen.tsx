/**
 * ShoppingListScreen - Alışveriş Listesi
 * Malzeme ekle/sil/işaretle, kategori bazlı görüntüleme
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

type RootStackParamList = {
  ShoppingMain: undefined;
  Weekly: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ShoppingMain'>;

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  unit: string; // kg, adet, litre, vs
  category: string;
  isChecked: boolean;
  createdAt: number;
}

const CATEGORIES = ['Sebze', 'Meyve', 'Et/Balık', 'Süt Ürünleri', 'Baharatlar', 'Diğer'];
const UNITS = ['adet', 'kg', 'g', 'litre', 'ml', 'paket'];

export const ShoppingListScreen: React.FC<Props> = ({ navigation }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [filteredList, setFilteredList] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['Tümü']));

  // Input fields
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnit, setItemUnit] = useState('adet');
  const [itemCategory, setItemCategory] = useState('Sebze');
  const [showAddForm, setShowAddForm] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Clean up old AsyncStorage data without category field
      const cleanupOldData = async () => {
        try {
          const data = await AsyncStorage.getItem('shoppingList');
          if (data) {
            const parsed = JSON.parse(data);
            // Check if any items are missing category field
            const hasOldFormat = parsed.some((item: any) => !item.category || item.category === undefined);
            if (hasOldFormat) {
              console.log('🧹 Eski format data bulundu, temizleniyor...');
              await AsyncStorage.removeItem('shoppingList');
            }
          }
        } catch (e) {
          // Ignore
        }
      };

      cleanupOldData();
      loadShoppingList();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const loadShoppingList = async () => {
    try {
      setLoading(true);
      console.log('📥 Backend\'ten alışveriş listesi yükleniyor...');

      // Try to load from backend first
      const items = await apiService.getShoppingItems();
      console.log('📡 Backend response:', items);

      // Transform backend response to match frontend interface
      const transformed = items.map((item: any) => {
        const category = (item.category || 'Diğer').trim(); // Ensure no whitespace
        return {
          id: item.id.toString(),
          name: item.item_name,
          quantity: item.amount || '1',
          unit: item.unit || 'adet',
          category: category,
          isChecked: item.is_checked || false,
          createdAt: new Date(item.created_at).getTime(),
        };
      });

      console.log('✅ Backend transformed:', transformed.map(i => `${i.name} (${i.category})`));
      setShoppingList(transformed);

      // Also sync to AsyncStorage
      await AsyncStorage.setItem('shoppingList', JSON.stringify(transformed));
      console.log(`✅ ${transformed.length} malzeme backend'den yüklendi:`, transformed.map(i => `${i.name} (${i.category})`));
    } catch (error) {
      console.warn('⚠️  Backend yüklenirken hata:', error);
      console.warn('📦 AsyncStorage fallback\'e geçiliyor...');

      // Fallback to AsyncStorage
      try {
        const data = await AsyncStorage.getItem('shoppingList');
        if (data) {
          const parsed = JSON.parse(data);
          // Normalize all categories
          const normalized = parsed.map((item: any) => ({
            ...item,
            category: (item.category || 'Diğer').trim()
          }));
          console.log('📦 AsyncStorage data:', normalized.map((i: any) => ({ name: i.name, category: i.category })));
          setShoppingList(normalized);
          console.log(`✅ ${normalized.length} malzeme local'dan yüklendi:`, normalized.map((i: any) => `${i.name} (${i.category})`));
        } else {
          console.log('❌ AsyncStorage boş');
          setShoppingList([]);
        }
      } catch (storageError) {
        console.error('❌ AsyncStorage yüklenirken hata:', storageError);
        setShoppingList([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveShoppingList = async (updatedList: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(updatedList));
      console.log(`💾 Alışveriş listesi kaydedildi (${updatedList.length} item)`);
    } catch (error) {
      console.error('Kaydetme hatası:', error);
    }
  };

  useEffect(() => {
    console.log(`🔄 useEffect triggered`);
    console.log(`   selectedCategories: ${Array.from(selectedCategories).join(', ')}`);
    console.log(`   shoppingList.length: ${shoppingList.length}`);

    let filtered = [...shoppingList];

    // Eğer "Tümü" seçiliyse tümünü göster
    if (selectedCategories.has('Tümü')) {
      console.log(`   ✅ Tümü seçili: ${filtered.length} item`);
    } else if (selectedCategories.size > 0) {
      const beforeCount = filtered.length;

      filtered = filtered.filter(item => {
        const itemCatNormalized = (item.category || '').trim();
        const isMatched = Array.from(selectedCategories).some(selectedCat => {
          return itemCatNormalized === selectedCat.trim();
        });
        return isMatched;
      });

      const selectedList = Array.from(selectedCategories).join(', ');
      console.log(`   ✅ Filtreleme uygulandı: [${selectedList}] → ${beforeCount} → ${filtered.length} item`);
    } else {
      console.log(`   ℹ️  Hiçbir kategori seçilmedi`);
    }

    // Kontrol edilmeyenler üste gelsin
    filtered.sort((a, b) => {
      if (a.isChecked === b.isChecked) {
        return b.createdAt - a.createdAt;
      }
      return a.isChecked ? 1 : -1;
    });

    console.log(`🔍 Filtreleme sonucu: ${filtered.length} item (toplam: ${shoppingList.length})`);
    setFilteredList(filtered);
  }, [selectedCategories, shoppingList]);

  const addItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Uyarı', 'Lütfen malzeme adı girin');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      quantity: itemQuantity || '1',
      unit: itemUnit,
      category: itemCategory.trim(), // Ensure category is trimmed
      isChecked: false,
      createdAt: Date.now(),
    };

    // Add to backend
    apiService.addShoppingItem(
      newItem.name,
      parseFloat(newItem.quantity),
      newItem.unit,
      undefined, // No recipe ID
      newItem.category
    ).catch((error) => {
      console.warn('Backend eklenemedi, sadece local\'da eklendi:', error);
    });

    const updated = [newItem, ...shoppingList];
    setShoppingList(updated);
    saveShoppingList(updated);

    // Form temizle
    setItemName('');
    setItemQuantity('1');
    setItemUnit('adet');
    setItemCategory('Sebze');
    setShowAddForm(false);
    Keyboard.dismiss();

    console.log(`✅ "${newItem.name}" eklendi`);
  };

  const toggleItem = (id: string) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    // Update backend
    apiService.updateShoppingItem(parseInt(id), { is_checked: !item.isChecked }).catch((error) => {
      console.warn('Backend güncellenirken hata:', error);
    });

    const updated = shoppingList.map(i =>
      i.id === id ? { ...i, isChecked: !i.isChecked } : i
    );
    setShoppingList(updated);
    saveShoppingList(updated);
    console.log(`✓ Malzeme işaretlendi: ${item.name}`);
  };

  const deleteItem = (id: string, name: string) => {
    // Delete from backend
    apiService.deleteShoppingItem(parseInt(id)).catch((error) => {
      console.warn('Backend silinirken hata:', error);
    });

    // Remove from list immediately (no confirmation)
    const updated = shoppingList.filter(item => item.id !== id);
    setShoppingList(updated);
    saveShoppingList(updated);
    console.log(`🗑️ "${name}" silindi`);
  };

  const clearCheckedItems = () => {
    const performDelete = () => {
      // Clear checked items in backend
      apiService.clearCheckedShoppingItems().catch((error) => {
        console.warn('Backend temizlenirken hata:', error);
      });

      const updated = shoppingList.filter(item => !item.isChecked);
      setShoppingList(updated);
      saveShoppingList(updated);

      if (Platform.OS === 'web') {
        window.alert('İşaretli öğeler silindi');
      } else {
        Alert.alert('Başarılı', 'İşaretli öğeler silindi');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Satın alınan tüm öğeler silinecek. Emin misiniz?')) {
        performDelete();
      }
    } else {
      Alert.alert(
        'İşaretli Öğeleri Sil',
        'Satın alınan tüm öğeler silinecek. Emin misiniz?',
        [
          { text: 'İptal', onPress: () => { } },
          {
            text: 'Sil',
            onPress: performDelete,
            style: 'destructive',
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View key={item.id} style={styles.itemContainer}>
      <LinearGradient
        colors={item.isChecked ? ['#F3F4F6', '#E5E7EB'] : ['#fff5e6', '#ffe6cc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.itemGradient}
      >
        {/* Checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            item.isChecked && styles.checkboxChecked,
          ]}
          onPress={() => toggleItem(item.id)}
          activeOpacity={0.7}
        >
          {item.isChecked && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.itemContent}>
          <Text
            style={[
              styles.itemName,
              item.isChecked && styles.itemNameChecked,
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={styles.quantity}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteItem(item.id, item.name)}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🛒</Text>
      <Text style={styles.emptyText}>Alışveriş listesi boş</Text>
      <Text style={styles.emptySubtext}>Malzeme ekleyerek başlayın</Text>
    </View>
  );

  const checkedCount = shoppingList.filter(item => item.isChecked).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🛒 Alışveriş Listesi</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🛒 Alışveriş Listesi</Text>
          <Text style={styles.headerSubtitle}>
            {shoppingList.length} malzeme ({checkedCount} satın alındı)
          </Text>
        </LinearGradient>

        {/* Category Filter */}
        {shoppingList.length > 0 && (
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              decelerationRate="fast"
              contentContainerStyle={styles.filterContent}
              scrollEnabled={true}
            >
              {['Tümü', ...CATEGORIES].map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    const newCategories = new Set(selectedCategories);

                    if (category === 'Tümü') {
                      // Tümü seçilince diğer seçimleri temizle
                      newCategories.clear();
                      newCategories.add('Tümü');
                      console.log(`📌 "Tümü" seçildi - Tüm kategoriler gösterilecek`);
                    } else {
                      // Tümü seçili ise kaldır
                      newCategories.delete('Tümü');

                      if (newCategories.has(category)) {
                        // Zaten seçili ise kaldır
                        newCategories.delete(category);
                        console.log(`📌 "${category}" seçimi kaldırıldı`);
                      } else {
                        // Seçili değilse ekle
                        newCategories.add(category);
                        console.log(`📌 "${category}" seçildi`);
                      }

                      // Eğer hiç kategori seçili değilse Tümü'nü ekle
                      if (newCategories.size === 0) {
                        newCategories.add('Tümü');
                        console.log(`📌 Hiç kategori seçilmedi - "Tümü" etkin hale getirildi`);
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
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content - Scrollable Area */}
        <ScrollView
          style={styles.content}
        >
          {/* Add Form - At Top */}
          {showAddForm && (
            <View style={styles.formContainerInline}>
              {/* Name Input */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Malzeme Adı *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="örn: Domates, Soğan..."
                  placeholderTextColor="#999"
                  value={itemName}
                  onChangeText={setItemName}
                  autoFocus={true}
                />
              </View>

              {/* Quantity Input */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Miktar</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor="#999"
                    value={itemQuantity}
                    onChangeText={setItemQuantity}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Unit Select */}
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>Birim</Text>
                  <View style={styles.unitSelectContainer}>
                    {UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          itemUnit === unit && styles.unitButtonActive,
                        ]}
                        onPress={() => setItemUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.unitButtonText,
                            itemUnit === unit && styles.unitButtonTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Category Select */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Kategori</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        itemCategory === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setItemCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          itemCategory === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={addItem}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}
                >
                  <Text style={styles.submitButtonText}>✓ Ekle</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ height: 10 }} />
            </View>
          )}

          {/* Shopping List Items */}
          {filteredList.length > 0 ? (
            <View style={styles.listContainer}>
              {filteredList.map((item) => renderItem({ item }))}
            </View>
          ) : (
            renderEmpty()
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Action Buttons - Fixed at Bottom */}
        <View style={styles.actionBar}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.weeklyButton}
              onPress={() => navigation.navigate('Weekly')}
              activeOpacity={0.6}
            >
              <Text style={styles.weeklyButtonText}>📅 Haftalık Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addButton,
                showAddForm && styles.addButtonActive,
              ]}
              onPress={() => setShowAddForm(!showAddForm)}
              activeOpacity={0.6}
            >
              <Text style={styles.addButtonText}>
                {showAddForm ? '✕' : '➕'}
              </Text>
            </TouchableOpacity>
          </View>

          {checkedCount > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCheckedItems}
              activeOpacity={0.6}
            >
              <Text style={styles.clearButtonText}>
                ✓ {checkedCount} öğe satın alındı - Sil
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
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
  itemContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  itemGradient: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemNameChecked: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  quantity: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  category: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#EF4444',
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weeklyButton: {
    flex: 1,
    backgroundColor: '#F0E7FF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  weeklyButtonText: {
    color: '#7C3AED',
    fontSize: 13,
    fontWeight: '700',
  },
  clearButton: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    width: 50,
    height: 50,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: '#059669',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  formContainer: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    maxHeight: 400,
  },
  formContainerInline: {
    backgroundColor: '#FFF',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formScroll: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  unitSelect: {
    flexDirection: 'row',
  },
  unitSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  unitButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  unitButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#FFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#FFF',
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
