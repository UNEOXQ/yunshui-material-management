import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OrderStackParamList } from './types';

import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrderFormScreen from '../screens/OrderFormScreen';

const Stack = createStackNavigator<OrderStackParamList>();

export default function OrderNavigator() {
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
        name="OrderList" 
        component={OrdersScreen}
        options={{
          title: '訂單管理',
        }}
      />
      <Stack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen}
        options={{
          title: '訂單詳情',
        }}
      />
      <Stack.Screen 
        name="OrderForm" 
        component={OrderFormScreen}
        options={({ route }) => ({
          title: route.params?.orderId ? '編輯訂單' : '新增訂單',
        })}
      />
    </Stack.Navigator>
  );
}