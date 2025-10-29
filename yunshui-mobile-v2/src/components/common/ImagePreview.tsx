import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ImagePreviewProps {
  imageUri: string;
  onRemove?: () => void;
  onReplace?: () => void;
  title?: string;
  editable?: boolean;
  loading?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUri,
  onRemove,
  onReplace,
  title = '圖片預覽',
  editable = true,
  loading = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleRemove = () => {
    Alert.alert(
      '確認移除',
      '確定要移除這張圖片嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: onRemove,
        },
      ]
    );
  };

  const renderImageContent = () => {
    if (imageError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="image-broken" size={48} color="#dc3545" />
          <Text style={styles.errorText}>圖片載入失敗</Text>
        </View>
      );
    }

    return (
      <>
        <Image
          source={{ uri: imageUri }}
          style={styles.previewImage}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" />
          </View>
        )}
        {!imageError && (
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {loading && <ActivityIndicator size="small" />}
          </View>

          <View style={styles.imageContainer}>
            {renderImageContent()}
          </View>

          {editable && !imageError && (
            <View style={styles.actions}>
              {onReplace && (
                <Button
                  mode="outlined"
                  onPress={onReplace}
                  style={styles.actionButton}
                  icon="camera"
                  compact
                >
                  更換
                </Button>
              )}
              {onRemove && (
                <Button
                  mode="outlined"
                  onPress={handleRemove}
                  style={styles.actionButton}
                  icon="delete"
                  compact
                  textColor="#dc3545"
                >
                  移除
                </Button>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* 全螢幕圖片查看 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <Image
                source={{ uri: imageUri }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              <IconButton
                icon="close"
                size={30}
                iconColor="#ffffff"
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              />
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#dc3545',
    fontSize: 14,
  },
  zoomButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.95,
    height: height * 0.8,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});