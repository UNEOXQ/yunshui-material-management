import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton, Badge, ActivityIndicator } from 'react-native-paper';
import { useSync, useNetworkState, useOfflineActions } from '../../hooks/useSync';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface SyncStatusProps {
  showDetails?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  showDetails = false,
  onPress,
  compact = false,
}) => {
  const {
    issyncing,
    lastSyncTime,
    canSync,
    lastSyncResult,
    manualSync,
  } = useSync();
  
  const { isOnline, connectionType } = useNetworkState();
  const { pendingActions, hasPendingActions } = useOfflineActions();

  const handleSyncPress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    if (!issyncing && canSync) {
      try {
        await manualSync();
      } catch (error) {
        console.error('Manual sync failed:', error);
      }
    }
  };

  const getSyncStatusText = () => {
    if (issyncing) {
      return '同步中...';
    }

    if (!isOnline) {
      return '離線模式';
    }

    if (!canSync) {
      return '無法同步';
    }

    if (lastSyncTime === 0) {
      return '尚未同步';
    }

    const timeAgo = formatDistanceToNow(new Date(lastSyncTime), {
      addSuffix: true,
      locale: zhTW,
    });
    return `${timeAgo}同步`;
  };

  const getSyncStatusColor = () => {
    if (issyncing) {
      return '#2196F3'; // 藍色
    }

    if (!isOnline) {
      return '#FF9800'; // 橙色
    }

    if (hasPendingActions) {
      return '#FF5722'; // 紅色
    }

    if (lastSyncResult?.success === false) {
      return '#F44336'; // 深紅色
    }

    return '#4CAF50'; // 綠色
  };

  const getSyncIcon = () => {
    if (issyncing) {
      return 'sync';
    }

    if (!isOnline) {
      return 'wifi-off';
    }

    if (hasPendingActions) {
      return 'cloud-upload';
    }

    return 'check-circle';
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, { borderColor: getSyncStatusColor() }]}
        onPress={handleSyncPress}
        disabled={issyncing || !canSync}
      >
        <View style={styles.compactContent}>
          {issyncing ? (
            <ActivityIndicator size="small" color={getSyncStatusColor()} />
          ) : (
            <IconButton
              icon={getSyncIcon()}
              size={16}
              iconColor={getSyncStatusColor()}
              style={styles.compactIcon}
            />
          )}
          {hasPendingActions && (
            <Badge
              size={12}
              style={[styles.badge, { backgroundColor: getSyncStatusColor() }]}
            >
              {pendingActions}
            </Badge>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleSyncPress}
      disabled={issyncing || !canSync}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {issyncing ? (
            <ActivityIndicator size="small" color={getSyncStatusColor()} />
          ) : (
            <IconButton
              icon={getSyncIcon()}
              size={20}
              iconColor={getSyncStatusColor()}
            />
          )}
          {hasPendingActions && (
            <Badge
              size={16}
              style={[styles.badge, { backgroundColor: getSyncStatusColor() }]}
            >
              {pendingActions}
            </Badge>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: getSyncStatusColor() }]}>
            {getSyncStatusText()}
          </Text>
          
          {showDetails && (
            <>
              <Text style={styles.detailText}>
                網路: {connectionType}
              </Text>
              
              {hasPendingActions && (
                <Text style={styles.detailText}>
                  待同步: {pendingActions} 項操作
                </Text>
              )}
              
              {lastSyncResult && !lastSyncResult.success && (
                <Text style={styles.errorText}>
                  同步失敗: {lastSyncResult.errors[0]}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  compactContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  compactIcon: {
    margin: 0,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
  },
});

export default SyncStatus;