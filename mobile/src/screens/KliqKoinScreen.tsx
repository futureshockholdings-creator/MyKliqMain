import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  kliqKoinBalance: number;
  lastCheckIn?: string;
  nextMilestone: number;
  tier: string;
}

interface KliqKoinScreenProps {
  navigation: any;
}

const STREAK_TIERS = [
  { days: 3, name: 'Starter', emoji: '🌱', koins: 10 },
  { days: 7, name: 'Rising', emoji: '⭐', koins: 25 },
  { days: 14, name: 'Dedicated', emoji: '💎', koins: 50 },
  { days: 30, name: 'Committed', emoji: '🔥', koins: 100 },
  { days: 100, name: 'Elite', emoji: '👑', koins: 300 },
  { days: 365, name: 'Master', emoji: '🏆', koins: 1000 },
  { days: 1000, name: 'Legend', emoji: '🌟', koins: 5000 },
];

const KliqKoinScreen: React.FC<KliqKoinScreenProps> = ({ navigation }) => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getStreakData();
      setStreakData(response || {
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        kliqKoinBalance: 0,
        tier: 'Starter',
        nextMilestone: 3,
      });
    } catch (error) {
      console.error('Error loading streak data:', error);
      // Fallback to default data
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        kliqKoinBalance: 0,
        tier: 'Starter',
        nextMilestone: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const response = await ApiService.checkIn();
      setStreakData(response);
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const getCurrentTier = () => {
    if (!streakData) return STREAK_TIERS[0];
    for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
      if (streakData.currentStreak >= STREAK_TIERS[i].days) {
        return STREAK_TIERS[i];
      }
    }
    return STREAK_TIERS[0];
  };

  const getNextTier = () => {
    if (!streakData) return STREAK_TIERS[1];
    for (let i = 0; i < STREAK_TIERS.length; i++) {
      if (streakData.currentStreak < STREAK_TIERS[i].days) {
        return STREAK_TIERS[i];
      }
    }
    return STREAK_TIERS[STREAK_TIERS.length - 1];
  };

  const canCheckIn = () => {
    if (!streakData?.lastCheckIn) return true;
    const lastCheckIn = new Date(streakData.lastCheckIn);
    const now = new Date();
    const diffInHours = (now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
    return diffInHours >= 24;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Loading your streak...</Text>
      </View>
    );
  }

  if (!streakData) return null;

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progressToNext = streakData.currentStreak / nextTier.days;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey {user?.firstName}! 👋</Text>
        <View style={styles.koinBalance}>
          <Text style={styles.koinIcon}>🪙</Text>
          <Text style={styles.koinAmount}>{streakData.kliqKoinBalance}</Text>
          <Text style={styles.koinLabel}>Kliq Koins</Text>
        </View>
      </View>

      {/* Current Streak */}
      <View style={styles.streakCard}>
        <Text style={styles.streakEmoji}>{currentTier.emoji}</Text>
        <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
        <Text style={styles.tierName}>{currentTier.name} Tier</Text>
      </View>

      {/* Check-In Button */}
      <TouchableOpacity
        style={[styles.checkInButton, !canCheckIn() && styles.checkInButtonDisabled]}
        onPress={handleCheckIn}
        disabled={!canCheckIn() || checkingIn}
      >
        {checkingIn ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Text style={styles.checkInIcon}>✓</Text>
            <Text style={styles.checkInText}>
              {canCheckIn() ? 'Check In Today' : 'Come Back Tomorrow'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Progress to Next Tier */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {streakData.currentStreak}/{nextTier.days} days to {nextTier.name}
          </Text>
          <Text style={styles.progressEmoji}>{nextTier.emoji}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressToNext * 100}%` }]} />
        </View>
        <Text style={styles.progressReward}>
          Reward: +{nextTier.koins} Kliq Koins
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakData.longestStreak}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{streakData.totalCheckIns}</Text>
          <Text style={styles.statLabel}>Total Check-Ins</Text>
        </View>
      </View>

      {/* All Tiers */}
      <View style={styles.tiersSection}>
        <Text style={styles.tiersTitle}>All Streak Tiers</Text>
        {STREAK_TIERS.map((tier, index) => {
          const isUnlocked = streakData.currentStreak >= tier.days;
          const isCurrent = currentTier.days === tier.days;
          
          return (
            <View
              key={index}
              style={[
                styles.tierItem,
                isCurrent && styles.tierItemCurrent,
                !isUnlocked && styles.tierItemLocked,
              ]}
            >
              <Text style={styles.tierEmoji}>{tier.emoji}</Text>
              <View style={styles.tierInfo}>
                <Text style={[styles.tierItemName, !isUnlocked && styles.tierItemNameLocked]}>
                  {tier.name}
                </Text>
                <Text style={styles.tierDays}>{tier.days} days</Text>
              </View>
              <Text style={[styles.tierKoins, !isUnlocked && styles.tierKoinsLocked]}>
                +{tier.koins} 🪙
              </Text>
            </View>
          );
        })}
      </View>

      {/* Marketplace Button */}
      <TouchableOpacity
        style={styles.marketplaceButton}
        onPress={() => {/* TODO: Navigate to marketplace */}}
      >
        <Text style={styles.marketplaceText}>Browse Border Marketplace 🛒</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  koinBalance: {
    alignItems: 'center',
  },
  koinIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  koinAmount: {
    color: '#00FF00',
    fontSize: 48,
    fontWeight: 'bold',
  },
  koinLabel: {
    color: '#888',
    fontSize: 16,
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FF00',
    marginBottom: 20,
  },
  streakEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  streakNumber: {
    color: '#00FF00',
    fontSize: 72,
    fontWeight: 'bold',
  },
  streakLabel: {
    color: '#888',
    fontSize: 18,
    marginTop: 4,
  },
  tierName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  checkInButton: {
    backgroundColor: '#00FF00',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkInButtonDisabled: {
    backgroundColor: '#333',
  },
  checkInIcon: {
    fontSize: 24,
    color: '#000',
    marginRight: 8,
  },
  checkInText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  progressSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    color: '#fff',
    fontSize: 16,
  },
  progressEmoji: {
    fontSize: 24,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 5,
  },
  progressReward: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    color: '#00FF00',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  tiersSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  tiersTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  tierItemCurrent: {
    borderColor: '#00FF00',
    borderWidth: 2,
  },
  tierItemLocked: {
    opacity: 0.5,
  },
  tierEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  tierInfo: {
    flex: 1,
  },
  tierItemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tierItemNameLocked: {
    color: '#666',
  },
  tierDays: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  tierKoins: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: '600',
  },
  tierKoinsLocked: {
    color: '#666',
  },
  marketplaceButton: {
    backgroundColor: '#333',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#666',
  },
  marketplaceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default KliqKoinScreen;