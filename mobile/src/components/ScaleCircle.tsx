import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

interface ScaleCircleProps {
  value: number;
  onChange: (value: number) => void;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width - 80, 240);
const CENTER_X = CIRCLE_SIZE / 2;
const CENTER_Y = CIRCLE_SIZE / 2;
const RADIUS = CIRCLE_SIZE / 2.5;

export function ScaleCircle({ value, onChange }: ScaleCircleProps) {
  const numbers = [1, 2, 3, 4, 5];
  const angleSlice = (360 / numbers.length) * (Math.PI / 180);

  // Calcula posição de cada número em torno do círculo
  const getPosition = (index: number) => {
    const angle = -Math.PI / 2 + angleSlice * index;
    const x = CENTER_X + RADIUS * Math.cos(angle);
    const y = CENTER_Y + RADIUS * Math.sin(angle);
    return { x, y };
  };

  const renderSlices = () => {
    return numbers.map((num, index) => {
      const pos = getPosition(index);
      const isSelected = value === num;

      return (
        <TouchableOpacity
          key={num}
          onPress={() => onChange(num)}
          style={[
            styles.numberButton,
            {
              left: pos.x - 28,
              top: pos.y - 28,
            },
            isSelected && styles.numberButtonSelected,
          ]}
          activeOpacity={0.8}
        >
          <View style={[styles.numberCircle, isSelected && styles.numberCircleSelected]}>
            <Text
              style={[
                styles.numberText,
                isSelected && styles.numberTextSelected,
              ]}
            >
              {num}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderLines = () => {
    return numbers.map((_, index) => {
      const pos = getPosition(index);
      const angle = -Math.PI / 2 + angleSlice * index;
      const lineStartX = CENTER_X + (RADIUS * 0.5) * Math.cos(angle);
      const lineStartY = CENTER_Y + (RADIUS * 0.5) * Math.sin(angle);
      const lineEndX = CENTER_X + RADIUS * Math.cos(angle);
      const lineEndY = CENTER_Y + RADIUS * Math.sin(angle);

      return (
        <View
          key={`line-${index}`}
          style={[
            styles.line,
            {
              position: 'absolute',
              left: CENTER_X,
              top: CENTER_Y,
              width: 1,
              height: RADIUS * 0.5,
              backgroundColor: '#cbd5e1',
              opacity: 0.3,
              transform: [
                { rotate: `${(angle * 180) / Math.PI + 90}deg` },
                { translateY: -RADIUS * 0.25 },
              ],
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circleContainer,
          {
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
          },
        ]}
      >
        {/* Centro do círculo */}
        <View style={styles.centerDot} />

        {/* Linhas radiais */}
        {renderLines()}

        {/* Números */}
        {renderSlices()}
      </View>

      {/* Exibição do valor selecionado */}
      {value && (
        <View style={styles.selectedValueContainer}>
          <Text style={styles.selectedValueLabel}>Selecionado:</Text>
          <Text style={styles.selectedValue}>{value}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  circleContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    zIndex: 10,
  },
  line: {
    position: 'absolute',
  },
  numberButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonSelected: {
    // Efeito de seleção
  },
  numberCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberCircleSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  numberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748b',
  },
  numberTextSelected: {
    color: '#fff',
    fontSize: 22,
  },
  selectedValueContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectedValueLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
  },
});
