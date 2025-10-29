import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  SegmentedButtons,
  ActivityIndicator,
  Menu,
  Divider,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '../styles/theme';
import { materialService } from '../services/materialService';
import { uploadService } from '../services/uploadService';
import { ImagePicker } from '../components/common/ImagePicker';
import { ImagePreview } from '../components/common/ImagePreview';
import { MaterialStackScreenProps } from '../navigation/types';

interface FormData {
  name: string;
  category: string;
  specification: string;
  quantity: string;
  supplier: string;
  type: 'AUXILIARY' | 'FINISHED';
}

interface FormErrors {
  name?: string;
  category?: string;
  specification?: string;
  quantity?: string;
  supplier?: string;
}

type Props = MaterialStackScreenProps<'MaterialForm'>;

export default function MaterialFormScreen({ navigation, route }: Props) {
  const { materialId } = route.params || {};
  const isEditing = !!materialId;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    specification: '',
    quantity: '0',
    supplier: '',
    type: 'AUXILIARY',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Category and supplier suggestions
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [supplierMenuVisible, setSupplierMenuVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: isEditing ? '編輯基材' : '新增基材',
    });

    loadInitialData();
  }, [isEditing, materialId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Load categories and suppliers
      const [categoriesData, suppliersData] = await Promise.all([
        materialService.getCategories(),
        materialService.getSuppliers(),
      ]);

      setCategories(categoriesData);
      setSuppliers(suppliersData);

      // Load material data if editing
      if (isEditing && materialId) {
        const material = await materialService.getMaterialById(materialId);
        setFormData({
          name: material.name,
          category: material.category,
          specification: material.specification,
          quantity: material.quantity.toString(),
          supplier: material.supplier || '',
          type: material.type,
        });
        setExistingImageUrl(material.imageUrl || null);
      }
    } catch (error) {
      console.error('載入初始資料失敗:', error);
      Alert.alert('錯誤', '載入資料失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '材料名稱不能為空';
    } else if (formData.name.length > 100) {
      newErrors.name = '材料名稱不能超過100個字符';
    }

    if (!formData.category.trim()) {
      newErrors.category = '分類不能為空';
    } else if (formData.category.length > 50) {
      newErrors.category = '分類不能超過50個字符';
    }

    if (!formData.specification.trim()) {
      newErrors.specification = '規格說明不能為空';
    } else if (formData.specification.length > 200) {
      newErrors.specification = '規格說明不能超過200個字符';
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      newErrors.quantity = '數量必須為非負整數';
    }

    if (formData.supplier && formData.supplier.length > 100) {
      newErrors.supplier = '供應商名稱不能超過100個字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('驗證失敗', '請檢查表單中的錯誤');
      return;
    }

    try {
      setIsSaving(true);

      let imageUrl = existingImageUrl;

      // Upload image if selected
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await uploadService.uploadImage(selectedImage, 'materials');
          imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('圖片上傳失敗:', uploadError);
          Alert.alert('警告', '圖片上傳失敗，但材料資料將繼續保存');
        } finally {
          setIsUploadingImage(false);
        }
      }

      const materialData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        specification: formData.specification.trim(),
        quantity: parseInt(formData.quantity),
        supplier: formData.supplier.trim() || undefined,
        type: formData.type,
      };

      if (isEditing && materialId) {
        await materialService.updateMaterial(materialId, materialData);
        Alert.alert('成功', '材料已更新', [
          { text: '確定', onPress: () => navigation.goBack() },
        ]);
      } else {
        await materialService.createMaterial(materialData);
        Alert.alert('成功', '材料已新增', [
          { text: '確定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('保存材料失敗:', error);
      Alert.alert('錯誤', '保存材料失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelected = (imageUri: string) => {
    setSelectedImage(imageUri);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setExistingImageUrl(null);
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderImageSection = () => {
    const hasImage = selectedImage || existingImageUrl;

    if (hasImage) {
      return (
        <ImagePreview
          imageUri={selectedImage || existingImageUrl!}
          title="材料圖片"
          onRemove={removeImage}
          onReplace={() => {
            // 觸發圖片選擇
          }}
          loading={isUploadingImage}
        />
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>材料圖片</Text>
          
          <View style={styles.noImageContainer}>
            <MaterialCommunityIcons name="image-plus" size={48} color="#ccc" />
            <Text style={styles.noImageText}>尚未選擇圖片</Text>
            <ImagePicker onImageSelected={handleImageSelected}>
              <Button mode="contained" icon="camera" style={styles.addImageButton}>
                選擇圖片
              </Button>
            </ImagePicker>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderCategoryInput = () => (
    <View style={styles.inputContainer}>
      <Menu
        visible={categoryMenuVisible}
        onDismiss={() => setCategoryMenuVisible(false)}
        anchor={
          <TextInput
            label="分類 *"
            value={formData.category}
            onChangeText={(value) => updateFormData('category', value)}
            error={!!errors.category}
            style={styles.input}
            right={
              <TextInput.Icon
                icon="chevron-down"
                onPress={() => setCategoryMenuVisible(true)}
              />
            }
          />
        }
      >
        {categories.map((category) => (
          <Menu.Item
            key={category}
            onPress={() => {
              updateFormData('category', category);
              setCategoryMenuVisible(false);
            }}
            title={category}
          />
        ))}
        <Divider />
        <Menu.Item
          onPress={() => setCategoryMenuVisible(false)}
          title="自訂分類"
        />
      </Menu>
      {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
    </View>
  );

  const renderSupplierInput = () => (
    <View style={styles.inputContainer}>
      <Menu
        visible={supplierMenuVisible}
        onDismiss={() => setSupplierMenuVisible(false)}
        anchor={
          <TextInput
            label="供應商"
            value={formData.supplier}
            onChangeText={(value) => updateFormData('supplier', value)}
            error={!!errors.supplier}
            style={styles.input}
            right={
              suppliers.length > 0 ? (
                <TextInput.Icon
                  icon="chevron-down"
                  onPress={() => setSupplierMenuVisible(true)}
                />
              ) : undefined
            }
          />
        }
      >
        {suppliers.map((supplier) => (
          <Menu.Item
            key={supplier}
            onPress={() => {
              updateFormData('supplier', supplier);
              setSupplierMenuVisible(false);
            }}
            title={supplier}
          />
        ))}
      </Menu>
      {errors.supplier && <Text style={styles.errorText}>{errors.supplier}</Text>}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[commonStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 基本資訊 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>基本資訊</Text>

            <View style={styles.inputContainer}>
              <TextInput
                label="材料名稱 *"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                error={!!errors.name}
                style={styles.input}
                maxLength={100}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {renderCategoryInput()}

            <View style={styles.inputContainer}>
              <TextInput
                label="規格說明 *"
                value={formData.specification}
                onChangeText={(value) => updateFormData('specification', value)}
                error={!!errors.specification}
                style={styles.input}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              {errors.specification && <Text style={styles.errorText}>{errors.specification}</Text>}
            </View>

            <View style={styles.typeContainer}>
              <Text style={styles.typeLabel}>材料類型 *</Text>
              <SegmentedButtons
                value={formData.type}
                onValueChange={(value) => updateFormData('type', value as 'AUXILIARY' | 'FINISHED')}
                buttons={[
                  {
                    value: 'AUXILIARY',
                    label: '輔助材料',
                    icon: 'package-variant-closed',
                  },
                  {
                    value: 'FINISHED',
                    label: '成品材料',
                    icon: 'package-variant',
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>
          </Card.Content>
        </Card>

        {/* 庫存和供應商 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>庫存和供應商</Text>

            <View style={styles.inputContainer}>
              <TextInput
                label="初始數量 *"
                value={formData.quantity}
                onChangeText={(value) => updateFormData('quantity', value)}
                error={!!errors.quantity}
                style={styles.input}
                keyboardType="numeric"
                right={<TextInput.Affix text="個" />}
              />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>

            {renderSupplierInput()}
          </Card.Content>
        </Card>

        {/* 圖片 */}
        {renderImageSection()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 底部按鈕 */}
      <View style={styles.bottomButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          disabled={isSaving}
        >
          取消
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.button}
          loading={isSaving || isUploadingImage}
          disabled={isSaving || isUploadingImage}
        >
          {isEditing ? '更新' : '新增'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  typeContainer: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  imageContainer: {
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageButton: {
    flex: 1,
  },
  noImageContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noImageText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
  },
  addImageButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});