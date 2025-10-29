import React, { ReactNode, useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, ActivityIndicator, Text } from 'react-native-paper';
import * as ExpoImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { imageOptimizationService, ImageOptimizationOptions } from '../../services/imageOptimizationService';

interface ImagePickerProps {
  onImageSelected: (imageUri: string, metrics?: any) => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  children?: ReactNode;
  style?: any;
  enableOptimization?: boolean;
  optimizationOptions?: ImageOptimizationOptions;
  showMetrics?: boolean;
  onError?: (error: string) => void;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelected,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8,
  children,
  style,
  enableOptimization = true,
  optimizationOptions,
  showMetrics = false,
  onError,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ExpoImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    
    return {
      camera: cameraStatus === 'granted',
      mediaLibrary: mediaLibraryStatus === 'granted',
    };
  };

  const showImagePicker = async () => {
    const permissions = await requestPermissions();
    
    const options = [];
    
    if (permissions.camera) {
      options.push({ text: '相機拍照', onPress: openCamera });
    }
    
    if (permissions.mediaLibrary) {
      options.push({ text: '從相簿選擇', onPress: openGallery });
    }
    
    if (options.length === 0) {
      Alert.alert('權限不足', '需要相機和相簿權限才能選擇圖片');
      return;
    }
    
    options.push({ text: '取消', style: 'cancel' });

    Alert.alert(
      '選擇圖片',
      '請選擇圖片來源',
      options as any
    );
  };

  const processImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      setProcessingStatus('正在處理圖片...');

      let finalUri = imageUri;
      let metrics = undefined;

      if (enableOptimization) {
        setProcessingStatus('正在優化圖片...');
        
        const options: ImageOptimizationOptions = {
          maxWidth,
          maxHeight,
          quality,
          format: ImageManipulator.SaveFormat.JPEG,
          enableCache: true,
          ...optimizationOptions
        };

        const result = await imageOptimizationService.optimizeImage(imageUri, options);
        finalUri = result.uri;
        metrics = result.metrics;

        if (showMetrics && metrics) {
          const compressionPercent = (metrics.compressionRatio * 100).toFixed(1);
          const originalSizeKB = (metrics.originalSize / 1024).toFixed(1);
          const compressedSizeKB = (metrics.compressedSize / 1024).toFixed(1);
          
          Alert.alert(
            '圖片優化完成',
            `原始大小: ${originalSizeKB}KB\n壓縮後: ${compressedSizeKB}KB\n壓縮率: ${compressionPercent}%\n處理時間: ${metrics.processingTime}ms`
          );
        }
      } else {
        setProcessingStatus('正在壓縮圖片...');
        
        // 使用原有的壓縮邏輯
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [
            {
              resize: {
                width: maxWidth,
                height: maxHeight,
              },
            },
          ],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        finalUri = manipulatedImage.uri;
      }

      setProcessingStatus('完成');
      onImageSelected(finalUri, metrics);
    } catch (error) {
      console.error('圖片處理失敗:', error);
      const errorMessage = '圖片處理失敗，請重試';
      onError?.(errorMessage);
      Alert.alert('錯誤', errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const openCamera = async () => {
    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('開啟相機失敗:', error);
      Alert.alert('錯誤', '開啟相機失敗，請檢查權限設定');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('開啟相簿失敗:', error);
      Alert.alert('錯誤', '開啟相簿失敗，請檢查權限設定');
    }
  };

  if (children) {
    return (
      <TouchableOpacity 
        onPress={showImagePicker} 
        style={style}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.processingText}>{processingStatus}</Text>
          </View>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Card style={styles.card}>
        <Card.Content>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.processingText}>{processingStatus}</Text>
            </View>
          ) : (
            <Button
              mode="outlined"
              onPress={showImagePicker}
              icon="camera"
              disabled={isProcessing}
            >
              選擇圖片
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  card: {
    elevation: 2,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});