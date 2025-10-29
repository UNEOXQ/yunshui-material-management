import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-netinfo/netinfo';
import { ResponsiveText } from './ResponsiveText';
import { spacing, responsive } from '../../utils/responsive';
import { HapticFeedback, HapticFeedbackType } from '../../utils/gestures';

interface NetworkStatusProps {
  showWhenOnline?: boolean;
  onNetworkChange?: (isConnected: boolean) => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showWhenOnline = false,
  onNetworkChange,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<string>('');
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const slideAnim = new Animated.Value(-50);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      const type = state.type || '';
      
      setIsConnected(connected);
      setNetworkType(type);
      
      // 決定是否顯示橫幅
      const shouldShow = !connected || (connected && showWhenOnline);
      setShowBanner(shouldShow);
      
      // 觸發回調
      onNetworkChange?.(connected);
      
      // 觸覺反饋
      if (!connected) {
        HapticFeedback.trigger(HapticFeedbackType.WARNING);
      } else {
        HapticFeedback.trigger(HapticFeedbackType.SUCCESS);
      }
    });

    return unsubscribe;
  }, [showWhenOnline, onNetworkChange]);

  useEffect(() => {
    if (showBanner) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showBanner]);

  if (!showBanner) {
    return null;
  }

  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        text: '無網路連線',
        backgroundColor: '#f44336',
        textColor: '#fff',
        icon: '📡',
      };
    }

    return {
      text: `已連線 (${networkType.toUpperCase()})`,
      backgroundColor: '#4caf50',
      textColor: '#fff',
      icon: '✅',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: statusInfo.backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ResponsiveText
        variant="body2"
        style={[styles.text, { color: statusInfo.textColor }]}
      >
        {statusInfo.icon} {statusInfo.text}
      </ResponsiveText>
    </Animated.View>
  );
};

// Hook for network status
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<string>('');
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setNetworkType(state.type || '');
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    networkType,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
});