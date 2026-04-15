import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';

const AI_API = API_ENDPOINTS.AI_GENERATE_ROUTINE;
const WORKOUT_API = API_ENDPOINTS.WORKOUTS;

const bodyTypes = ['Slim', 'Average', 'Athletic', 'Broad'];
const genders = ['Male', 'Female'];
const goals = ['Muscle Gain', 'Fat Loss', 'General Fitness'];
const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'];
const equipmentOptions = ['Bodyweight Only', 'Basic Home Equipment', 'Full Gym'];
const injuryOptions = ['No', 'Yes'];
const activityLevels = ['Low', 'Moderate', 'High'];
const sleepQualities = ['Poor', 'Average', 'Good'];
const stressLevels = ['Low', 'Medium', 'High'];
const workoutLocations = ['Gym', 'Home'];
const targetAreas = ['Full Body', 'Upper Body', 'Lower Body', 'Core'];

export default function GenerateRoutineScreen() {
    const router = useRouter();
    const { user } = useContext(AuthContext);

    const [form, setForm] = useState({
        age: '22',
        gender: 'Male',
        height: '170',
        weight: '68',
        fitness_goal: 'Muscle Gain',
        experience_level: 'Beginner',
        equipment: 'Full Gym',
        days_per_week: '4',
        injury: 'No',
        activity_level: 'Moderate',
        body_type: 'Average',
        sleep_quality: 'Good',
        stress_level: 'Medium',
        workoutLocation: 'Gym',
        targetArea: 'Full Body',
    });

    const [loading, setLoading] = useState(false);
    const [routine, setRoutine] = useState<any>(null);
    const [aiMode, setAiMode] = useState<string | null>(null);
    const [predictedSplit, setPredictedSplit] = useState<string>('');
    const [aiError, setAiError] = useState<string | null>(null);

    const updateField = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const validateForm = () => {
        if (!form.age || !form.height || !form.weight || !form.days_per_week) {
            Alert.alert('Missing fields', 'Please fill all required numeric fields.');
            return false;
        }

        const age = Number(form.age);
        const height = Number(form.height);
        const weight = Number(form.weight);
        const days = Number(form.days_per_week);

        if (isNaN(age) || isNaN(height) || isNaN(weight) || isNaN(days)) {
            Alert.alert('Invalid input', 'Age, height, weight, and days per week must be numbers.');
            return false;
        }

        if (days < 1 || days > 7) {
            Alert.alert('Invalid days', 'Days per week must be between 1 and 7.');
            return false;
        }

        return true;
    };

    const handleGenerate = async () => {
        if (!validateForm()) return;
        setLoading(true);
        setRoutine(null);
        setAiError(null);
        
        try {
            const res = await fetch(AI_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || user?._id || 'testUser123',
                    age: Number(form.age),
                    gender: form.gender,
                    height: Number(form.height),
                    weight: Number(form.weight),
                    fitness_goal: form.fitness_goal,
                    experience_level: form.experience_level,
                    equipment: form.equipment,
                    days_per_week: Number(form.days_per_week),
                    injury: form.injury,
                    activity_level: form.activity_level,
                    body_type: form.body_type,
                    sleep_quality: form.sleep_quality,
                    stress_level: form.stress_level,
                    workoutLocation: form.workoutLocation,
                    targetArea: form.targetArea,
                })
            });
            const data = await res.json();
            if (res.ok && data.routine) {
                setRoutine(data.routine);
                setAiMode(data.mode);
                setPredictedSplit(data.predictedSplit || '');
                if (data.error) setAiError(data.error);
            } else {
                Alert.alert("Generation Failed", data.message || "Failed structurally mapping payload.");
            }
        } catch(e: any) {
            Alert.alert("Network Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
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
                             Alert.alert("Success", "Target saved beautifully.");
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

    const renderOptionRow = (label: string, field: string, options: string[]) => (
        <View style={styles.section}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.optionWrap}>
                {options.map((option) => {
                    const selected = (form as any)[field] === option;
                    return (
                        <TouchableOpacity
                            key={option}
                            testID={`ai-${field}-${option.toLowerCase().replace(/\s+/g, '-')}`}
                            style={[styles.optionButton, selected && styles.optionButtonSelected]}
                            onPress={() => updateField(field, option)}
                        >
                            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                                {option}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
                 <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                     <Text style={styles.backBtnText}>{"← Back"}</Text>
                 </TouchableOpacity>
                 <View style={styles.badgeWrap}><Text style={styles.badgeStr}>ML AI ENGINE</Text></View>
            </View>

            <Text style={styles.title}>AI Architect</Text>
            <Text style={styles.subtitle}>We'll map your physiological goals into an optimized progression matrix automatically.</Text>
            
            {!routine && !loading && (
                <View style={styles.configBox}>
                     <View style={styles.section}>
                         <Text style={styles.label}>Age</Text>
                         <TextInput testID="ai-age-input" style={styles.input} keyboardType="numeric" value={form.age} onChangeText={t => updateField('age', t)} />
                     </View>
                     <View style={styles.section}>
                         <Text style={styles.label}>Height (cm)</Text>
                         <TextInput testID="ai-height-input" style={styles.input} keyboardType="numeric" value={form.height} onChangeText={t => updateField('height', t)} />
                     </View>
                     <View style={styles.section}>
                         <Text style={styles.label}>Weight (kg)</Text>
                         <TextInput testID="ai-weight-input" style={styles.input} keyboardType="numeric" value={form.weight} onChangeText={t => updateField('weight', t)} />
                     </View>
                     <View style={styles.section}>
                         <Text style={styles.label}>Days Per Week</Text>
                         <TextInput testID="ai-days-input" style={styles.input} keyboardType="numeric" value={form.days_per_week} onChangeText={t => updateField('days_per_week', t)} />
                     </View>

                     {renderOptionRow('Gender', 'gender', genders)}
                     {renderOptionRow('Body Type', 'body_type', bodyTypes)}
                     {renderOptionRow('Fitness Goal', 'fitness_goal', goals)}
                     {renderOptionRow('Experience Level', 'experience_level', experienceLevels)}
                     {renderOptionRow('Workout Location', 'workoutLocation', workoutLocations)}
                     {renderOptionRow('Target Area', 'targetArea', targetAreas)}
                     {renderOptionRow('Equipment', 'equipment', equipmentOptions)}
                     {renderOptionRow('Injury', 'injury', injuryOptions)}
                     {renderOptionRow('Activity Level', 'activity_level', activityLevels)}
                     {renderOptionRow('Sleep Quality', 'sleep_quality', sleepQualities)}
                     {renderOptionRow('Stress Level', 'stress_level', stressLevels)}

                     <TouchableOpacity testID="ai-generate-btn" style={styles.genBtn} onPress={handleGenerate}>
                          <Text style={styles.genBtnText}>🤖 Generate Routine</Text>
                     </TouchableOpacity>
                </View>
            )}

            {loading && (
                <View style={styles.loadingBox}>
                     <ActivityIndicator size="large" color="#6366f1" testID="ai-loading" />
                     <Text style={styles.loadingText}>Analyzing physiological sequence boundaries...</Text>
                </View>
            )}

            {routine && !loading && (
                <View testID="ai-result-container" style={styles.reviewBox}>
                     <View style={styles.actionRow}>
                         <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
                             <Text style={styles.acceptBtnText}>✅ Accept Routine</Text>
                         </TouchableOpacity>
                         <TouchableOpacity style={styles.rejectBtn} onPress={() => setRoutine(null)}>
                             <Text style={styles.rejectBtnText}>🔄 Regenerate</Text>
                         </TouchableOpacity>
                     </View>

                     <View testID="ai-mode-badge" style={[styles.aiModeBadge, { backgroundColor: aiMode === 'online' ? '#ecfdf5' : aiMode === 'ml_model' ? '#e0e7ff' : '#fffbeb', borderColor: aiMode === 'online' ? '#10b981' : aiMode === 'ml_model' ? '#6366f1' : '#f59e0b' }]}>
                         <Text style={[styles.aiModeText, { color: aiMode === 'online' ? '#065f46' : aiMode === 'ml_model' ? '#3730a3' : '#b45309' }]}>
                             {aiMode === 'online' ? '🤖 AI Generated Plan' : aiMode === 'ml_model' ? '🔬 ML Generated Plan (' + predictedSplit + ')' : '⚙️ Demo Mode fallback'}
                         </Text>
                     </View>

                     {aiMode === 'offline' && aiError && (
                          <View style={styles.errorBox}>
                               <Text style={styles.errorText}>⚠️ AI Error: {aiError}</Text>
                          </View>
                     )}

                     <Text testID="ai-routine-title" style={styles.routineTitle}>{routine.title}</Text>
                     <Text style={styles.routineGoal}>Goal: {routine.goal}</Text>
                     <Text style={styles.routineGoal}>Target Area: {form.targetArea}</Text>

                     <View style={styles.aiNoteBlock}>
                          <Text style={styles.aiNoteHeader}>🧠 Engine Note</Text>
                          <Text style={styles.aiNoteBody}>{routine.notes || "This plan is mapped natively."}</Text>
                     </View>

                     {routine.days.map((d: any, i: number) => (
                         <View key={i} style={styles.dayCard}>
                             <Text style={styles.dayName}>{d.dayName} <Text style={{fontWeight:'500', color: d.dayType === 'workout' ? '#10b981' : '#9ca3af'}}>• {d.dayType === 'workout' ? '🔥 Workout' : '🛋️ Rest'}</Text></Text>
                             
                             {d.dayType === 'workout' && d.exercises && (
                                 <View style={styles.exerciseMap}>
                                     {d.focus && <Text style={styles.focusLabel}>Focus: {d.focus}</Text>}
                                     
                                     {d.exercises.map((ex: any, exidx: number) => (
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
    section: { marginBottom: 14 },
    label: { fontSize: 13, fontWeight: '800', color: '#4b5563', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', padding: 14, borderRadius: 10, fontSize: 16, marginBottom: 5 },
    
    optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8, marginBottom: 8, backgroundColor: '#f9fafb' },
    optionButtonSelected: { backgroundColor: '#6366f1', borderColor: '#4f46e5' },
    optionText: { color: '#4b5563', fontWeight: '600' },
    optionTextSelected: { color: '#fff', fontWeight: '800' },

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
