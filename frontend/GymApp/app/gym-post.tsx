import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

interface GymPostData {
  description: string;
  openHours: string;
  closeHours: string;
  contactNumber: string;
  city: string;
  facilities: string[];
  packages: Array<{
    name: string;
    price: string;
    duration: string;
    features: string[];
  }>;
}

export default function GymPostScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [gymImage, setGymImage] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Time input states for opening hours
  const [openHoursHour, setOpenHoursHour] = useState('');
  const [openHoursMinute, setOpenHoursMinute] = useState('');
  const [openHoursPeriod, setOpenHoursPeriod] = useState<'AM' | 'PM'>('AM');

  // Time input states for closing hours
  const [closeHoursHour, setCloseHoursHour] = useState('');
  const [closeHoursMinute, setCloseHoursMinute] = useState('');
  const [closeHoursPeriod, setCloseHoursPeriod] = useState<'AM' | 'PM'>('PM');

  const [formData, setFormData] = useState<GymPostData>({
    description: '',
    openHours: '',
    closeHours: '',
    contactNumber: '',
    city: '',
    facilities: [''],
    packages: [
      {
        name: '',
        price: '',
        duration: '',
        features: [''],
      },
    ],
  });

  // Helper function to format time
  const formatTime = (hour: string, minute: string, period: 'AM' | 'PM'): string => {
    if (!hour || !minute) return '';
    const paddedHour = hour.padStart(2, '0');
    const paddedMinute = minute.padStart(2, '0');
    return `${paddedHour}:${paddedMinute} ${period}`;
  };

  // Validation function for time inputs
  const isValidTimeInput = (hour: string, minute: string): boolean => {
    if (!hour || !minute) return false;
    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);
    return hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'gym-image.jpg';
      
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      formData.append('upload_preset', 'gym_logo');
      formData.append('cloud_name', 'dcahmv4lj');

      console.log('Uploading image to Cloudinary...');
      const response = await fetch('https://api.cloudinary.com/v1_1/dcahmv4lj/image/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Cloudinary response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid response from Cloudinary');
      }
      
      if (!response.ok) {
        console.error('Cloudinary error:', data);
        throw new Error(data.error?.message || `Upload failed: ${response.status}`);
      }

      if (data.secure_url) {
        console.log('Image uploaded successfully:', data.secure_url);
        setGymImage(data.secure_url);
        return data.secure_url;
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      Alert.alert('Upload Error', `Failed to upload image: ${error}`);
      return null;
    }
  };

  const handleAddFacility = () => {
    setFormData({
      ...formData,
      facilities: [...formData.facilities, ''],
    });
  };

  const handleRemoveFacility = (index: number) => {
    const newFacilities = formData.facilities.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      facilities: newFacilities.length > 0 ? newFacilities : [''],
    });
  };

  const handleUpdateFacility = (index: number, value: string) => {
    const newFacilities = [...formData.facilities];
    newFacilities[index] = value;
    setFormData({
      ...formData,
      facilities: newFacilities,
    });
  };

  const handleAddPackage = () => {
    setFormData({
      ...formData,
      packages: [
        ...formData.packages,
        {
          name: '',
          price: '',
          duration: '',
          features: [''],
        },
      ],
    });
  };

  const handleRemovePackage = (index: number) => {
    const newPackages = formData.packages.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      packages: newPackages.length > 0 ? newPackages : [
        {
          name: '',
          price: '',
          duration: '',
          features: [''],
        },
      ],
    });
  };

  const handleUpdatePackage = (
    packageIndex: number,
    field: string,
    value: string
  ) => {
    const newPackages = [...formData.packages];
    (newPackages[packageIndex] as any)[field] = value;
    setFormData({
      ...formData,
      packages: newPackages,
    });
  };

  const handleAddPackageFeature = (packageIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features.push('');
    setFormData({
      ...formData,
      packages: newPackages,
    });
  };

  const handleUpdatePackageFeature = (
    packageIndex: number,
    featureIndex: number,
    value: string
  ) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features[featureIndex] = value;
    setFormData({
      ...formData,
      packages: newPackages,
    });
  };

  const handleRemovePackageFeature = (packageIndex: number, featureIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features = newPackages[packageIndex].features.filter(
      (_, i) => i !== featureIndex
    );
    if (newPackages[packageIndex].features.length === 0) {
      newPackages[packageIndex].features = [''];
    }
    setFormData({
      ...formData,
      packages: newPackages,
    });
  };

  const handleSubmit = async () => {
    try {
      if (!gymImage && !imageUri) {
        Alert.alert('Error', 'Please add an image for the gym post');
        return;
      }

      if (!formData.description.trim()) {
        Alert.alert('Error', 'Please enter description');
        return;
      }

      // Validate opening hours
      if (!isValidTimeInput(openHoursHour, openHoursMinute)) {
        Alert.alert('Error', 'Please enter valid opening hours (Hour: 1-12, Minute: 0-59)');
        return;
      }

      // Validate closing hours
      if (!isValidTimeInput(closeHoursHour, closeHoursMinute)) {
        Alert.alert('Error', 'Please enter valid closing hours (Hour: 1-12, Minute: 0-59)');
        return;
      }

      if (!formData.contactNumber.trim() || !formData.city.trim()) {
        Alert.alert('Error', 'Please enter contact number and city');
        return;
      }

      // Validate contact number - must be exactly 10 digits
      const cleanedContactNumber = formData.contactNumber.replace(/\D/g, '');
      if (cleanedContactNumber.length !== 10) {
        Alert.alert('Error', 'Contact number must contain exactly 10 digits');
        return;
      }

      setLoading(true);

      // Format the time strings
      const formattedOpenHours = formatTime(openHoursHour, openHoursMinute, openHoursPeriod);
      const formattedCloseHours = formatTime(closeHoursHour, closeHoursMinute, closeHoursPeriod);

      let imageUrl = gymImage;
      if (!imageUrl && imageUri) {
        imageUrl = await uploadImageToCloudinary(imageUri);
      }

      const facilityArray = formData.facilities
        .filter((f) => f.trim())
        .map((facility) => ({
          fasility: facility,
        }));

      const packageArray = formData.packages
        .filter((p) => p.name.trim())
        .map((pkg) => ({
          packageName: pkg.name,
          packagePrice: parseFloat(pkg.price) || 0,
          packageDuration: pkg.duration,
          features: pkg.features.filter((f) => f.trim()),
        }));

      const payload: any = {
        gymInfotmation: formData.description,
        gymFasilities: facilityArray.length > 0 ? facilityArray : [],
        openHours: formattedOpenHours,
        closeHours: formattedCloseHours,
        gymContactNumber: formData.contactNumber,
        city: formData.city,
        packages: packageArray.length > 0 ? packageArray : [],
      };

      // Only add image if available
      if (imageUrl) {
        payload.gymImg = imageUrl;
      }

      const response = await fetch(
        API_ENDPOINTS.GYM_INFO_CREATE(user?.id || ''),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok) {
        Alert.alert('Success', 'Gym post created successfully');
        router.back();
      } else {
        Alert.alert('Error', data.message || 'Failed to create gym post');
      }
    } catch (error) {
      console.error('Error creating gym post:', error);
      console.error('Error details:', JSON.stringify(error));
      Alert.alert('Error', `Failed to create gym post: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Gym Post</Text>
      </View>

      {/* Image Section */}
      <View style={styles.imageSection}>
        {imageUri || gymImage ? (
          <Image
            source={{ uri: (imageUri || gymImage) as string }}
            style={styles.selectedImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={pickImage}
        >
          <Text style={styles.imageButtonText}>📷 Select Image from Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Enter gym information"
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          multiline
        />
      </View>

      {/* Hours */}
      <View style={styles.section}>
        <Text style={styles.label}>Opening Hours</Text>
        <View style={styles.timeInputRow}>
          <View style={styles.timeInputContainer}>
            <Text style={styles.timeInputLabel}>Hour</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="1-12"
              value={openHoursHour}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (text === '' || (num >= 1 && num <= 12)) {
                  setOpenHoursHour(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <Text style={styles.timeInputLabel}>Min</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="0-59"
              value={openHoursMinute}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (text === '' || (num >= 0 && num <= 59)) {
                  setOpenHoursMinute(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <Text style={styles.timeInputLabel}>Period</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  openHoursPeriod === 'AM' && styles.periodButtonActive,
                ]}
                onPress={() => setOpenHoursPeriod('AM')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    openHoursPeriod === 'AM' && styles.periodButtonTextActive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  openHoursPeriod === 'PM' && styles.periodButtonActive,
                ]}
                onPress={() => setOpenHoursPeriod('PM')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    openHoursPeriod === 'PM' && styles.periodButtonTextActive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Closing Hours</Text>
        <View style={styles.timeInputRow}>
          <View style={styles.timeInputContainer}>
            <Text style={styles.timeInputLabel}>Hour</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="1-12"
              value={closeHoursHour}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (text === '' || (num >= 1 && num <= 12)) {
                  setCloseHoursHour(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <Text style={styles.timeInputLabel}>Min</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              placeholder="0-59"
              value={closeHoursMinute}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (text === '' || (num >= 0 && num <= 59)) {
                  setCloseHoursMinute(text);
                }
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.timeInputContainer}>
            <Text style={styles.timeInputLabel}>Period</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  closeHoursPeriod === 'AM' && styles.periodButtonActive,
                ]}
                onPress={() => setCloseHoursPeriod('AM')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    closeHoursPeriod === 'AM' && styles.periodButtonTextActive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  closeHoursPeriod === 'PM' && styles.periodButtonActive,
                ]}
                onPress={() => setCloseHoursPeriod('PM')}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    closeHoursPeriod === 'PM' && styles.periodButtonTextActive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Contact & City */}
      <View style={styles.section}>
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 0701234567"
          value={formData.contactNumber}
          onChangeText={(text) =>
            setFormData({ ...formData, contactNumber: text })
          }
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Colombo"
          value={formData.city}
          onChangeText={(text) =>
            setFormData({ ...formData, city: text })
          }
        />
      </View>

      {/* Facilities */}
      <View style={styles.section}>
        <Text style={styles.label}>Gym Facilities</Text>
        {formData.facilities.map((facility, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="e.g., Dumbbells, Treadmills"
              value={facility}
              onChangeText={(text) => handleUpdateFacility(index, text)}
            />
            {formData.facilities.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFacility(index)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddFacility}
        >
          <Text style={styles.addButtonText}>+ Add Facility</Text>
        </TouchableOpacity>
      </View>

      {/* Packages */}
      <View style={styles.section}>
        <Text style={styles.label}>Gym Packages</Text>
        {formData.packages.map((pkg, pkgIndex) => (
          <View key={pkgIndex} style={styles.packageContainer}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageTitle}>Package {pkgIndex + 1}</Text>
              {formData.packages.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemovePackage(pkgIndex)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Package Name"
              value={pkg.name}
              onChangeText={(text) =>
                handleUpdatePackage(pkgIndex, 'name', text)
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={pkg.price}
              onChangeText={(text) =>
                handleUpdatePackage(pkgIndex, 'price', text)
              }
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Duration (e.g., 1 Month)"
              value={pkg.duration}
              onChangeText={(text) =>
                handleUpdatePackage(pkgIndex, 'duration', text)
              }
            />

            <Text style={styles.subLabel}>Features</Text>
            {pkg.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.itemRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  placeholder="e.g., Gym Access"
                  value={feature}
                  onChangeText={(text) =>
                    handleUpdatePackageFeature(pkgIndex, featureIndex, text)
                  }
                />
                {pkg.features.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemovePackageFeature(pkgIndex, featureIndex)
                    }
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={styles.addFeatureButton}
              onPress={() => handleAddPackageFeature(pkgIndex)}
            >
              <Text style={styles.addButtonText}>+ Add Feature</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPackage}
        >
          <Text style={styles.addButtonText}>+ Add Package</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Create Post</Text>
        )}
      </TouchableOpacity>

      <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 15,
    marginTop: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  imageSection: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  flexInput: {
    flex: 1,
    marginRight: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addFeatureButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  packageContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 30,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  timeInput: {
    marginBottom: 0,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  periodButtonTextActive: {
    color: 'white',
  },
});
