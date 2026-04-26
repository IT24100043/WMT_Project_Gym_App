import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { Trash2, Edit } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { API_ENDPOINTS } from '../constants/api';
import HamburgerMenu from '@/components/HamburgerMenu';

interface Supplement {
    _id: string;
    name: string;
    type: string;
    description: string;
    price: number | string;
    stock?: number;
    isAvailable?: boolean;
}

const SupplementScreen = () => {
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const router = useRouter();
    const { user } = useAuth();
    
    const isAdmin = user?.role === 'admin';

    const handleProfilePress = () => {
        router.back();
    };

    const fetchSupplements = async () => {
        try {
            console.log("Refreshing supplements list...");
            const res = await axios.get(API_ENDPOINTS.SUPPLEMENTS_GET_ALL); 
            setSupplements(res.data);
        } catch (err) {
            console.error("Error fetching supplements", err);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSupplements();
        }, [])
    );

    const handleDelete = async (id: string) => {
        Alert.alert("Confirm", "Are you sure you want to delete this?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                    await axios.delete(API_ENDPOINTS.SUPPLEMENTS_DELETE(id));
                    fetchSupplements();
                } catch (err) {
                    Alert.alert("Error", "Could not delete.");
                }
            }}
        ]);
    };

    const renderItem = ({ item }: { item: Supplement }) => (
        <View style={styles.card}>
            <View style={styles.cardBody}>
                {/* Supplement Header: Name (Type) */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>
                        {item.name} 
                        <Text style={styles.typeTag}> ({item.type})</Text>
                    </Text>
                </View>

                {/* Description */}
                {item.description && (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText} numberOfLines={2}>
                            {item.description}
                        </Text>
                    </View>
                )}

                {/* Price and Stock Status Row */}
                <View style={styles.infoRow}>
                    <View style={styles.priceSection}>
                        <Text style={styles.priceLabel}>Price</Text>
                        <Text style={styles.price}>Rs. {item.price}</Text>
                    </View>
                    
                    <View style={styles.stockSection}>
                        <Text style={styles.stockLabel}>Stock Status</Text>
                        <Text style={[
                            styles.stockStatus,
                            { color: item.isAvailable === false ? '#e74c3c' : '#27ae60' }
                        ]}>
                            {item.isAvailable === false ? '● Out of Stock' : '● In Stock'}
                        </Text>
                    </View>
                </View>
                
                {/* Admin Action Buttons - Only visible for Admins */}
                {isAdmin && (
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity 
                            style={styles.editBtn} 
                            onPress={() => router.push(`/${item._id}`)}
                        >
                            <Edit size={18} color="#f39c12" />
                            <Text style={styles.btnTextEdit}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.deleteBtn} 
                            onPress={() => handleDelete(item._id)}
                        >
                            <Trash2 size={18} color="#e74c3c" />
                            <Text style={styles.btnTextDelete}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
            <HamburgerMenu
                pageType="user"
                onProfilePress={handleProfilePress}
            />
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.pageTitle}>Supplements</Text>
                </View>
                
            <FlatList
                data={supplements}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                onRefresh={fetchSupplements}
                refreshing={false}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No supplements found.</Text>}
            />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        paddingHorizontal: 20 
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
        lineHeight: 24
    },
    typeTag: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7f8c8d'
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
    priceSection: {
        flex: 1
    },
    priceLabel: {
        fontSize: 11,
        color: '#95a5a6',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 3
    },
    price: { 
        fontSize: 18, 
        color: '#007bff', 
        fontWeight: 'bold' 
    },
    stockSection: {
        flex: 1,
        alignItems: 'flex-end'
    },
    stockLabel: {
        fontSize: 11,
        color: '#95a5a6',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 3
    },
    stockStatus: {
        fontSize: 13,
        fontWeight: 'bold'
    },
    buttonGroup: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        gap: 10,
        paddingTop: 10
    },
    editBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fef5e7',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#f39c12'
    },
    deleteBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fadbd8',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e74c3c'
    },
    btnTextEdit: { 
        color: '#f39c12', 
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 13
    },
    btnTextDelete: { 
        color: '#e74c3c', 
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 13
    }
});

export default SupplementScreen;