import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';


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

    const IP_ADDRESS = '10.91.36.125';
    const BASE_URL = `http://${IP_ADDRESS}:5000/api/supplements`;

    useEffect(() => {
        if (id) {
            axios.get(`${BASE_URL}/all`)
                .then(res => {
                    const item = res.data.find((s: any) => s._id === id);
                    if (item) {
                        setFormData({
                            name: item.name,
                            type: item.type,
                            price: item.price.toString(),
                            description: item.description,
                            stock: item.stock.toString(),
                        });
                        setIsAvailable(item.isAvailable !== undefined ? item.isAvailable : true);
                    }
                })
                .catch(err => console.log("Fetch Error:", err));
        }
    }, [id]);

    const handleUpdate = async () => {
        try {
            await axios.put(`${BASE_URL}/update-price/${id}`, {
                price: Number(formData.price)
            });

            await axios.put(`${BASE_URL}/update-stock/${id}`, {
                stock: Number(formData.stock)
            });

            await axios.put(`${BASE_URL}/update-availability/${id}`, {
                isAvailable: isAvailable
            });

            Alert.alert("Success", "Updated Successfully!", [
                { text: "OK", onPress: () => router.replace('/supplement-menu') }
            ]);

        } catch (err: any) {
            console.error("Update Error Details:", err.response?.data || err.message);
            Alert.alert("Error", "Update failed.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Stack.Screen options={{ title: 'Edit Supplement' }} />
            <View style={styles.form}>
                <Text style={styles.label}>Name</Text>
                <TextInput 
                    style={[styles.input, styles.disabledInput]} 
                    value={formData.name} 
                    editable={false} 
                />
                
                <Text style={styles.label}>Price (Rs.)</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={formData.price?.toString()} 
                    onChangeText={(val: string) => setFormData({...formData, price: val})} 
                />

                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    value={formData.stock?.toString()} 
                    onChangeText={(val: string) => setFormData({...formData, stock: val})} 
                />

                <Text style={styles.label}>Description</Text>
                <TextInput 
                    style={[styles.input, styles.disabledInput, { height: 80 }]} 
                    multiline 
                    value={formData.description} 
                    editable={false} 
                />

                <View style={styles.switchContainer}>
                    <Text style={styles.label}>Stock Status</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <Switch
                            value={isAvailable}
                            onValueChange={(value: boolean) => setIsAvailable(value)}
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={isAvailable ? "#007bff" : "#f4f3f4"}
                        />
                        <Text style={{ marginLeft: 10, fontWeight: 'bold', color: isAvailable ? 'green' : 'red' }}>
                            {isAvailable ? 'In Stock' : 'Out of Stock'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleUpdate}>
                    <Text style={styles.submitBtnText}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    form: { marginTop: 10 },
    label: { fontWeight: 'bold', marginBottom: 5 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 15, color: '#333' },
    disabledInput: { backgroundColor: '#f0f0f0', color: '#7f8c8d' },
    switchContainer: { marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
    submitBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default EditSupplement;