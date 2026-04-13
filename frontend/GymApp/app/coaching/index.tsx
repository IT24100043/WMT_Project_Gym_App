import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

const COACHING_API = 'http://192.168.1.25:5000/api/coaching';

export default function CoachingScreen() {
    const router = useRouter();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState([]);

    const fetchSuggestions = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await fetch(`${COACHING_API}/${user.id || user._id || 'testUser123'}`);
            const json = await res.json();
            if (res.ok) setSuggestions(json.suggestions || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchSuggestions(); }, []));

    const handleApply = (sug) => {
        Alert.alert('Apply Suggestion?', `Do you want to update your active routine directly with this change?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Apply Change',
                style: 'default',
                onPress: async () => {
                    try {
                        const res = await fetch(`${COACHING_API}/apply`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                userId: user.id || user._id || 'testUser123', 
                                exerciseName: sug.exerciseName, 
                                dayName: sug.dayName, 
                                newValue: sug.newValue, 
                                field: sug.field 
                            })
                        });
                        if (res.ok) {
                            // Suppress successfully locally
                            setSuggestions(prev => prev.filter(s => s.exerciseName !== sug.exerciseName));
                            Alert.alert("Success", "Target cleanly pushed into your active workflow!");
                        }
                    } catch(e) { console.error(e); }
                }
            }
        ]);
    };

    const handleDismiss = async (sug) => {
        try {
             const res = await fetch(`${COACHING_API}/dismiss`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                       userId: user.id || user._id || 'testUser123', 
                       exerciseName: sug.exerciseName, 
                       latestLogRef: sug.latestLogRef 
                  })
             });
             if (res.ok) {
                  // Hide seamlessly internally
                  setSuggestions(prev => prev.filter(s => s.exerciseName !== sug.exerciseName));
             }
        } catch(e) { console.error(e); }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{"← Back"}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.titleWrap}>
                <Text style={styles.title}>Smart Coaching</Text>
                <Text style={styles.subtitle}>Suggestions autonomously computed based exclusively on your recent logged execution history.</Text>
            </View>

            {suggestions.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🤖</Text>
                    <Text style={styles.emptyText}>You're fully optimized! Logging more sessions natively will naturally trigger fresh progression algorithms here explicitly!</Text>
                </View>
            ) : (
                suggestions.map((sug, idx) => {
                     let badgeColor = "#4b5563";
                     let badgeLabel = sug.action.replace('_', ' ').toUpperCase();
                     let iconLabel = "➖";

                     if (sug.action.includes('increase')) { badgeColor = "#10b981"; iconLabel = "📈"; }
                     if (sug.action.includes('reduce')) { badgeColor = "#f59e0b"; iconLabel = "📉"; }

                     const formatType = (f) => f === 'defaultWeight' ? 'kg' : f === 'duration' ? 's' : ' reps';

                     return (
                         <View key={idx} style={styles.card}>
                             <View style={styles.cardHeader}>
                                 <View>
                                     <Text style={styles.exName}>{sug.exerciseName}</Text>
                                     <Text style={styles.dayName}>Mapped inside: {sug.dayName}</Text>
                                 </View>
                                 <View style={[styles.badge, { backgroundColor: badgeColor + '15' }]}>
                                     <Text style={[styles.badgeText, { color: badgeColor }]}>{iconLabel} {badgeLabel}</Text>
                                 </View>
                             </View>

                             <View style={styles.metricRow}>
                                 <Text style={styles.oldMetric}>{sug.oldValue}{formatType(sug.field)}</Text>
                                 <Text style={styles.arrow}> ➡️ </Text>
                                 <Text style={styles.newMetric}>{sug.newValue}{formatType(sug.field)}</Text>
                             </View>

                             <Text style={styles.reasonBlock}>"{sug.reason}"</Text>

                             <View style={styles.btnRow}>
                                 <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(sug)}>
                                     <Text style={styles.dismissBtnText}>Dismiss</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity style={styles.applyBtn} onPress={() => handleApply(sug)}>
                                     <Text style={styles.applyBtnText}>Apply</Text>
                                 </TouchableOpacity>
                             </View>
                         </View>
                     );
                })
            )}
            
            <View style={{height: 70}} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f3f5', padding: 20, paddingTop: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backBtn: { paddingRight: 15 },
    backBtnText: { fontSize: 16, color: '#6366f1', fontWeight: 'bold' },
    
    titleWrap: { marginBottom: 30 },
    title: { fontSize: 32, fontWeight: '900', color: '#1f2937' },
    subtitle: { fontSize: 14, color: '#6b7280', marginTop: 8, lineHeight: 22 },

    emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyIcon: { fontSize: 50, marginBottom: 15 },
    emptyText: { textAlign: 'center', fontSize: 15, color: '#6b7280', lineHeight: 24, fontWeight: '500' },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: {width:0, height:3}, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    exName: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
    dayName: { fontSize: 13, color: '#9ca3af', fontWeight: '600', marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '900' },

    metricRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 15, borderRadius: 10, marginBottom: 15 },
    oldMetric: { fontSize: 19, fontWeight: '700', color: '#6b7280', textDecorationLine: 'line-through' },
    arrow: { fontSize: 18, paddingHorizontal: 10 },
    newMetric: { fontSize: 24, fontWeight: '900', color: '#6366f1' },

    reasonBlock: { fontSize: 14, color: '#4b5563', fontStyle: 'italic', marginBottom: 20, lineHeight: 20 },

    btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    dismissBtn: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f3f4f6', borderRadius: 10 },
    dismissBtnText: { color: '#4b5563', fontWeight: '700', fontSize: 14 },
    applyBtn: { paddingVertical: 10, paddingHorizontal: 22, backgroundColor: '#10b981', borderRadius: 10 },
    applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }
});
