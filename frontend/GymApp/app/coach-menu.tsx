import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import HamburgerMenu from '@/components/HamburgerMenu';
import { API_ENDPOINTS } from '@/constants/api';

interface CoachPost {
  _id: string;
  fullname: string;
  description: string;
  experience: string;
  duration: string;
  fee: number;
  contactNumber: string;
  coachId: any;
}

export default function CoachScreen() {
  const [coachPosts, setCoachPosts] = useState<CoachPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleProfilePress = () => {
    router.back();
  };

  const fetchAllCoachPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.COACHPOST_GET_ALL);
      const data = await response.json();

      if (response.ok && data.coachPosts) {
        setCoachPosts(data.coachPosts);
      } else {
        setCoachPosts([]);
      }
    } catch (err: any) {
      console.error('Error fetching coach posts:', err);
      setCoachPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAllCoachPosts();
    }, [])
  );

  const renderItem = ({ item }: { item: CoachPost }) => (
    <View style={styles.card}>
        <View style={styles.cardBody}>
            {/* Header: Name */}
            <View style={styles.headerSection}>
                <Text style={styles.title}>
                    {item.fullname}
                </Text>
            </View>

            {/* Description */}
            {item.description ? (
                <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                        {item.description}
                    </Text>
                </View>
            ) : null}

            {/* Info Row 1: Experience and Fee */}
            <View style={styles.infoRow}>
                <View style={styles.flexSection}>
                    <Text style={styles.infoLabel}>Experience</Text>
                    <Text style={styles.infoValuePrimary}>{item.experience}</Text>
                </View>
                
                <View style={[styles.flexSection, { alignItems: 'flex-end' }]}>
                    <Text style={styles.infoLabel}>Fee & Duration</Text>
                    <Text style={styles.infoValueHighlight}>Rs. {item.fee} <Text style={{fontSize: 13}}>({item.duration})</Text></Text>
                </View>
            </View>

            {/* Info Row 2: Contact Number */}
            <View style={[styles.infoRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                <View style={styles.flexSection}>
                    <Text style={styles.infoLabel}>Contact Number</Text>
                    <Text style={styles.infoValuePrimary}>{item.contactNumber}</Text>
                </View>
            </View>
        </View>
    </View>
  );

  if (loading && coachPosts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <HamburgerMenu
        pageType="user"
        onProfilePress={handleProfilePress}
      />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.pageTitle}>Coach</Text>
        </View>

        <FlatList
          data={coachPosts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={fetchAllCoachPosts}
          refreshing={loading}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
              No coach posts available
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingVertical: 15,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 12, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    overflow: 'hidden'
  },
  cardBody: { 
    padding: 15 
  },
  headerSection: {
    marginBottom: 10
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2c3e50',
    lineHeight: 24,
    textAlign: 'center'
  },
  descriptionSection: {
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  descriptionText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
    fontStyle: 'italic'
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  flexSection: {
    flex: 1
  },
  infoLabel: {
    fontSize: 11,
    color: '#95a5a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  infoValuePrimary: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600'
  },
  infoValueHighlight: { 
    fontSize: 18, 
    color: '#007bff', 
    fontWeight: 'bold' 
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
