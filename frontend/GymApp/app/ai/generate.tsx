import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const AI_API = 'http://192.168.1.25:5000/api/ai/generate-routine';
const WORKOUT_API = 'http://192.168.1.25:5000/api/workouts';

export default function GenerateRoutineScreen() {
    const router = useRouter();
    const { user } = useContext(AuthContext);

    const [form, setForm] = useState({
        targetArea: "Full Body",
        availableDays: "4"
    });

    const [loading, setLoading] = useState(false);
    const [routine, setRoutine] = useState(null);
    const [aiMode, setAiMode] = useState(null);
    const [image, setImage] = useState(null);
    const [aiError, setAiError] = useState(null);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    };

    const handleGenerate = async () => {
         setLoading(true);
         setRoutine(null);
         try {
             const res = await fetch(AI_API, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                      userId: user?.id || user?._id || 'testUser123',
                      age: user?.age || 25,
                      gender: user?.gender || 'Unspecified',
                      height: user?.height || 170,
                      weight: user?.weight || 70,
                      fitnessGoal: user?.fitnessGoal || 'general fitness',
                      experienceLevel: user?.experienceLevel || 'beginner',
                      workoutLocation: user?.workoutLocation || 'gym',
                      availableDays: parseInt(form.availableDays) || 3,
                      targetArea: form.targetArea
                 })
             });
             const data = await res.json();
             if (res.ok && data.routine) {
                 setRoutine(data.routine);
                 setAiMode(data.mode);
                 if (data.error) setAiError(data.error);
                 // Note: we'd also upload the image naturally in the future!
             } else {
                 Alert.alert("Generation Failed", data.message || "Failed structurally mapping payload.");
             }
         } catch(e) {
             Alert.alert("Network Error", e.message);
         } finally {
             setLoading(false);
         }
    };

    const handleAccept = async () => {
         // Saves explicit layout natively
         Alert.alert('Apply AI Blueprint?', '⚠️ Always adjust weights based on your comfort level. Do you wish to override your Active Routine globally?', [
             { text: 'Cancel', style: 'cancel' },
             {
                 text: 'Accept Routine',
                 style: 'default',
                 onPress: async () => {
                     try {
                         const res = await fetch(WORKOUT_API, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                                 userId: user?.id || user?._id || 'testUser123',
                                 ...routine
                             })
                         });
                         if (res.ok) {
                             Alert.alert("Success", "Target saved beautifully. The Engine mapped it to Active.");
                             router.replace('/workouts');
                         } else {
                             const d = await res.json();
                             Alert.alert("Error", d.message || "Failed natively.");
                         }
                     } catch(e) { console.error(e); }
                 }
             }
         ]);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
                 <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                     <Text style={styles.backBtnText}>{"← Back"}</Text>
                 </TouchableOpacity>
                 <View style={styles.badgeWrap}><Text style={styles.badgeStr}>GEMINI AI ENGINE</Text></View>
            </View>

            <Text style={styles.title}>AI Architect</Text>
            <Text style={styles.subtitle}>We'll explicitly map your physiological goals locally into an optimized progression matrix automatically natively.</Text>
            
            {!routine && !loading && (
                <View style={styles.configBox}>
                     <Text style={styles.label}>📸 Upload Your Body Photo (Optional)</Text>
                     <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                          {image ? (
                              <Image source={{ uri: image }} style={styles.preview} />
                          ) : (
                              <Text style={{ color: '#9ca3af', fontWeight: '600' }}>Tap to upload full body photo</Text>
                          )}
                     </TouchableOpacity>

                     <Text style={styles.label}>Target Focus Area</Text>
                     <TextInput style={styles.input} value={form.targetArea} onChangeText={t => setForm({...form, targetArea: t})} placeholder="e.g. Chest & Triceps, Full Body" />

                     <Text style={styles.label}>Days Per Week</Text>
                     <TextInput style={styles.input} keyboardType="numeric" value={form.availableDays} onChangeText={t => setForm({...form, availableDays: t})} />

                     <TouchableOpacity style={styles.genBtn} onPress={handleGenerate}>
                          <Text style={styles.genBtnText}>🤖 Generate Execution Plan</Text>
                     </TouchableOpacity>
                </View>
            )}

            {loading && (
                <View style={styles.loadingBox}>
                     <ActivityIndicator size="large" color="#6366f1" />
                     <Text style={styles.loadingText}>Analyzing physiological sequence boundaries...</Text>
                </View>
            )}

            {routine && !loading && (
                <View style={styles.reviewBox}>
                     <View style={styles.actionRow}>
                         <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                             <Text style={styles.acceptBtnText}>✅ Accept Routine</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={styles.rejectBtn} onPress={handleGenerate}>
                             <Text style={styles.rejectBtnText}>🔄 Regenerate</Text>
                         </TouchableOpacity>
                     </View>

                     <View style={[styles.aiModeBadge, { backgroundColor: aiMode === 'online' ? '#ecfdf5' : '#fffbeb', borderColor: aiMode === 'online' ? '#10b981' : '#f59e0b' }]}>
                         <Text style={[styles.aiModeText, { color: aiMode === 'online' ? '#065f46' : '#b45309' }]}>
                             {aiMode === 'online' ? '🤖 AI Generated Plan (Real-time)' : '⚙️ Demo Mode: Using pre-built plan (No internet AI)'}
                         </Text>
                     </View>

                     {aiMode === 'offline' && aiError && (
                          <View style={styles.errorBox}>
                               <Text style={styles.errorText}>⚠️ AI Error: {aiError}</Text>
                          </View>
                     )}

                     <Text style={styles.routineTitle}>{routine.title}</Text>
                     <Text style={styles.routineGoal}>Target Area: {routine.goal}</Text>

                     <View style={styles.aiNoteBlock}>
                          <Text style={styles.aiNoteHeader}>🧠 Engine Note</Text>
                          <Text style={styles.aiNoteBody}>{routine.notes || "This plan is deterministically mapped based on your explicit layout targets. Focus cleanly on form."}</Text>
                     </View>

                     {routine.days.map((d, i) => (
                         <View key={i} style={styles.dayCard}>
                             <Text style={styles.dayName}>{d.dayName} <Text style={{fontWeight:'500', color: d.dayType === 'workout' ? '#10b981' : '#9ca3af'}}>• {d.dayType === 'workout' ? '🔥 Workout' : '🛋️ Rest'}</Text></Text>
                             
                             {d.dayType === 'workout' && d.exercises && (
                                 <View style={styles.exerciseMap}>
                                     {d.focus && <Text style={styles.focusLabel}>Focus: {d.focus}</Text>}
                                     
                                     {d.exercises.map((ex, exidx) => (
                                         <View key={exidx} style={styles.microObj}>
                                             <Text style={styles.exName}>{ex.exerciseName}</Text>
                                             <Text style={styles.exDetails}>
                                                  {ex.type === 'reps' ? `${ex.sets} sets x ${ex.reps} reps` : `${ex.duration}s duration`}
                                                  {ex.defaultWeight > 0 ? ` @ ${ex.defaultWeight}kg` : ''}
                                             </Text>
                                         </View>
                                     ))}
                                 </View>
                             )}
                         </View>
                     ))}
                     <View style={{height: 70}}/>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f3f5', padding: 20, paddingTop: 40 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    backBtn: { paddingRight: 15 },
    backBtnText: { fontSize: 16, color: '#6366f1', fontWeight: 'bold' },
    badgeWrap: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    badgeStr: { fontSize: 11, fontWeight: '800', color: '#4338ca', letterSpacing: 0.5 },

    title: { fontSize: 32, fontWeight: '900', color: '#1f2937' },
    subtitle: { fontSize: 15, color: '#6b7280', marginTop: 8, lineHeight: 22, fontStyle: 'italic', marginBottom: 25 },

    configBox: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    label: { fontSize: 13, fontWeight: '800', color: '#4b5563', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 14, borderRadius: 10, fontSize: 16, marginBottom: 20 },
    
    uploadBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
    preview: { width: '100%', height: '100%', resizeMode: 'cover' },

    genBtn: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 5 },
    genBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    loadingBox: { alignItems: 'center', marginTop: 80 },
    loadingText: { marginTop: 20, fontSize: 15, color: '#6b7280', fontWeight: '600' },

    reviewBox: { marginTop: 10 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    acceptBtn: { flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignItems: 'center', marginRight: 10 },
    acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 15 },
    rejectBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 12, alignItems: 'center' },
    rejectBtnText: { color: '#4b5563', fontWeight: '800', fontSize: 15 },

    routineTitle: { fontSize: 22, fontWeight: '900', color: '#1f2937', marginBottom: 6 },
    routineGoal: { fontSize: 14, color: '#6b7280', fontStyle: 'italic', marginBottom: 15 },
    
    aiModeBadge: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 15, alignSelf: 'flex-start' },
    aiModeText: { fontSize: 13, fontWeight: '700' },

    errorBox: { backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#ef4444', marginBottom: 15 },
    errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '700' },

    aiNoteBlock: { backgroundColor: '#eef2ff', padding: 15, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#6366f1', marginBottom: 20 },
    aiNoteHeader: { fontSize: 13, fontWeight: '800', color: '#4338ca', marginBottom: 4 },
    aiNoteBody: { fontSize: 14, color: '#4f46e5', lineHeight: 20 },

    dayCard: { backgroundColor: '#fff', padding: 18, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    dayName: { fontSize: 17, fontWeight: '800', color: '#374151', marginBottom: 12 },
    
    exerciseMap: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 15 },
    focusLabel: { fontSize: 13, color: '#6b7280', fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 },
    
    microObj: { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 10 },
    exName: { fontSize: 15, fontWeight: '800', color: '#1f2937' },
    exDetails: { fontSize: 14, color: '#6366f1', fontWeight: '700', marginTop: 4 }
});
