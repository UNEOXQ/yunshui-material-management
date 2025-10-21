import React, { useState } from 'react';
import { Order } from '../../types';
import './OrderManagement.css';

interface OrderStatusColumnsProps {
    order: Order;
    currentUser: {
        role: string;
    };
    onStatusUpdate?: () => void;
}

const OrderStatusColumns: React.FC<OrderStatusColumnsProps> = ({
    order,
    currentUser,
    onStatusUpdate
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 簡單的狀態管理
    const [orderStatus, setOrderStatus] = useState('');
    const [pickupStatus, setPickupStatus] = useState('');
    const [deliveryStatus, setDeliveryStatus] = useState('');
    const [checkStatus, setCheckStatus] = useState('');

    // 到案狀態的詳細資訊
    const [deliveryDetails, setDeliveryDetails] = useState({
        time: '',
        address: '',
        po: '',
        deliveredBy: ''
    });

    const isWarehouseUser = currentUser.role === 'WAREHOUSE';

    const handleSave = async () => {
        if (!isWarehouseUser) return;

        setLoading(true);
        try {
            console.log('保存狀態:', {
                orderStatus,
                pickupStatus,
                deliveryStatus,
                checkStatus,
                deliveryDetails
            });
            onStatusUpdate?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="order-status-columns">
            {/* 測試標題 */}
            <div style={{
                backgroundColor: 'lime',
                color: 'black',
                padding: '15px',
                margin: '10px 0',
                border: '3px solid purple',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
            }}>
                🟢 OrderStatusColumns_WORKING 已加載！訂單ID: {order.id} | 用戶角色: {currentUser.role}
            </div>

            {error && (
                <div style={{
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '10px',
                    margin: '10px 0',
                    borderRadius: '5px'
                }}>
                    錯誤: {error}
                    <button onClick={() => setError(null)} style={{ marginLeft: '10px' }}>×</button>
                </div>
            )}

            {/* 狀態管理界面 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                margin: '10px 0'
            }}>
                {/* 叫貨狀態 */}
                <div style={{
                    border: '2px solid #007bff',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '10px',
                        margin: '-15px -15px 15px -15px',
                        borderRadius: '6px 6px 0 0',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}>
                        📞 叫貨狀態
                    </div>
                    <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        disabled={!isWarehouseUser || loading}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    >
                        <option value="">　</option>
                        <option value="Ordered">Ordered</option>
                    </select>
                    {orderStatus === 'Ordered' && (
                        <select
                            style={{ width: '100%', padding: '8px' }}
                            disabled={!isWarehouseUser || loading}
                        >
                            <option value="">　</option>
                            <option value="Processing">Processing</option>
                            <option value="waiting for pick">waiting for pick</option>
                            <option value="pending">pending</option>
                        </select>
                    )}
                </div>

                {/* 取貨狀態 */}
                <div style={{
                    border: '2px solid #ffc107',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        backgroundColor: '#ffc107',
                        color: 'black',
                        padding: '10px',
                        margin: '-15px -15px 15px -15px',
                        borderRadius: '6px 6px 0 0',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}>
                        📦 取貨狀態
                    </div>
                    <select
                        value={pickupStatus}
                        onChange={(e) => setPickupStatus(e.target.value)}
                        disabled={!isWarehouseUser || loading}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="">　</option>
                        <option value="Picked">Picked</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>

                {/* 到案狀態 */}
                <div style={{
                    border: '2px solid #28a745',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '10px',
                        margin: '-15px -15px 15px -15px',
                        borderRadius: '6px 6px 0 0',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}>
                        🚚 到案狀態
                    </div>
                    <select
                        value={deliveryStatus}
                        onChange={(e) => setDeliveryStatus(e.target.value)}
                        disabled={!isWarehouseUser || loading}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    >
                        <option value="">　</option>
                        <option value="Delivered">Delivered</option>
                    </select>

                    {/* 當選擇 Delivered 時顯示詳細資訊輸入 */}
                    {deliveryStatus === 'Delivered' && isWarehouseUser && (
                        <div style={{
                            border: '2px solid #28a745',
                            padding: '15px',
                            backgroundColor: '#f8fff9',
                            borderRadius: '8px',
                            marginTop: '10px'
                        }}>
                            <div style={{
                                color: '#28a745',
                                fontWeight: 'bold',
                                marginBottom: '15px',
                                textAlign: 'center'
                            }}>
                                📝 填寫到案詳細資訊
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                                    🕐 Time:
                                </label>
                                <input
                                    type="datetime-local"
                                    value={deliveryDetails.time}
                                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, time: e.target.value }))}
                                    disabled={loading}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                                    📍 Address:
                                </label>
                                <input
                                    type="text"
                                    value={deliveryDetails.address}
                                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, address: e.target.value }))}
                                    disabled={loading}
                                    placeholder="請輸入送貨地址"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                                    📋 P.O:
                                </label>
                                <input
                                    type="text"
                                    value={deliveryDetails.po}
                                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, po: e.target.value }))}
                                    disabled={loading}
                                    placeholder="請輸入 P.O 編號"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                                    🚚 Delivered By:
                                </label>
                                <input
                                    type="text"
                                    value={deliveryDetails.deliveredBy}
                                    onChange={(e) => setDeliveryDetails(prev => ({ ...prev, deliveredBy: e.target.value }))}
                                    disabled={loading}
                                    placeholder="請輸入送貨人員姓名"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 點收狀態 */}
                <div style={{
                    border: '2px solid #6f42c1',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: 'white'
                }}>
                    <div style={{
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        padding: '10px',
                        margin: '-15px -15px 15px -15px',
                        borderRadius: '6px 6px 0 0',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}>
                        ✅ 點收狀態
                    </div>
                    <select
                        value={checkStatus}
                        onChange={(e) => setCheckStatus(e.target.value)}
                        disabled={!isWarehouseUser || loading}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="">　</option>
                        <option value="Check and sign(C.B/PM)">Check and sign(C.B/PM)</option>
                        <option value="(C.B)">(C.B)</option>
                        <option value="WH)">WH)</option>
                    </select>
                </div>
            </div>

            {/* 保存按鈕 */}
            {isWarehouseUser && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? '儲存中...' : '儲存變更'}
                    </button>
                </div>
            )}

            {!isWarehouseUser && (
                <div style={{
                    textAlign: 'center',
                    color: '#666',
                    fontStyle: 'italic',
                    margin: '20px 0'
                }}>
                    只有倉庫管理員可以更新狀態
                </div>
            )}
        </div>
    );
};

export default OrderStatusColumns;