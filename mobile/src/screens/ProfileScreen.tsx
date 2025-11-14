import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ProfileItem = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.profileItem}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'Not set'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.profileImageUrl ? (
            <Image 
              source={{ uri: user.profileImageUrl }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        
        {user?.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
        
        {user?.kliqName && (
          <View style={styles.kliqBadge}>
            <Text style={styles.kliqText}>{user.kliqName}</Text>
          </View>
        )}
      </View>

      {/* Profile Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        
        <ProfileItem label="Phone Number" value={user?.phoneNumber} />
        <ProfileItem label="Email" value={user?.email} />
        
        {user?.interests && user.interests.length > 0 && (
          <View style={styles.profileItem}>
            <Text style={styles.label}>Interests</Text>
            <View style={styles.tagsContainer}>
              {user.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {user?.hobbies && user.hobbies.length > 0 && (
          <View style={styles.profileItem}>
            <Text style={styles.label}>Hobbies</Text>
            <View style={styles.tagsContainer}>
              {user.hobbies.map((hobby, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.kliqKoinButton]}
          onPress={() => navigation.navigate('KliqKoinScreen')}
        >
          <Text style={styles.actionText}>Kliq Koin & Streaks</Text>
          <Text style={styles.actionIcon}>🪙</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Edit Profile</Text>
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Settings</Text>
          <Text style={styles.actionIcon}>⚙️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Help & Support</Text>
          <Text style={styles.actionIcon}>❓</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
          <Text style={styles.actionIcon}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.appInfo}>MyKliq Mobile v1.0</Text>
        <Text style={styles.appInfo}>Your Private Social Circle</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  kliqBadge: {
    backgroundColor: '#00FF00',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kliqText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00FF00',
    marginBottom: 16,
  },
  profileItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  kliqKoinButton: {
    borderColor: '#00FF00',
    borderWidth: 2,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
  },
  actionIcon: {
    fontSize: 18,
  },
  logoutButton: {
    borderColor: '#ff4757',
  },
  logoutText: {
    color: '#ff4757',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  appInfo: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default ProfileScreen;