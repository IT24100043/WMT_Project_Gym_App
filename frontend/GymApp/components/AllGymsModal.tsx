import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Text,
  ScrollView,
  Image,
} from 'react-native';

interface GymPost {
  _id: string;
  gymId: string;
  gymImg?: string;
  gymInfotmation: string;
  openHours: string;
  closeHours: string;
  gymContactNumber: string;
  city: string;
  gymFasilities: Array<{ _id?: string; fasility: string }>;
  packages: Array<{
    _id?: string;
    packageName: string;
    packagePrice: number;
    packageDuration: string;
    features: string[];
  }>;
}

interface AllGymsModalProps {
  visible: boolean;
  posts: GymPost[];
  onClose: () => void;
}

export default function AllGymsModal({ visible, posts, onClose }: AllGymsModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>All Gyms</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        <ScrollView style={styles.postsList}>
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <View key={post._id} style={styles.postCard}>
                {post.gymImg && (
                  <Image
                    source={{ uri: post.gymImg }}
                    style={styles.postImage}
                  />
                )}
                <View style={styles.postContent}>
                  {/* Gym Name */}
                  <Text style={styles.postGymName}>
                    {(post.gymId as any)?.GymName || 'Gym'}
                  </Text>

                  {/* City */}
                  <Text style={styles.postCity}>
                    <Text style={styles.label}>City: </Text>
                    {post.city}
                  </Text>

                  {/* Description */}
                  <Text style={styles.postDescription}>
                    {post.gymInfotmation}
                  </Text>

                  {/* Hours and Contact */}
                  <View style={styles.postInfoRow}>
                    <Text style={styles.postInfo}>
                      <Text style={styles.label}>Open Hours: </Text>
                      {post.openHours}
                    </Text>
                    <Text style={styles.postInfo}>
                      <Text style={styles.label}>Close Hours: </Text>
                      {post.closeHours}
                    </Text>
                    <Text style={styles.postInfoContact}>
                      <Text style={styles.label}>Contact Number: </Text>
                      {post.gymContactNumber}
                    </Text>
                  </View>

                  {/* Facilities */}
                  {post.gymFasilities && post.gymFasilities.length > 0 && (
                    <View style={styles.facilitiesSection}>
                      <Text style={styles.sectionTitle}>Facilities:</Text>
                      {post.gymFasilities.map((fac: any, idx: number) => (
                        <View key={idx} style={styles.facilityCard}>
                          <Text style={styles.facilityCardItem}>
                            ✓ {fac.fasility}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Packages */}
                  {post.packages && post.packages.length > 0 && (
                    <View style={styles.packagesSection}>
                      <Text style={styles.sectionTitle}>Available Packages:</Text>
                      {post.packages.map((pkg: any, idx: number) => (
                        <View key={idx} style={styles.packageItem}>
                          <Text style={styles.packageName}>{pkg.packageName}</Text>
                          <Text style={styles.packagePrice}>
                            <Text style={styles.label}>Price: </Text>
                            Rs. {pkg.packagePrice}
                          </Text>
                          <Text style={styles.packageDuration}>
                            <Text style={styles.label}>Duration: </Text>
                            {pkg.packageDuration}
                          </Text>
                          {pkg.features && pkg.features.length > 0 && (
                            <View style={styles.packageFeatures}>
                              <Text style={styles.label}>Features: </Text>
                              {pkg.features.map((feature: string, fIdx: number) => (
                                <Text key={fIdx} style={styles.featureItem}>
                                  ✓ {feature}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No gyms available</Text>
            </View>
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  postsList: {
    flex: 1,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postContent: {
    padding: 20,
  },
  postGymName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  postCity: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  postDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  postInfoRow: {
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  postInfo: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 6,
    fontWeight: '500',
  },
  postInfoContact: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  facilitiesSection: {
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  facilityCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  facilityCardItem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  packagesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  packageItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  packagePrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  packageDuration: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  packageFeatures: {
    marginTop: 2,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  featureItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  bottomSpacer: {
    height: 20,
  },
});
