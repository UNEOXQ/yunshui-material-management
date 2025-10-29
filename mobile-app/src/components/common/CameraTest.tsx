import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';
import { ImagePicker } from './ImagePicker';
import { ImagePreview } from './ImagePreview';
import * as ExpoImagePicker from 'expo-image-picker';

export const CameraTest: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<{
    camera: boolean;
    mediaLibrary: boolean;
  }>({ camera: false, mediaLibrary: false });

  const checkPermissions = async () => {
    try {
      const cameraPermission = await ExpoImagePicker.getCameraPermissionsAsync();
      const mediaLibraryPermission = await ExpoImagePicker.getMediaLibraryPermissionsAsync();
      
      setPermissions({
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted',
      });

      Alert.alert(
        '權限狀態',
        `相機權限: ${cameraPermission.status}\n相簿權限: ${mediaLibraryPermission.status}`
      );
    } catch (error) {
      console.error('檢查權限失敗:', error);
      Alert.alert('錯誤', '檢查權限失敗');
    }
  };

  const requestPermissions = async () => {
    try {
      const cameraPermission = await ExpoImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      
      setPermissions({
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted',
      });

      Alert.alert(
        '權限請求結果',
        `相機權限: ${cameraPermission.status}\n相簿權限: ${mediaLibraryPermission.status}`
      );
    } catch (error) {
      console.error('請求權限失敗:', error);
      Alert.alert('錯誤', '請求權限失敗');
    }
  };

  const handleImageSelected = (imageUri: string) => {
    setSelectedImages(prev => [...prev, imageUri]);
    Alert.alert('成功', '圖片已選擇');
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    Alert.alert(
      '確認清除',
      '確定要清除所有圖片嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: () => setSelectedImages([]),
        },
      ]
    );
  };

  const testDirectCamera = async () => {
    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('直接相機測試失敗:', error);
      Alert.alert('錯誤', '直接相機測試失敗');
    }
  };

  const testDirectGallery = async () => {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('直接相簿測試失敗:', error);
      Alert.alert('錯誤', '直接相簿測試失敗');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>相機功能測試</Text>
          
          <View style={styles.permissionSection}>
            <Text style={styles.sectionTitle}>權限狀態</Text>
            <View style={styles.permissionRow}>
              <Text>相機權限:</Text>
              <Chip mode={permissions.camera ? 'flat' : 'outlined'}>
                {permissions.camera ? '已授權' : '未授權'}
              </Chip>
            </View>
            <View style={styles.permissionRow}>
              <Text>相簿權限:</Text>
              <Chip mode={permissions.mediaLibrary ? 'flat' : 'outlined'}>
                {permissions.mediaLibrary ? '已授權' : '未授權'}
              </Chip>
            </View>
            
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={checkPermissions} style={styles.button}>
                檢查權限
              </Button>
              <Button mode="contained" onPress={requestPermissions} style={styles.button}>
                請求權限
              </Button>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.testSection}>
            <Text style={styles.sectionTitle}>功能測試</Text>
            
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={testDirectCamera} style={styles.button}>
                直接相機
              </Button>
              <Button mode="outlined" onPress={testDirectGallery} style={styles.button}>
                直接相簿
              </Button>
            </View>

            <ImagePicker
              onImageSelected={handleImageSelected}
              maxWidth={600}
              maxHeight={600}
              quality={0.8}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.sectionTitle}>
                已選擇圖片 ({selectedImages.length})
              </Text>
              {selectedImages.length > 0 && (
                <Button mode="outlined" onPress={clearAllImages} compact>
                  清除全部
                </Button>
              )}
            </View>

            {selectedImages.map((imageUri, index) => (
              <ImagePreview
                key={index}
                imageUri={imageUri}
                title={`圖片 ${index + 1}`}
                onRemove={() => removeImage(index)}
              />
            ))}

            {selectedImages.length === 0 && (
              <Text style={styles.emptyText}>尚未選擇任何圖片</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  permissionSection: {
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  testSection: {
    marginBottom: 16,
  },
  imageSection: {
    marginTop: 16,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
});