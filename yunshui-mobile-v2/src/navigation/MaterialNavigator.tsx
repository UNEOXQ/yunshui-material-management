import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialStackParamList } from './types';

import MaterialsScreen from '../screens/MaterialsScreen';
import MaterialDetailScreen from '../screens/MaterialDetailScreen';
import MaterialFormScreen from '../screens/MaterialFormScreen';

const Stack = createStackNavigator<MaterialStackParamList>();

export default function MaterialNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="MaterialList" 
        component={MaterialsScreen}
        options={{
          title: '基材管理',
        }}
      />
      <Stack.Screen 
        name="MaterialDetail" 
        component={MaterialDetailScreen}
        options={{
          title: '基材詳情',
        }}
      />
      <Stack.Screen 
        name="MaterialForm" 
        component={MaterialFormScreen}
        options={({ route }) => ({
          title: route.params?.materialId ? '編輯基材' : '新增基材',
        })}
      />
    </Stack.Navigator>
  );
}