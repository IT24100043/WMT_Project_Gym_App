import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { AuthContext } from '@/context/AuthContext';
import HamburgerMenu from '@/components/HamburgerMenu';

type FeedbackItem = {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  likes?: string[];
  dislikes?: string[];
};

const FEEDBACK_ENDPOINTS = {
  all: `${API_BASE_URL}/api/feedback/all`,
  add: `${API_BASE_URL}/api/feedback/add`,
  update: (id: string) => `${API_BASE_URL}/api/feedback/update/${id}`,
  delete: (id: string) => `${API_BASE_URL}/api/feedback/delete/${id}`,
  like: (id: string) => `${API_BASE_URL}/api/feedback/like/${id}`,
  unlike: (id: string) => `${API_BASE_URL}/api/feedback/unlike/${id}`,
};

export default function ReviewsScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState<FeedbackItem[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reviewerLabels, setReviewerLabels] = useState<Record<string, string>>({});

  const currentUserId = user?.id || user?._id || '';
  const isAdmin = user?.role === 'admin';

  const handleProfilePress = () => {
    router.back();
  };

  const currentUserEmailOrName =
    user?.userEmail ||
    user?.email ||
    user?.coachEmail ||
    user?.adminEmail ||
    user?.name ||
    user?.coachName ||
    user?.adminName ||
    'member@private';

  const screenTitle = useMemo(
    () => (editingReviewId ? 'Update Your Review' : 'Share Your Review'),
    [editingReviewId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [])
  );

  const fetchReviews = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(FEEDBACK_ENDPOINTS.all);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load reviews');
      }

      const feedbackList = Array.isArray(data) ? data : [];
      setReviews(feedbackList);
      await resolveReviewerLabels(feedbackList);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const resolveReviewerLabels = async (feedbackList: FeedbackItem[]) => {
    const unresolvedIds = [...new Set(feedbackList.map((item) => item.userId))].filter(
      (id) => !reviewerLabels[id]
    );

    if (unresolvedIds.length === 0) {
      return;
    }

    const resolvedEntries = await Promise.all(
      unresolvedIds.map(async (id) => {
        if (!id) {
          return [id, 'member@private'] as const;
        }

        if (id.includes('@')) {
          return [id, id] as const;
        }

        if (id === currentUserId) {
          return [id, currentUserEmailOrName] as const;
        }

        try {
          const response = await fetch(API_ENDPOINTS.USER_DETAILS(id));
          const data = await response.json();
          const resolvedLabel =
            data?.user?.userEmail ||
            data?.user?.email ||
            data?.user?.name ||
            data?.user?.userName ||
            'member@private';
          return [id, resolvedLabel] as const;
        } catch {
          return [id, 'member@private'] as const;
        }
      })
    );

    setReviewerLabels((prev) => {
      const next = { ...prev };
      resolvedEntries.forEach(([id, label]) => {
        next[id] = label;
      });
      return next;
    });
  };

  const validateForm = () => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login again to submit your review.');
      return false;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert('Validation', 'Please select a rating between 1 and 5 stars.');
      return false;
    }

    if (!comment.trim()) {
      Alert.alert('Validation', 'Please write a comment before submitting.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setRating(0);
    setComment('');
    setEditingReviewId(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const url = editingReviewId ? FEEDBACK_ENDPOINTS.update(editingReviewId) : FEEDBACK_ENDPOINTS.add;
      const method = editingReviewId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to save review');
      }

      Alert.alert('Success', editingReviewId ? 'Review updated successfully!' : 'Review submitted successfully!');
      resetForm();
      await fetchReviews();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unable to save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (item: FeedbackItem) => {
    if (item.userId !== currentUserId) {
      Alert.alert('Unauthorized', 'You can only edit your own reviews.');
      return;
    }

    setEditingReviewId(item._id);
    setRating(item.rating);
    setComment(item.comment);
  };

  const handleDelete = (item: FeedbackItem) => {
    const isOwner = item.userId === currentUserId;
    const allowed = isOwner || isAdmin;

    if (!allowed) {
      Alert.alert('Unauthorized', 'You are not allowed to delete this review.');
      return;
    }

    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(FEEDBACK_ENDPOINTS.delete(item._id), {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUserId,
                isAdmin,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data?.message || 'Failed to delete review');
            }

            if (editingReviewId === item._id) {
              resetForm();
            }

            Alert.alert('Success', 'Review deleted successfully');
            await fetchReviews();
          } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const handleLike = async (feedbackId: string) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login to like reviews.');
      return;
    }

    try {
      const response = await fetch(FEEDBACK_ENDPOINTS.like(feedbackId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || 'Failed to like review');
      }

      await fetchReviews();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to like review');
    }
  };

  const handleUnlike = async (feedbackId: string) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Please login to unlike reviews.');
      return;
    }

    try {
      const response = await fetch(FEEDBACK_ENDPOINTS.unlike(feedbackId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || 'Failed to unlike review');
      }

      await fetchReviews();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to unlike review');
    }
  };

  const renderStars = (selected: number, onSelect?: (value: number) => void) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= selected;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => onSelect?.(star)}
            disabled={!onSelect}
            style={styles.starButton}
          >
            <Text style={[styles.star, active ? styles.starActive : styles.starInactive]}>★</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderReviewItem = ({ item }: { item: FeedbackItem }) => {
    const canEdit = item.userId === currentUserId;
    const canDelete = item.userId === currentUserId || isAdmin;
    const reviewerLabel = reviewerLabels[item.userId] || 'member@private';
    const userLiked = item.likes?.includes(currentUserId) || false;
    const userDisliked = item.dislikes?.includes(currentUserId) || false;
    const likeCount = item.likes?.length || 0;
    const dislikeCount = item.dislikes?.length || 0;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHead}>
          <Text style={styles.reviewUser}>User: {reviewerLabel}</Text>
          <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        {renderStars(item.rating)}
        <Text style={styles.reviewComment}>{item.comment}</Text>

        <View style={styles.likeDislikeRow}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.reactionButton,
              hovered && styles.reactionButtonHover,
              pressed && styles.reactionButtonPressed,
            ]}
            onPress={() => userLiked ? handleUnlike(item._id) : handleLike(item._id)}
          >
            <MaterialCommunityIcons
              name={userLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={userLiked ? '#ef4444' : '#6b7280'}
            />
            <Text style={[styles.reactionCount, userLiked && styles.reactionCountLikeActive]}>
              {likeCount}
            </Text>
          </Pressable>
          
          <Pressable
            style={({ pressed, hovered }) => [
              styles.reactionButton,
              hovered && styles.reactionButtonHover,
              pressed && styles.reactionButtonPressed,
            ]}
            onPress={() => userDisliked ? handleLike(item._id) : handleUnlike(item._id)}
          >
            <MaterialCommunityIcons
              name={userDisliked ? 'thumb-down' : 'thumb-down-outline'}
              size={20}
              color={userDisliked ? '#f59e0b' : '#6b7280'}
            />
            <Text style={[styles.reactionCount, userDisliked && styles.reactionCountDislikeActive]}>
              {dislikeCount}
            </Text>
          </Pressable>
        </View>

        {(canEdit || canDelete) && (
          <View style={styles.actionRow}>
            {canEdit && (
              <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleStartEdit(item)}>
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
            )}

            {canDelete && (
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(item)}>
                <Text style={styles.deleteActionText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Hamburger Menu */}
      <HamburgerMenu
        pageType="user"
        onProfilePress={handleProfilePress}
      />

      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reviews</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Rating (Required)</Text>
            {renderStars(rating, setRating)}

            <Text style={styles.label}>Comment (Required)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Write your feedback here..."
              placeholderTextColor="#94a3b8"
              multiline
              value={comment}
              onChangeText={setComment}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.submitText}>{editingReviewId ? 'Update Review' : 'Submit Review'}</Text>
              </TouchableOpacity>

              {editingReviewId && (
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm} disabled={submitting}>
                  <Text style={styles.cancelText}>Cancel Edit</Text>
                </TouchableOpacity>
              )}
            </View>

          {submitting && <ActivityIndicator size="small" color="#1d4ed8" style={styles.loader} />}
        </View>

        {/* Reviews List */}
        {loading ? (
          <ActivityIndicator size="large" color="#1d4ed8" style={styles.centerLoader} />
        ) : reviews && reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {reviews.map((item) => (
              <View key={item._id}>
                {renderReviewItem({ item })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>Be the first to share your gym experience.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  reviewsList: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starButton: {
    marginRight: 6,
  },
  star: {
    fontSize: 30,
    lineHeight: 34,
  },
  starActive: {
    color: '#f59e0b',
  },
  starInactive: {
    color: '#d1d5db',
  },
  commentInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButton: {
    marginLeft: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cancelText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  loader: {
    marginTop: 10,
  },
  centerLoader: {
    marginTop: 30,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewComment: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    marginTop: 2,
  },
  likeDislikeRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  reactionButtonHover: {
    backgroundColor: '#f3f4f6',
  },
  reactionButtonPressed: {
    opacity: 0.75,
  },
  reactionCount: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  reactionCountLikeActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  reactionCountDislikeActive: {
    color: '#b45309',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#dbeafe',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionText: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteActionText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
