import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';

interface IngredientInputProps {
  ingredients: string[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (index: number) => void;
}

export const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onAddIngredient,
  onRemoveIngredient,
}) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim() && ingredients.length < 6) {
      onAddIngredient(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (nativeEvent: any) => {
    if (nativeEvent.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧂 Dolabında ne var?</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Malzeme ekle..."
          placeholderTextColor="#9CA3AF"
          maxLength={20}
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={!input.trim() || ingredients.length >= 6}
          style={[
            styles.addBtn,
            (!input.trim() || ingredients.length >= 6) && styles.addBtnDisabled,
          ]}
        >
          <Text style={styles.addBtnText}>➕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.chip}>
            <Text style={styles.chipText}>{ingredient}</Text>
            <TouchableOpacity
              onPress={() => onRemoveIngredient(index)}
              style={styles.removeBtn}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {ingredients.length === 0 && (
        <Text style={styles.helperText}>
          En az 1, en fazla 6 malzeme ekle
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  addBtn: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addBtnText: {
    fontSize: 18,
    fontWeight: '600',
  },
  chipScroll: {
    marginBottom: 8,
    minHeight: 40,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  removeBtn: {
    padding: 2,
  },
  removeBtnText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
