import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScheduleItem } from '../src/components/ScheduleItem';
import { ScheduleItem as ScheduleItemType } from '../src/types';
import { loadMedications } from '../src/utils/storage';

export default function TodayScheduleScreen() {
  const [schedule, setSchedule] = useState<ScheduleItemType[]>([]);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    const medications = await loadMedications();
    
    const items: ScheduleItemType[] = medications.flatMap(med =>
      med.times.map(time => ({
        ...med,
        time,
        taken: false,
      }))
    );

    items.sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(items);
  };

  const handleMarkTaken = (id: string, time: string) => {
    setSchedule(prev =>
      prev.map(item =>
        item.id === id && item.time === time ? { ...item, taken: true } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Schedule</Text>
      
      {schedule.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No medications scheduled for today</Text>
        </View>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(item, index) => `${item.id}-${item.time}-${index}`}
          renderItem={({ item }) => (
            <ScheduleItem item={item} onMarkTaken={handleMarkTaken} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});