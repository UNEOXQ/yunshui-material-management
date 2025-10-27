-- UP
-- 修改材料表的價格字段，支援4位小數
ALTER TABLE materials 
ALTER COLUMN price TYPE DECIMAL(12,4);

-- 更新檢查約束以支援更高精度
ALTER TABLE materials 
DROP CONSTRAINT IF EXISTS materials_price_check;

ALTER TABLE materials 
ADD CONSTRAINT materials_price_check CHECK (price >= 0);

-- DOWN
-- 回退到原來的2位小數（注意：這可能會導致數據丟失）
ALTER TABLE materials 
ALTER COLUMN price TYPE DECIMAL(10,2);