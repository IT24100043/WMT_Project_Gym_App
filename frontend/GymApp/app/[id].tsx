import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { API_ENDPOINTS } from '@/constants/api';


interface SupplementData {
    _id?: string;
    name: string;
    type: string;
    price: string | number;
    description: string;
    stock: string | number;
    isAvailable?: boolean;
}

const EditSupplement = () => {
    const { id } = useLocalSearchParams<{ id: string }>(); 
    const router = useRouter();

    const [formData, setFormData] = useState<SupplementData>({
        name: '', 
        type: '', 
        price: '', 
        description: '', 
        stock: '', 
    });
    
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (id) {
            fetchSupplementDetails();
        }
    }, [id]);

    const fetchSupplementDetails = async () => {
        try {
            const res = await axios.get(API_ENDPOINTS.SUPPLEMENTS_GET_ALL);
            const item = res.data.find((s: any) => s._id === id);
            if (item) {
                setFormData({
                    _id: item._id,
                    name: item.name || '',
                    type: item.type || '',
                    price: item.price.toString(),
                    description: item.description || '',
                    stock: item.stock.toString(),
                });
                setIsAvailable(item.isAvailable !== undefined ? item.isAvailable : true);
            } else {
                Alert.alert("Error", "Supplement not found");
                router.back();
            }
        } catch (err: any) {
            console.error("Fetch Error:", err);
            Alert.alert("Error", "Failed to load supplement details");
        }
    };

    const handleUpdate = async () => {
        // Validation
        if (!formData.name.trim()) {
            Alert.alert("Validation", "Please enter supplement name");
            return;
        }
        if (!formData.type.trim()) {
            Alert.alert("Validation", "Please enter supplement type");
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            Alert.alert("Validation", "Please enter a valid price");
            return;
        }
        if (!formData.description.trim()) {
            Alert.alert("Validation", "Please enter supplement description");
            return;
        }

        setLoading(true);
        try {
            const updatePayload = {
                name: formData.name.trim(),
                type: formData.type.trim(),
                price: Number(formData.price),
                description: formData.description.trim(),
                stock: Number(formData.stock) || 0,
                isAvailable: isAvailable
            };

            const response = await axios.put(
                API_ENDPOINTS.SUPPLEMENTS_UPDATE(id!),
                updatePayload
            );

            Alert.alert("Success", "Supplement updated successfully!", [
                { text: "OK", onPress: () => router.replace('/supplement-menu') }
            ]);

        } catch (err: any) {
            console.error("Update Error Details:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.error || err.message || "Network error";
            Alert.alert("Error", `Failed to update: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView 
            style={styles.container}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 200 }}
            scrollEnabled={true}
        >
            <Stack.Screen options={{ title: 'Edit Supplement' }} />
            <View style={styles.form}>
                <Text style={styles.label}>Name *</Text>
                <TextInput 
                    style={styles.input}
                    value={formData.name} 
                    onChangeText={(val: string) => setFormData({...formData, name: val})}
                    placeholder="Enter supplement name"
                    editable={!loading}
                />
                
                <Text style={styles.label}>Type *</Text>
                <TextInput 
                    style={styles.input}
                    value={formData.type}
                    onChangeText={(val: string) => setFormData({...formData, type: val})}
                    placeholder="Enter supplement type"
                    editable={!loading}
                />

                <Text style={styles.label}>Price (Rs.) *</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={formData.price?.toString()} 
                    onChangeText={(val: string) => setFormData({...formData, price: val})}
                    placeholder="Enter price"
                    editable={!loading}
                />

                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={formData.stock?.toString()} 
                    onChangeText={(val: string) => setFormData({...formData, stock: val})}
                    placeholder="Enter stock quantity"
                    editable={!loading}
                />

                <Text style={styles.label}>Description *</Text>
                <TextInput 
                    style={[styles.input, { height: 100 }]} 
                    multiline 
                    value={formData.description}
                    onChangeText={(val: string) => setFormData({...formData, description: val})}
                    placeholder="Enter supplement description"
                    editable={!loading}
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Stock Status</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <Switch
                            value={isAvailable}
                            onValueChange={(value: boolean) => setIsAvailable(value)}
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isAvailable ? "#007bff" : "#f4f3f4"}
                            disabled={loading}
                        />
                        <Text style={{ marginLeft: 15, fontWeight: 'bold', color: isAvailable ? '#28a745' : '#e74c3c', fontSize: 16 }}>
                            {isAvailable ? 'In Stock' : 'Out of Stock'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    <Text style={styles.submitBtnText}>{loading ? 'Updating...' : 'Save Changes'}</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa', 
        padding: 20 
    },
    form: { 
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        elevation: 2
    },
    label: { 
        fontWeight: 'bold', 
        marginBottom: 8,
        color: '#2c3e50',
        fontSize: 14
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#ddd', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 15, 
        color: '#333',
        fontSize: 14,
        backgroundColor: '#fff'
    },
    switchContainer: { 
        marginBottom: 20, 
        padding: 15, 
        backgroundColor: '#f0f8ff', 
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff'
    },
    submitBtn: { 
        backgroundColor: '#28a745', 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginTop: 10,
        elevation: 2
    },
    submitBtnDisabled: {
        backgroundColor: '#95a5a6',
        opacity: 0.6
    },
    submitBtnText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: 'bold' 
    }
});

export default EditSupplement;