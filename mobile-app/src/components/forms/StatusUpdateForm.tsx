import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Note: DateTimePicker would need to be installed separately
// For now, we'll use a simple date input

import { SystemStatus } from '../../store/api/statusApi';
import { useStatusSync } from '../../hooks/useStatusSync';

interface StatusUpdateFormProps {
  status: SystemStatus;
  onUpdate: (success: boolean) => void;
  onCancel: () => void;
}

const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
  status,
  onUpdate,
  onCancel,
}) => {
  const [value, setValue] = useState(status.value);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());

  const { updateStatus } = useStatusSync();

  // Initialize date value for DATE type
  useEffect(() => {
    if (status.type === 'DATE' && status.value) {
      try {
        setDateValue(new Date(status.value));
      } catch (error) {
        setDateValue(new Date());
      }
    }
  }, [status]);

  const handleSubmit = async () => {
    if (!value.trim() && status.type !== 'BOOLEAN') {
      Alert.alert('錯誤', '請輸入狀態值');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await updateStatus(status.id, value, reason.trim() || undefined);
      
      if (success) {
        Alert.alert('成功', '狀態已更新', [
          { text: '確定', onPress: () => onUpdate(true) }
        ]);
      } else {
        Alert.alert('錯誤', '更新狀態失敗，請稍後再試');
        onUpdate(false);
      }
    } catch (error) {
      Alert.alert('錯誤', '更新狀態失敗，請稍後再試');
      onUpdate(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateValue(selectedDate);
      setValue(selectedDate.toISOString());
    }
  };

  const renderValueInput = () => {
    switch (status.type) {
      case 'TEXT':
        return (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder="輸入文字值"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        );

      case 'NUMBER':
        return (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder="輸入數字值"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        );

      case 'BOOLEAN':
        return (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              {value === 'true' ? '是' : '否'}
            </Text>
            <Switch
              value={value === 'true'}
              onValueChange={(newValue) => setValue(newValue.toString())}
              trackColor={{ false: '#ddd', true: '#007bff' }}
              thumbColor={value === 'true' ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        );

      case 'DATE':
        return (
          <View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialCommunityIcons name="calendar" size={20} color="#007bff" />
              <Text style={styles.dateButtonText}>
                {dateValue.toLocaleDateString('zh-TW')}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <TextInput
                style={styles.textInput}
                value={dateValue.toISOString().split('T')[0]}
                onChangeText={(text) => {
                  try {
                    const newDate = new Date(text);
                    setDateValue(newDate);
                    setValue(newDate.toISOString());
                  } catch (error) {
                    // Invalid date format
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            )}
          </View>
        );

      default:
        return (
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder="輸入狀態值"
            placeholderTextColor="#999"
          />
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT':
        return 'text';
      case 'NUMBER':
        return 'numeric';
      case 'BOOLEAN':
        return 'toggle-switch';
      case 'DATE':
        return 'calendar';
      default:
        return 'information';
    }
  };

  const formatCurrentValue = (value: string, type: string) => {
    switch (type) {
      case 'BOOLEAN':
        return value === 'true' ? '是' : '否';
      case 'DATE':
        try {
          return new Date(value).toLocaleDateString('zh-TW');
        } catch {
          return value;
        }
      default:
        return value;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Info */}
      <View style={styles.statusInfo}>
        <View style={styles.statusHeader}>
          <MaterialCommunityIcons
            name={getTypeIcon(status.type) as any}
            size={24}
            color="#007bff"
          />
          <View style={styles.statusDetails}>
            <Text style={styles.statusName}>{status.name}</Text>
            <Text style={styles.statusCategory}>{status.category}</Text>
          </View>
        </View>
        
        {status.description && (
          <Text style={styles.statusDescription}>{status.description}</Text>
        )}
        
        <View style={styles.currentValueContainer}>
          <Text style={styles.currentValueLabel}>目前值:</Text>
          <Text style={styles.currentValue}>
            {formatCurrentValue(status.value, status.type)}
          </Text>
        </View>
      </View>

      {/* New Value Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>新值</Text>
        {renderValueInput()}
      </View>

      {/* Reason Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>變更原因 (選填)</Text>
        <TextInput
          style={[styles.textInput, styles.reasonInput]}
          value={reason}
          onChangeText={setReason}
          placeholder="輸入變更原因，例如：系統維護、數據更新等"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>更新</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Real-time Sync Indicator */}
      <View style={styles.syncIndicator}>
        <MaterialCommunityIcons name="sync" size={16} color="#28a745" />
        <Text style={styles.syncText}>即時同步已啟用</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statusInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDetails: {
    marginLeft: 12,
    flex: 1,
  },
  statusName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statusCategory: {
    fontSize: 14,
    color: '#666',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  currentValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentValueLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  currentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  reasonInput: {
    height: 80,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  syncText: {
    fontSize: 12,
    color: '#28a745',
    marginLeft: 4,
  },
});

export default StatusUpdateForm;