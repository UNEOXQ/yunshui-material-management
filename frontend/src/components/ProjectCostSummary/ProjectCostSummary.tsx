import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../../types';
import './ProjectCostSummary.css';

interface ProjectCostSummaryProps {
  projectId: string | null;
  projectName: string | null;
  orders: Order[];
  onClose: () => void;
}

interface MaterialSummary {
  materialId: string;
  materialName: string;
  totalQuantity: number;
  unitPrice: number;
  totalAmount: number;
  supplier?: string;
  orderCount: number;
}

export const ProjectCostSummary: React.FC<ProjectCostSummaryProps> = ({
  projectId,
  projectName,
  orders,
  onClose
}) => {
  const [materialSummaries, setMaterialSummaries] = useState<MaterialSummary[]>([]);
  const [totalProjectCost, setTotalProjectCost] = useState(0);

  useEffect(() => {
    if (!projectId || !orders.length) {
      setMaterialSummaries([]);
      setTotalProjectCost(0);
      return;
    }

    // 過濾出屬於該專案的訂單
    const projectOrders = orders.filter(order => 
      (order as any).projectId === projectId
    );

    // 統計材料
    const materialMap = new Map<string, MaterialSummary>();
    let totalCost = 0;

    projectOrders.forEach(order => {
      order.items.forEach((item: OrderItem) => {
        const key = item.materialId || item.materialName || 'unknown';
        const itemTotal = item.quantity * item.unitPrice;
        totalCost += itemTotal;

        if (materialMap.has(key)) {
          const existing = materialMap.get(key)!;
          existing.totalQuantity += item.quantity;
          existing.totalAmount += itemTotal;
          existing.orderCount += 1;
        } else {
          materialMap.set(key, {
            materialId: item.materialId || '',
            materialName: item.materialName || item.material?.name || '未知材料',
            totalQuantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: itemTotal,
            supplier: item.supplier || item.material?.supplier,
            orderCount: 1
          });
        }
      });
    });

    setMaterialSummaries(Array.from(materialMap.values()));
    setTotalProjectCost(totalCost);
  }, [projectId, orders]);

  const formatPrice = (price: number): string => {
    const formattedNumber = price.toFixed(4).replace(/\.?0+$/, '');
    const finalNumber = formattedNumber.includes('.') ? formattedNumber : `${formattedNumber}.00`;
    return `CAD ${finalNumber}`;
  };

  if (!projectId || !projectName) {
    return null;
  }

  return (
    <div className="project-cost-summary">
      <div className="summary-header">
        <h3>專案成本總結</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="project-info">
        <div className="project-name">📁 {projectName}</div>
        <div className="project-stats">
          <span>{materialSummaries.length} 種材料</span>
          <span className="total-cost">{formatPrice(totalProjectCost)}</span>
        </div>
      </div>

      <div className="materials-list">
        <div className="list-header">
          <span>材料清單</span>
        </div>
        
        {materialSummaries.length === 0 ? (
          <div className="empty-materials">
            <p>此專案尚無材料訂單</p>
          </div>
        ) : (
          <div className="materials-items">
            {materialSummaries.map((material, index) => (
              <div key={index} className="material-item">
                <div className="material-info">
                  <div className="material-name">{material.materialName}</div>
                  {material.supplier && (
                    <div className="material-supplier">🏢 {material.supplier}</div>
                  )}
                </div>
                <div className="material-stats">
                  <div className="quantity">x{material.totalQuantity}</div>
                  <div className="amount">{formatPrice(material.totalAmount)}</div>
                </div>
                <div className="order-count">{material.orderCount} 筆訂單</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="summary-footer">
        <div className="total-row">
          <span>專案總成本</span>
          <span className="total-amount">{formatPrice(totalProjectCost)}</span>
        </div>
      </div>
    </div>
  );
};