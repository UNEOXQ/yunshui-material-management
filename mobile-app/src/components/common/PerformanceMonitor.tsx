import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, ProgressBar, Chip, Divider } from 'react-native-paper';
import { performanceService, PerformanceMetrics, OptimizationSuggestion } from '../../services/performanceService';
import { bundleOptimizer } from '../../utils/bundleOptimization';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onOptimizationSuggestion?: (suggestions: OptimizationSuggestion[]) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000,
  onOptimizationSuggestion
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const [averageMetrics, setAverageMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [bundleStats, setBundleStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // 初始載入
    refreshMetrics();

    // 自動刷新
    let interval: NodeJS.Timeout | undefined;
    if (autoRefresh) {
      interval = setInterval(refreshMetrics, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    try {
      // 獲取當前性能指標
      const current = performanceService.getCurrentMetrics();
      setCurrentMetrics(current);

      // 獲取平均性能指標
      const average = performanceService.getAverageMetrics(10);
      setAverageMetrics(average);

      // 分析性能並獲取建議
      if (current) {
        const newSuggestions = performanceService.analyzePerformance(current);
        setSuggestions(newSuggestions);
        onOptimizationSuggestion?.(newSuggestions);
      }

      // 獲取包統計信息
      const stats = bundleOptimizer.getRuntimeStats();
      setBundleStats(stats);
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceScore = (): number => {
    if (!currentMetrics) return 0;
    
    let score = 100;
    
    // 渲染時間評分
    if (currentMetrics.renderTime > 100) score -= 20;
    else if (currentMetrics.renderTime > 50) score -= 10;
    
    // 記憶體使用評分
    if (currentMetrics.memoryUsage > 100 * 1024 * 1024) score -= 25;
    else if (currentMetrics.memoryUsage > 50 * 1024 * 1024) score -= 15;
    
    // 網路延遲評分
    if (currentMetrics.networkLatency > 2000) score -= 20;
    else if (currentMetrics.networkLatency > 1000) score -= 10;
    
    // 幀率評分
    if (currentMetrics.frameRate < 30) score -= 25;
    else if (currentMetrics.frameRate < 45) score -= 15;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const performanceScore = getPerformanceScore();
  const scoreColor = getScoreColor(performanceScore);

  if (!showDetails) {
    return (
      <View style={styles.compactContainer}>
        <Chip
          icon="speedometer"
          style={[styles.performanceChip, { backgroundColor: scoreColor }]}
          textStyle={styles.chipText}
        >
          性能: {performanceScore}分
        </Chip>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 性能總覽 */}
      <Card style={styles.card}>
        <Card.Title
          title="性能監控"
          subtitle={`最後更新: ${currentMetrics ? new Date(currentMetrics.timestamp).toLocaleTimeString() : '未知'}`}
          left={(props) => <Card.Icon {...props} icon="speedometer" />}
        />
        
        <Card.Content>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>性能評分</Text>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
              <Text style={styles.scoreText}>{performanceScore}分</Text>
            </View>
          </View>

          {isRefreshing && (
            <View style={styles.refreshContainer}>
              <Text style={styles.refreshLabel}>正在更新指標...</Text>
              <ProgressBar indeterminate color="#2196F3" />
            </View>
          )}
        </Card.Content>

        <Card.Actions>
          <Button
            mode="outlined"
            onPress={refreshMetrics}
            disabled={isRefreshing}
            icon="refresh"
          >
            刷新
          </Button>
        </Card.Actions>
      </Card>

      {/* 當前性能指標 */}
      {currentMetrics && (
        <Card style={styles.card}>
          <Card.Title title="當前指標" />
          <Card.Content>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>渲染時間</Text>
                <Text style={styles.metricValue}>{formatTime(currentMetrics.renderTime)}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>記憶體使用</Text>
                <Text style={styles.metricValue}>{formatBytes(currentMetrics.memoryUsage)}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>網路延遲</Text>
                <Text style={styles.metricValue}>
                  {currentMetrics.networkLatency > 0 ? formatTime(currentMetrics.networkLatency) : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>幀率</Text>
                <Text style={styles.metricValue}>{currentMetrics.frameRate.toFixed(1)} FPS</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 平均性能指標 */}
      {averageMetrics && (
        <Card style={styles.card}>
          <Card.Title title="平均指標 (最近10次)" />
          <Card.Content>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>平均渲染時間</Text>
                <Text style={styles.metricValue}>{formatTime(averageMetrics.renderTime)}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>平均記憶體</Text>
                <Text style={styles.metricValue}>{formatBytes(averageMetrics.memoryUsage)}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>平均延遲</Text>
                <Text style={styles.metricValue}>
                  {averageMetrics.networkLatency > 0 ? formatTime(averageMetrics.networkLatency) : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>平均幀率</Text>
                <Text style={styles.metricValue}>{averageMetrics.frameRate.toFixed(1)} FPS</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 包統計信息 */}
      {bundleStats && (
        <Card style={styles.card}>
          <Card.Title title="包統計" />
          <Card.Content>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>已載入模組</Text>
                <Text style={styles.metricValue}>{bundleStats.loadedModules}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>總大小</Text>
                <Text style={styles.metricValue}>{formatBytes(bundleStats.totalSize)}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>平均載入時間</Text>
                <Text style={styles.metricValue}>{formatTime(bundleStats.averageLoadTime)}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>快取命中率</Text>
                <Text style={styles.metricValue}>{(bundleStats.cacheHitRate * 100).toFixed(1)}%</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* 優化建議 */}
      {suggestions.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="優化建議" />
          <Card.Content>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <View style={styles.suggestionHeader}>
                  <Chip
                    icon="lightbulb-outline"
                    style={[
                      styles.severityChip,
                      { backgroundColor: getSeverityColor(suggestion.severity) }
                    ]}
                    textStyle={styles.severityChipText}
                  >
                    {suggestion.severity === 'high' ? '高' : 
                     suggestion.severity === 'medium' ? '中' : '低'}
                  </Chip>
                  <Text style={styles.suggestionType}>{suggestion.type}</Text>
                </View>
                
                <Text style={styles.suggestionMessage}>{suggestion.message}</Text>
                
                {suggestion.action && (
                  <Button
                    mode="outlined"
                    onPress={suggestion.action}
                    style={styles.suggestionAction}
                    compact
                  >
                    執行優化
                  </Button>
                )}
                
                {index < suggestions.length - 1 && <Divider style={styles.suggestionDivider} />}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  compactContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  performanceChip: {
    paddingHorizontal: 8,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  scoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshContainer: {
    marginBottom: 16,
  },
  refreshLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestionItem: {
    marginBottom: 16,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityChip: {
    marginRight: 8,
  },
  severityChipText: {
    color: 'white',
    fontSize: 12,
  },
  suggestionType: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  suggestionMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  suggestionAction: {
    alignSelf: 'flex-start',
  },
  suggestionDivider: {
    marginTop: 16,
  },
});

export default PerformanceMonitor;