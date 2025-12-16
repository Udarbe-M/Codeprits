import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Medication } from '../src/types';
import { addMedication } from '../src/utils/storage';
import { extractTextFromImage, parsePrescriptionText } from '../src/utils/ocr';
import { scheduleNotification } from '../src/utils/notifications';

export default function AddMedicationScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [medication, setMedication] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['09:00'],
    startDate: new Date().toISOString().split('T')[0],
    instructions: '',
  });

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const uploadPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setIsProcessing(true);

    try {
      const text = await extractTextFromImage(uri);
      const extracted = parsePrescriptionText(text);
      
      setMedication(prev => ({
        ...prev,
        ...extracted,
        imageUri: uri,
      }));

      Alert.alert('Success', 'Prescription scanned! Please verify the extracted information.');
    } catch (error) {
      Alert.alert('Error', 'Failed to process image. Please enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addTime = () => {
    setMedication(prev => ({
      ...prev,
      times: [...(prev.times || []), '12:00'],
    }));
  };

  const updateTime = (index: number, value: string): void => {
    const newTimes = [...(medication.times || [])];
    newTimes[index] = value;
    setMedication(prev => ({ ...prev, times: newTimes }));
  };

  const removeTime = (index: number): void => {
    if ((medication.times?.length || 0) > 1) {
      setMedication(prev => ({
        ...prev,
        times: prev.times?.filter((_, i) => i !== index) || [],
      }));
    }
  };

  const handleSave = async () => {
    if (!medication.name || !medication.dosage) {
      Alert.alert('Error', 'Please fill in medication name and dosage.');
      return;
    }

    const newMed: Medication = {
      id: Date.now().toString(),
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency as any,
      times: medication.times || ['09:00'],
      startDate: medication.startDate || new Date().toISOString().split('T')[0],
      instructions: medication.instructions,
      imageUri: medication.imageUri,
    };

    try {
      await addMedication(newMed);
      
      for (const time of newMed.times) {
        await scheduleNotification(newMed, time);
      }

      Alert.alert('Success', 'Medication added successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save medication.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scan Prescription</Text>
        
        {!imageUri ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Text style={styles.imageButtonIcon}>📷</Text>
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageButton} onPress={uploadPhoto}>
              <Text style={styles.imageButtonIcon}>📁</Text>
              <Text style={styles.imageButtonText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setImageUri(null)}
            >
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.processingText}>Processing image...</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Medication Name *</Text>
        <TextInput
          style={styles.input}
          value={medication.name}
          onChangeText={(text) => setMedication(prev => ({ ...prev, name: text }))}
          placeholder="e.g., Amoxicillin"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dosage *</Text>
        <TextInput
          style={styles.input}
          value={medication.dosage}
          onChangeText={(text) => setMedication(prev => ({ ...prev, dosage: text }))}
          placeholder="e.g., 500mg"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.frequencyContainer}>
          {(['daily', 'twice', 'thrice', 'weekly'] as const).map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                medication.frequency === freq && styles.frequencyButtonActive,
              ]}
              onPress={() => setMedication(prev => ({ ...prev, frequency: freq }))}
            >
              <Text
                style={[
                  styles.frequencyText,
                  medication.frequency === freq && styles.frequencyTextActive,
                ]}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Reminder Times</Text>
        {medication.times?.map((time, index) => (
          <View key={index} style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={time}
              onChangeText={(text) => updateTime(index, text)}
              placeholder="09:00"
            />
            {(medication.times?.length || 0) > 1 && (
              <TouchableOpacity
                style={styles.removeTimeButton}
                onPress={() => removeTime(index)}
              >
                <Text style={styles.removeTimeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addTimeButton} onPress={addTime}>
          <Text style={styles.addTimeText}>+ Add another time</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={medication.instructions}
          onChangeText={(text) => setMedication(prev => ({ ...prev, instructions: text }))}
          placeholder="e.g., Take with food"
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Medication</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeImageButton: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeImageText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  processingContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  processingText: {
    marginTop: 8,
    color: '#3b82f6',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  frequencyButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  frequencyText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  frequencyTextActive: {
    color: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timeInput: {
    flex: 1,
  },
  removeTimeButton: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
  },
  removeTimeText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 12,
  },
  addTimeButton: {
    marginTop: 8,
  },
  addTimeText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});