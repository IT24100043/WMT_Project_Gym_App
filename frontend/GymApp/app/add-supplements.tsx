import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

interface SupplementForm {
    name: string;
    type: string;
    price: string;
    description: string;
    stock: string;
}

const AddSupplementScreen = () => {
    const router = useRouter();

    const [formData, setFormData] = useState<SupplementForm>({
        name: '', 
        type: '', 
        price: '', 
        description: '', 
        stock: ''
    });
    
    const [isAvailable, setIsAvailable] = useState<boolean>(true);

    const IP_ADDRESS = '10.91.36.125';
    const BASE_URL = `http://${IP_ADDRESS}:5000/api/supplements`;

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.type) {
            Alert.alert("Error", "Please fill required fields (Name, Category, Price)");
            return;
        }

        const payload = {
            name: formData.name,
            type: formData.type,
            price: Number(formData.price),
            description: formData.description,
            stock: Number(formData.stock),
            isAvailable: isAvailable
        };

        try {
            await axios.post(`${BASE_URL}/add`, payload);
            
            Alert.alert("Success", "Supplement Added Successfully!", [
                { text: "OK", onPress: () => router.replace('/admin-home') }
            ]);
            
        } catch (err: any) {
            console.error("Error details:", err.response?.data || err.message);
            Alert.alert("Error", "Failed to add supplement. Check your server connection.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Add New Supplement</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Supplement Name *</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Whey Protein" 
                    value={formData.name}
                    onChangeText={(val) => setFormData({...formData, name: val})}
                />

                <Text style={styles.label}>Category *</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Protein, Energy" 
                    value={formData.type}
                    onChangeText={(val) => setFormData({...formData, type: val})}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Price (Rs.) *</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="0.00" 
                            value={formData.price}
                            onChangeText={(val) => setFormData({...formData, price: val})}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Stock</Text>
                        <TextInput 
                            style={styles.input} 
                            keyboardType="numeric" 
                            placeholder="Qty" 
                            value={formData.stock}
                            onChangeText={(val) => setFormData({...formData, stock: val})}
                        />
                    </View>
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Is Available?</Text>
                    <Switch
                        value={isAvailable}
                        onValueChange={(value) => setIsAvailable(value)}
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isAvailable ? "#007bff" : "#f4f3f4"}
                    />
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput 
                    style={[styles.input, { height: 100 }]} 
                    multiline 
                    placeholder="Provide a brief description..." 
                    textAlignVertical="top"
                    value={formData.description}
                    onChangeText={(val) => setFormData({...formData, description: val})}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitBtnText}>Add Supplement</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', marginTop: 30 },
    form: { marginBottom: 40 },
    label: { fontWeight: 'bold', marginBottom: 5, color: '#555' },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, color: '#333' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    switchRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 15, 
        padding: 10, 
        backgroundColor: '#f9f9f9', 
        borderRadius: 8 
    },
    submitBtn: { 
        backgroundColor: '#007bff', 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginTop: 10,
        elevation: 2 
    },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddSupplementScreen;