import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TILE_DEFINITIONS } from '../game/constants';

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ visible, onClose }: HowToPlayModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <View style={styles.dialog}>
        <View style={styles.topBar}>
          <Text style={styles.dialogTitle}>HOW TO PLAY</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close how to play modal"
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons name="close" size={20} color="#F4F7FF" />
          </Pressable>
        </View>

        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>1</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemHeader}>Swap Touching Candies</Text>
              <Text style={styles.itemBody}>
                Tap a candy to select it, then tap any adjacent neighbor (up, down, left, right). You can also directly swipe any candy towards its neighbor.
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>2</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemHeader}>Match 3 or More</Text>
              <Text style={styles.itemBody}>
                Line up 3 or more matching candies horizontally or vertically to pop them from the board and score points!
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>3</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemHeader}>Chain Reaction Cascades</Text>
              <Text style={styles.itemBody}>
                Candies above drop down into open slots, and fresh candies enter from the top. Cascades boost your score multiplier (×2, ×3, ×4)!
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.numBadge}>
              <Text style={styles.numText}>4</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemHeader}>Reach 2,500 Target Score</Text>
              <Text style={styles.itemBody}>
                Clear the level before you run out of moves (24 moves in Classic mode) or time (90s in Speed Blitz mode).
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tilesPreviewRow}>
          {([0, 1, 2, 3, 4, 5] as const).map((t) => {
            const def = TILE_DEFINITIONS[t];
            return (
              <View key={t} style={[styles.tilePreview, { backgroundColor: def.background }]}>
                <MaterialCommunityIcons name={def.icon} size={16} color={def.foreground} />
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Got it, start playing"
          onPress={onClose}
          style={({ pressed }) => [styles.gotItBtn, pressed && styles.pressed]}
        >
          <Text style={styles.gotItText}>GOT IT, LET'S PLAY</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 9, 20, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 110,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#121A33',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(179, 199, 255, 0.22)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    color: '#F4F7FF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  instructionsList: {
    gap: 14,
    marginBottom: 18,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  numBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(98, 242, 198, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(98, 242, 198, 0.4)',
    marginTop: 2,
  },
  numText: {
    color: '#62F2C6',
    fontSize: 12,
    fontWeight: '900',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemHeader: {
    color: '#F4F7FF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  itemBody: {
    color: '#9AA7C5',
    fontSize: 12,
    lineHeight: 17,
  },
  tilesPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
  },
  tilePreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItBtn: {
    backgroundColor: '#62F2C6',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItText: {
    color: '#0B1020',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
