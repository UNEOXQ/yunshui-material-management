/**
 * Keep Alive Service - 防止 Render 免費版自動休眠
 * 每 5 分鐘自動 ping 自己的健康檢查端點
 */

export class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly pingInterval = 5 * 60 * 1000; // 5 分鐘
  private readonly maxRetries = 3;
  private isEnabled = false;
  private baseUrl: string;

  constructor() {
    // 根據環境設置基礎 URL
    if (process.env.NODE_ENV === 'production') {
      // 在 Render 環境中，使用服務的外部 URL
      this.baseUrl = process.env.RENDER_EXTERNAL_URL || 
                     `https://yunshui-backend.onrender.com`;
    } else {
      this.baseUrl = `http://localhost:${process.env.PORT || 3004}`;
    }
  }

  /**
   * 啟動 keep-alive 服務
   */
  start(): void {
    if (this.intervalId) {
      console.log('⚠️  Keep-alive service is already running');
      return;
    }

    // 只在生產環境（Render）啟用
    if (process.env.NODE_ENV !== 'production') {
      console.log('💡 Keep-alive service disabled in development mode');
      return;
    }

    this.isEnabled = true;
    console.log(`🔄 Starting keep-alive service...`);
    console.log(`📍 Target URL: ${this.baseUrl}/health`);
    console.log(`⏰ Ping interval: ${this.pingInterval / 1000 / 60} minutes`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔧 Port: ${process.env.PORT}`);

    // 立即執行一次 ping
    this.ping();

    // 設置定時器
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);

    console.log('✅ Keep-alive service started successfully');
  }

  /**
   * 停止 keep-alive 服務
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isEnabled = false;
      console.log('🛑 Keep-alive service stopped');
    }
  }

  /**
   * 執行 ping 操作
   */
  private async ping(): Promise<void> {
    if (!this.isEnabled) return;

    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        // 創建 AbortController 來處理超時
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超時

        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          headers: {
            'User-Agent': 'KeepAlive-Service/1.0',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const responseTime = Date.now() - startTime;
          const data = await response.json();
          
          console.log(`🏓 Keep-alive ping successful (${responseTime}ms)`);
          console.log(`📊 Server status: ${data.status}, uptime: ${Math.floor(data.uptime)}s`);
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        attempt++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt < this.maxRetries) {
          console.log(`⚠️  Keep-alive ping failed (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`);
          console.log(`🔄 Retrying in 30 seconds...`);
          await this.sleep(30000); // 等待 30 秒後重試
        } else {
          console.error(`❌ Keep-alive ping failed after ${this.maxRetries} attempts: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * 獲取服務狀態
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    baseUrl: string;
    pingInterval: number;
  } {
    return {
      enabled: this.isEnabled,
      running: this.intervalId !== null,
      baseUrl: this.baseUrl,
      pingInterval: this.pingInterval
    };
  }

  /**
   * 睡眠函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 創建單例實例
export const keepAliveService = new KeepAliveService();