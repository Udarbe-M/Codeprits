import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MedicationCard } from '../src/components/MedicationCard';
import { Medication } from '../src/types';
import { loadMedications, deleteMedication } from '../src/utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedications = async () => {
    const meds = await loadMedications();
    setMedications(meds);
  };

  // Load medications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchMedications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedications();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMedication(id);
    await fetchMedications();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Prescription Manager</Text>
          <Text style={styles.subtitle}>Track your medications</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-medication')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.todayButton}
        onPress={() => router.push('/today-schedule')}
      >
        <Text style={styles.todayButtonText}>📅 View Today's Schedule</Text>
      </TouchableOpacity>

      {medications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyText}>No medications added yet</Text>
          <Text style={styles.emptySubtext}>Tap "+ Add" to get started</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicationCard medication={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  todayButton: {
    margin: 16,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  todayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});