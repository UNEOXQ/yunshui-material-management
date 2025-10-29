import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Root Stack Navigator Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Splash: undefined;
};

// Auth Stack Navigator Types
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator Types
export type MainTabParamList = {
  Dashboard: undefined;
  Materials: NavigatorScreenParams<MaterialStackParamList>;
  Orders: NavigatorScreenParams<OrderStackParamList>;
  Status: undefined;
  Profile: undefined;
};

// Material Stack Navigator Types
export type MaterialStackParamList = {
  MaterialList: undefined;
  MaterialDetail: { materialId: string };
  MaterialForm: { materialId?: string };
};

// Order Stack Navigator Types
export type OrderStackParamList = {
  OrderList: undefined;
  OrderDetail: { orderId: string };
  OrderForm: { orderId?: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = StackScreenProps<
  AuthStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type MaterialStackScreenProps<T extends keyof MaterialStackParamList> = StackScreenProps<
  MaterialStackParamList,
  T
>;

export type OrderStackScreenProps<T extends keyof OrderStackParamList> = StackScreenProps<
  OrderStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}