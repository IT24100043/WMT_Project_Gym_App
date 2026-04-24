import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { Trash2, Edit } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

interface Supplement {
    _id: string;
    name: string;
    type: string;
    price: number | string;
    isAvailable?: boolean;
}

const SupplementScreen = () => {
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const router = useRouter();
    const { user } = useAuth();
    
    const isAdmin = user?.role === 'admin';

    const IP_ADDRESS = '10.91.36.125';
    const BASE_URL = `http://${IP_ADDRESS}:5000/api/supplements`;

    const fetchSupplements = async () => {
        try {
            console.log("Refreshing list...");
            const res = await axios.get(`${BASE_URL}/all`); 
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
                    await axios.delete(`${BASE_URL}/delete/${id}`);
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
                {/* Supplement Info Section */}
                <View style={styles.infoRow}>
                    <View>
                        <Text style={styles.title}>{item.name}</Text>
                        <Text style={styles.type}>{item.type}</Text>
                    </View>
                    <Text style={styles.price}>Rs. {item.price}</Text>
                </View>
                
                <Text style={{ 
                    color: item.isAvailable === false ? '#e74c3c' : '#2ecc71', 
                    fontWeight: 'bold',
                    marginTop: 5 
                }}>
                    {item.isAvailable === false ? '● Out of Stock' : '● In Stock'}
                </Text>
                
                {isAdmin && (
                    <View style={styles.buttonGroup}>
                        {/* Edit and Delete Buttons */}
                        <TouchableOpacity 
                            style={styles.editBtn} 
                            onPress={() => router.push(`/${item._id}`)}
                        >
                            <Edit size={18} color="#f39c12" />
                            <Text style={styles.btnTextEdit}> Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.deleteBtn} 
                            onPress={() => handleDelete(item._id)}
                        >
                            <Trash2 size={18} color="#e74c3c" />
                            <Text style={styles.btnTextDelete}> Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>Available Supplements</Text>
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
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 15 
    },
    header: { fontSize: 22, fontWeight: 'bold' },
    addMainBtn: { 
        backgroundColor: '#007bff', 
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 8,
        elevation: 2
    },
    addMainBtnText: { color: '#fff', fontWeight: 'bold' },
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        marginBottom: 12, 
        elevation: 2,
        borderWidth: 1,
        borderColor: '#eee'
    },
    cardBody: { padding: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
    type: { color: '#7f8c8d', fontSize: 14, marginTop: 2 },
    price: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
    buttonGroup: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
        paddingTop: 10
    },
    editBtn: { flexDirection: 'row', alignItems: 'center', padding: 5, marginRight: 20 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', padding: 5 },
    btnTextEdit: { color: '#f39c12', fontWeight: 'bold', marginLeft: 5 },
    btnTextDelete: { color: '#e74c3c', fontWeight: 'bold', marginLeft: 5 }
});

export default SupplementScreen;