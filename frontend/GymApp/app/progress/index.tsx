import React, { useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/constants/api';



export default function ProgressDashboardScreen() {
    const router = useRouter();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    const fetchProgress = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.PROGRESS(user.id || user._id || 'testUser123')}?limit=5`);
            const json = await res.json();
            if (res.ok) setData(json);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProgress();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProgress();
    }, [user?.id]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    // Handle Gym users - show appropriate message
    if (user?.role === 'gym') {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 20 }}>
                    Progress tracking is available for individual users only.
                </Text>
                <TouchableOpacity
                    style={{ paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#f97316', borderRadius: 8 }}
                    onPress={() => router.back()}
                >
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!data) return null;

    return (
        <ScrollView 
           style={styles.container}
           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
           showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{"← Back"}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Your Progress</Text>
            </View>

            {/* Overview Card */}
             <View style={styles.overviewCard}>
                 <Text style={styles.cardHeader}>🎯 Active Routine: {data.overview.activeRoutineTitle}</Text>
                 <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{data.overview.totalSessionsCompleted}</Text>
                        <Text style={styles.statLabel}>Total Workouts</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{data.overview.totalRestDaysLogged}</Text>
                        <Text style={styles.statLabel}>Rest Days</Text>
                    </View>
                 </View>
             </View>

            {/* Smart Coaching Integration Hook */}
             <TouchableOpacity 
                 style={styles.coachingBanner} 
                 onPress={() => router.push('/coaching')}
             >
                 <View style={styles.coachingIconBox}><Text style={{fontSize: 22}}>🤖</Text></View>
                 <View style={{flex: 1}}>
                     <Text style={styles.coachingBannerTitle}>View Coaching Suggestions</Text>
                     <Text style={styles.coachingBannerSub}>Math-driven updates ready for your approval.</Text>
                 </View>
                 <Text style={{fontSize: 20, color:'#10b981', fontWeight:'900'}}>→</Text>
             </TouchableOpacity>

            {/* Weekly Consistency */}
            <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Weekly Consistency</Text>
                <View style={styles.weeklyBox}>
                    <View style={styles.consistencyRow}>
                        <Text style={styles.metricBig}>{data.weeklyConsistency.sessionsThisWeek}</Text>
                        <Text style={styles.metricDesc}>Sessions Logged This Week</Text>
                    </View>
                    <View style={styles.consistencyRow}>
                        <Text style={styles.metricBig}>{data.weeklyConsistency.restDaysThisWeek}</Text>
                        <Text style={styles.metricDesc}>Rest Days Logged</Text>
                    </View>
                </View>
            </View>

            {/* Highlights Section */}
            <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Highlights</Text>
                <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                   <View style={{ flex: 1, paddingRight: 10 }}>
                       <Text style={styles.hgTitle}>Top Lift 🏋️‍♂️</Text>
                       <Text style={styles.hgVal}>{data.highlights.highestWeightLifted} kg</Text>
                       <Text style={styles.hgDesc}>{data.highlights.highestWeightExercise}</Text>
                   </View>
                   <View style={{ width: 1, backgroundColor: '#e5e7eb' }} />
                   <View style={{ flex: 1, paddingLeft: 15 }}>
                       <Text style={styles.hgTitle}>Favorite 🔄</Text>
                       <Text style={styles.hgVal} numberOfLines={1}>{data.highlights.mostRepeatedExercise}</Text>
                       <Text style={styles.hgDesc}>Most executed</Text>
                   </View>
                </View>
            </View>

            {/* Exercise Trajectory */}
            <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>Exercise Trajectories (Top 5)</Text>

                {data.exerciseProgress.length === 0 ? (
                    <Text style={styles.emptyText}>No exercise logs available yet. Time to hit the gym!</Text>
                ) : (
                    data.exerciseProgress.map((ex, idx) => {
                        let badge = "➖ Stable";
                        let badgeColor = "#6b7280";
                        if (ex.trendDirection === 'up') { badge = `📈 Improving ${ex.trendDiff}`; badgeColor = "#10b981"; }
                        if (ex.trendDirection === 'down') { badge = `📉 Decreasing ${ex.trendDiff}`; badgeColor = "#ef4444"; }
                        if (ex.trendDirection === 'stable') { badge = `➖ Stable ${ex.trendDiff}`; }

                        return (
                            <View key={idx} style={styles.trajectoryCard}>
                                <View style={styles.trajHeadRow}>
                                    <Text style={styles.trajTitle}>{ex.exerciseName}</Text>
                                    <View style={[styles.trendBadge, { backgroundColor: badgeColor + '15' }]}>
                                         <Text style={[styles.trendText, { color: badgeColor }]}>{badge}</Text>
                                    </View>
                                </View>
                                <Text style={styles.trajFreq}>Executed {ex.frequency} times</Text>

                                <View style={styles.logWrap}>
                                    {ex.recentLogs.map((log, lidx) => (
                                        <View key={lidx} style={styles.microLog}>
                                            <Text style={styles.microDate}>{new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</Text>
                                            <View style={styles.microMetrics}>
                                                <Text style={styles.microWeight}>{log.weight > 0 ? `${log.weight}kg ` : ''}</Text>
                                                <Text style={styles.microVol}>{log.type === 'reps' ? `x ${log.reps}` : `x ${log.duration}s`}</Text>
                                                {log.count > 1 && <Text style={{fontSize:11, color:'#9ca3af', fontStyle:'italic', marginLeft:6, alignSelf: 'center'}}>({log.count} sessions)</Text>}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f3f5', padding: 20, paddingTop: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
    backBtn: { paddingRight: 15 },
    backBtnText: { fontSize: 16, color: '#f97316', fontWeight: 'bold' },
    title: { fontSize: 28, fontWeight: '900', color: '#1f2937' },

    overviewCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width:0, height:4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 25 },
    cardHeader: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginBottom: 15 },
    statGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, alignItems: 'center', backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginRight: 5 },
    statVal: { fontSize: 26, fontWeight: '900', color: '#f97316' },
    statLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', marginTop: 4 },

    coachingBanner: { flexDirection: 'row', backgroundColor: '#eef2ff', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#c7d2fe' },
    coachingIconBox: { backgroundColor: '#fff', padding: 10, borderRadius: 12, marginRight: 15, shadowColor: '#4A60E6', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
    coachingBannerTitle: { fontSize: 16, fontWeight: '800', color: '#1f2937' },
    coachingBannerSub: { fontSize: 13, color: '#6b7280', marginTop: 3 },

    sectionBlock: { marginBottom: 30 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1f2937', marginBottom: 15, letterSpacing: 0.5 },

    weeklyBox: { backgroundColor: '#fff', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    consistencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    metricBig: { fontSize: 22, fontWeight: '900', color: '#10b981', width: 40 },
    metricDesc: { fontSize: 15, color: '#4b5563', fontWeight: '600' },

    card: { backgroundColor: '#fff', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    hgTitle: { fontSize: 14, color: '#6b7280', fontWeight: '700', marginBottom: 8 },
    hgVal: { fontSize: 22, fontWeight: '900', color: '#4f46e5' },
    hgDesc: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', marginTop: 4 },

    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 10 },

    trajectoryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
    trajHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    trajTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937' },
    trendBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    trendText: { fontSize: 12, fontWeight: '800' },
    trajFreq: { fontSize: 12, color: '#9ca3af', fontWeight: '600', marginTop: 4, marginBottom: 12 },

    logWrap: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10 },
    microLog: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    microDate: { fontSize: 13, color: '#4b5563', fontWeight: '600', width: 60 },
    microMetrics: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end', gap: 15 },
    microWeight: { fontSize: 14, fontWeight: '800', color: '#1f2937' },
    microVol: { fontSize: 13, color: '#6b7280', fontWeight: '700' }
});
