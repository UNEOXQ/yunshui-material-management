import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';

interface Material {
  id: string;
  name: string;
  category: string;
  specification: string;
  unit: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface MaterialListProps {
  materials: Material[];
  onItemPress: (material: Material) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  onItemPress,
  loading = false,
  onRefresh,
}) => {
  const renderMaterial = ({ item }: { item: Material }) => (
    <Card style={styles.card} onPress={() => onItemPress(item)}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.name}>
          {item.name}
        </Text>
        <Text variant="bodyMedium" style={styles.specification}>
          {item.specification}
        </Text>
        <Chip style={styles.category}>{item.category}</Chip>
        <Text variant="bodySmall" style={styles.details}>
          單價: ${item.price} / {item.unit} | 庫存: {item.stock}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <FlatList
      data={materials}
      renderItem={renderMaterial}
      keyExtractor={(item) => item.id}
      style={styles.list}
      refreshing={loading}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    elevation: 2,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specification: {
    marginBottom: 8,
  },
  category: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  details: {
    color: '#666',
  },
});