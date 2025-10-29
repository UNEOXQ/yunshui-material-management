import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, ProgressBar, Chip } from 'react-native-paper';
import { securityService } from '../../services/securityService';

interface SecurityMonitorProps {
  onSecurityIssue?: (issue: string) => void;
  showDetails?: boolean;
  autoCheck?: boolean;
  checkInterval?: number; // 毫秒
}

interface SecurityStatus {
  deviceBinding: boolean;
  appIntegrity: boolean;
  tamperDetection: boolean;
  biometricSupported: boolean;
  accountLocked: boolean;
  lastCheck: number;
}

export const SecurityMonitor: React.FC<SecurityMonitorProps> = ({
  onSecurityIssue,
  showDetails = false,
  autoCheck = true,
  checkInterval = 60000 // 1分鐘
}) => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    deviceBinding: true,
    appIntegrity: true,
    tamperDetection: true,
    biometricSupported: false,
    accountLocked: false,
    lastCheck: 0
  });
  const [isChecking, setIsChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);

  useEffect(() => {
    // 初始安全檢查
    performSecurityCheck();

    // 設置定期檢查
    let interval: NodeJS.Timeout | undefined;
    if (autoCheck) {
      interval = setInterval(performSecurityCheck, checkInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoCheck, checkInterval]);

  const performSecurityCheck = async () => {
    if (isChecking) return;

    setIsChecking(true);
    setCheckProgress(0);

    try {
      // 檢查生物識別支援
      setCheckProgress(0.2);
      const biometricSupported = await securityService.isBiometricSupported();

      // 檢查帳戶鎖定狀態
      setCheckProgress(0.4);
      const accountLocked = await securityService.isAccountLocked();

      // 執行完整安全檢查
      setCheckProgress(0.6);
      const securityResults = await securityService.performSecurityCheck();

      setCheckProgress(1.0);

      const newStatus: SecurityStatus = {
        deviceBinding: securityResults.deviceBinding,
        appIntegrity: securityResults.appIntegrity,
        tamperDetection: securityResults.tamperDetection,
        biometricSupported,
        accountLocked,
        lastCheck: Date.now()
      };

      setSecurityStatus(newStatus);

      // 檢查是否有安全問題
      const issues = [];
      if (!newStatus.deviceBinding) issues.push('設備綁定驗證失敗');
      if (!newStatus.appIntegrity) issues.push('應用完整性檢查失敗');
      if (!newStatus.tamperDetection) issues.push('檢測到潛在的篡改行為');
      if (newStatus.accountLocked) issues.push('帳戶已被鎖定');

      if (issues.length > 0) {
        const issueMessage = issues.join(', ');
        onSecurityIssue?.(issueMessage);
        
        if (showDetails) {
          Alert.alert(
            '安全警告',
            `檢測到安全問題：${issueMessage}`,
            [
              { text: '確定', style: 'default' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Security check error:', error);
      onSecurityIssue?.('安全檢查失敗');
    } finally {
      setIsChecking(false);
      setCheckProgress(0);
    }
  };

  const getSecurityScore = (): number => {
    let score = 0;
    if (securityStatus.deviceBinding) score += 25;
    if (securityStatus.appIntegrity) score += 25;
    if (securityStatus.tamperDetection) score += 25;
    if (!securityStatus.accountLocked) score += 25;
    return score;
  };

  const getSecurityLevel = (): { level: string; color: string } => {
    const score = getSecurityScore();
    if (score >= 100) return { level: '高', color: '#4CAF50' };
    if (score >= 75) return { level: '中', color: '#FF9800' };
    return { level: '低', color: '#F44336' };
  };

  const formatLastCheck = (): string => {
    if (securityStatus.lastCheck === 0) return '未檢查';
    
    const now = Date.now();
    const diff = now - securityStatus.lastCheck;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '剛剛';
    if (minutes < 60) return `${minutes}分鐘前`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小時前`;
    
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const securityLevel = getSecurityLevel();

  if (!showDetails) {
    return (
      <View style={styles.compactContainer}>
        <Chip
          icon="shield-check"
          style={[styles.securityChip, { backgroundColor: securityLevel.color }]}
          textStyle={styles.chipText}
        >
          安全等級: {securityLevel.level}
        </Chip>
      </View>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Title
        title="安全監控"
        subtitle={`最後檢查: ${formatLastCheck()}`}
        left={(props) => <Card.Icon {...props} icon="shield-check" />}
      />
      
      <Card.Content>
        {/* 安全等級 */}
        <View style={styles.securityLevelContainer}>
          <Text style={styles.securityLevelLabel}>安全等級</Text>
          <View style={styles.securityLevelBadge}>
            <Text style={[styles.securityLevelText, { color: securityLevel.color }]}>
              {securityLevel.level} ({getSecurityScore()}%)
            </Text>
          </View>
        </View>

        {/* 檢查進度 */}
        {isChecking && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>正在檢查安全狀態...</Text>
            <ProgressBar progress={checkProgress} color="#2196F3" />
          </View>
        )}

        {/* 安全項目狀態 */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>設備綁定</Text>
            <Chip
              icon={securityStatus.deviceBinding ? 'check' : 'close'}
              style={[
                styles.statusChip,
                { backgroundColor: securityStatus.deviceBinding ? '#4CAF50' : '#F44336' }
              ]}
              textStyle={styles.statusChipText}
            >
              {securityStatus.deviceBinding ? '正常' : '異常'}
            </Chip>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>應用完整性</Text>
            <Chip
              icon={securityStatus.appIntegrity ? 'check' : 'close'}
              style={[
                styles.statusChip,
                { backgroundColor: securityStatus.appIntegrity ? '#4CAF50' : '#F44336' }
              ]}
              textStyle={styles.statusChipText}
            >
              {securityStatus.appIntegrity ? '正常' : '異常'}
            </Chip>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>篡改檢測</Text>
            <Chip
              icon={securityStatus.tamperDetection ? 'check' : 'close'}
              style={[
                styles.statusChip,
                { backgroundColor: securityStatus.tamperDetection ? '#4CAF50' : '#F44336' }
              ]}
              textStyle={styles.statusChipText}
            >
              {securityStatus.tamperDetection ? '正常' : '異常'}
            </Chip>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>生物識別</Text>
            <Chip
              icon={securityStatus.biometricSupported ? 'fingerprint' : 'fingerprint-off'}
              style={[
                styles.statusChip,
                { backgroundColor: securityStatus.biometricSupported ? '#4CAF50' : '#9E9E9E' }
              ]}
              textStyle={styles.statusChipText}
            >
              {securityStatus.biometricSupported ? '支援' : '不支援'}
            </Chip>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>帳戶狀態</Text>
            <Chip
              icon={securityStatus.accountLocked ? 'lock' : 'lock-open'}
              style={[
                styles.statusChip,
                { backgroundColor: securityStatus.accountLocked ? '#F44336' : '#4CAF50' }
              ]}
              textStyle={styles.statusChipText}
            >
              {securityStatus.accountLocked ? '已鎖定' : '正常'}
            </Chip>
          </View>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="outlined"
          onPress={performSecurityCheck}
          disabled={isChecking}
          icon="refresh"
        >
          重新檢查
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 4,
  },
  compactContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  securityChip: {
    paddingHorizontal: 8,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  securityLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  securityLevelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  securityLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  statusContainer: {
    marginTop: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusLabel: {
    fontSize: 14,
    flex: 1,
  },
  statusChip: {
    minWidth: 80,
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
});

export default SecurityMonitor;