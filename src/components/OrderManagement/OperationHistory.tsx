import React, { useState, useEffect } from 'react';
import { statusService } from '../../services/statusService';

interface OperationHistoryProps {
    order: any;
}

interface HistoryItem {
    id: string;
    type: 'ORDER_CREATED' | 'STATUS_UPDATED';
    description: string;
    user: {
        username: string;
        role: string;
    };
    timestamp: string;
    details?: any;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({ order }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (expanded) {
            loadHistory();
        }
    }, [expanded, order.id]);

    const loadHistory = async () => {
        if (!order.project) return;

        setLoading(true);
        try {
            // 獲取項目狀態歷史
            const projectStatusHistory = await statusService.getProjectStatusHistory(order.project.id);
            if (projectStatusHistory) {
                const historyItems: HistoryItem[] = [];

                // 添加訂單創建記錄
                historyItems.push({
                    id: `order-created-${order.id}`,
                    type: 'ORDER_CREATED',
                    description: '訂單已創建',
                    user: {
                        username: getUsernameFromId(order.userId),
                        role: getRoleFromUserId(order.userId)
                    },
                    timestamp: order.createdAt
                });

                // 添加狀態更新記錄
                projectStatusHistory.statusHistory.forEach((statusUpdate: any) => {
                    if (statusUpdate.statusValue) { // 只顯示有實際值的狀態更新
                        historyItems.push({
                            id: statusUpdate.id,
                            type: 'STATUS_UPDATED',
                            description: `${getStatusTypeDisplayName(statusUpdate.statusType)}狀態更新為: ${statusUpdate.statusValue}`,
                            user: statusUpdate.user,
                            timestamp: statusUpdate.createdAt,
                            details: statusUpdate.additionalData
                        });
                    }
                });

                // 按時間排序（最新的在前）
                historyItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setHistory(historyItems);
            }
        } catch (error) {
            console.error('Failed to load operation history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUsernameFromId = (userId: string): string => {
        // 從用戶 ID 推斷用戶名（簡化版本）
        if (userId.includes('pm')) return 'PM001';
        if (userId.includes('admin')) return 'Admin';
        if (userId.includes('warehouse')) return 'Warehouse001';
        if (userId.includes('am')) return 'AM001';
        return userId;
    };

    const getRoleFromUserId = (userId: string): string => {
        if (userId.includes('pm')) return 'PM';
        if (userId.includes('admin')) return 'ADMIN';
        if (userId.includes('warehouse')) return 'WAREHOUSE';
        if (userId.includes('am')) return 'AM';
        return 'USER';
    };

    const getStatusTypeDisplayName = (statusType: string): string => {
        const displayNames: Record<string, string> = {
            ORDER: '叫貨',
            PICKUP: '取貨',
            DELIVERY: '到案',
            CHECK: '點收',
        };
        return displayNames[statusType] || statusType;
    };

    const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getRoleColor = (role: string): string => {
        const colors: Record<string, string> = {
            PM: '#007bff',
            AM: '#28a745',
            WAREHOUSE: '#ffc107',
            ADMIN: '#dc3545'
        };
        return colors[role] || '#6c757d';
    };

    return (
        <div className="operation-history">
            <button
                className="history-toggle"
                onClick={() => setExpanded(!expanded)}
            >
                <span>操作記錄</span>
                <span className={`toggle-icon ${expanded ? 'expanded' : ''}`}>▼</span>
            </button>

            {expanded && (
                <div className="history-content">
                    {loading ? (
                        <div className="history-loading">載入中...</div>
                    ) : history.length > 0 ? (
                        <div className="history-list">
                            {history.map((item, index) => (
                                <div key={`${item.id}-${item.timestamp}-${index}`} className="history-item">
                                    <div className="history-header">
                                        <span className="history-description">{item.description}</span>
                                        <span 
                                            className="history-user"
                                            style={{ color: getRoleColor(item.user.role) }}
                                        >
                                            {item.user.username} ({item.user.role})
                                        </span>
                                    </div>
                                    <div className="history-timestamp">
                                        {formatTimestamp(item.timestamp)}
                                    </div>
                                    {item.details && (
                                        <div className="history-details">
                                            {item.description.includes('到案') && item.details.time ? (
                                                <div className="delivery-details-display">
                                                    {item.details.time && (
                                                        <div className="detail-row">
                                                            <strong>Time:</strong> {new Date(item.details.time).toLocaleString()}
                                                        </div>
                                                    )}
                                                    {item.details.address && (
                                                        <div className="detail-row">
                                                            <strong>Address:</strong> {item.details.address}
                                                        </div>
                                                    )}
                                                    {item.details.po && (
                                                        <div className="detail-row">
                                                            <strong>P.O:</strong> {item.details.po}
                                                        </div>
                                                    )}
                                                    {item.details.deliveredBy && (
                                                        <div className="detail-row">
                                                            <strong>Delivered By:</strong> {item.details.deliveredBy}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="raw-details">
                                                    {JSON.stringify(item.details, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="history-empty">暫無操作記錄</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OperationHistory;