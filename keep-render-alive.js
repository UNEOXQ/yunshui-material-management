/**
 * 外部 Keep-Alive 腳本
 * 用於防止 Render 免費版自動休眠
 * 
 * 使用方法:
 * node keep-render-alive.js [URL]
 * 
 * 例如:
 * node keep-render-alive.js https://your-app.onrender.com
 */

const https = require('https');
const http = require('http');

class RenderKeepAlive {
  constructor(targetUrl, options = {}) {
    this.targetUrl = targetUrl || process.env.RENDER_URL;
    this.pingInterval = options.pingInterval || 5 * 60 * 1000; // 5 分鐘
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 10000; // 10 秒
    this.intervalId = null;
    this.isRunning = false;
    
    if (!this.targetUrl) {
      throw new Error('請提供目標 URL 或設置 RENDER_URL 環境變數');
    }
    
    // 確保 URL 包含協議
    if (!this.targetUrl.startsWith('http')) {
      this.targetUrl = 'https://' + this.targetUrl;
    }
    
    // 添加 /health 端點
    if (!this.targetUrl.includes('/health')) {
      this.targetUrl = this.targetUrl.replace(/\/$/, '') + '/health';
    }
  }

  /**
   * 開始 ping 服務
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Keep-alive service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Render Keep-Alive Service');
    console.log(`📍 Target URL: ${this.targetUrl}`);
    console.log(`⏰ Ping interval: ${this.pingInterval / 1000 / 60} minutes`);
    console.log(`🔄 Max retries: ${this.maxRetries}`);
    console.log('');

    // 立即執行一次 ping
    this.ping();

    // 設置定時器
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);

    console.log('✅ Keep-alive service started successfully');
    console.log('Press Ctrl+C to stop');
  }

  /**
   * 停止 ping 服務
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('🛑 Keep-alive service stopped');
    }
  }

  /**
   * 執行 ping 操作
   */
  async ping() {
    const startTime = Date.now();
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        const result = await this.makeRequest();
        const responseTime = Date.now() - startTime;
        
        console.log(`🏓 Ping successful (${responseTime}ms) - ${new Date().toLocaleString()}`);
        
        if (result.data) {
          console.log(`📊 Server status: ${result.data.status}, uptime: ${Math.floor(result.data.uptime || 0)}s`);
        }
        
        return;
      } catch (error) {
        attempt++;
        const errorMessage = error.message || 'Unknown error';
        
        if (attempt < this.maxRetries) {
          console.log(`⚠️  Ping failed (attempt ${attempt}/${this.maxRetries}): ${errorMessage}`);
          console.log(`🔄 Retrying in 30 seconds...`);
          await this.sleep(30000);
        } else {
          console.error(`❌ Ping failed after ${this.maxRetries} attempts: ${errorMessage}`);
          console.error(`🕐 ${new Date().toLocaleString()}`);
        }
      }
    }
  }

  /**
   * 發送 HTTP 請求
   */
  makeRequest() {
    return new Promise((resolve, reject) => {
      const url = new URL(this.targetUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'RenderKeepAlive/1.0',
          'Accept': 'application/json'
        },
        timeout: this.timeout
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: jsonData
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: null
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(this.timeout);
      req.end();
    });
  }

  /**
   * 睡眠函數
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主程序
if (require.main === module) {
  const targetUrl = process.argv[2] || process.env.RENDER_URL;
  
  if (!targetUrl) {
    console.error('❌ 錯誤: 請提供目標 URL');
    console.log('');
    console.log('使用方法:');
    console.log('  node keep-render-alive.js <URL>');
    console.log('');
    console.log('例如:');
    console.log('  node keep-render-alive.js https://your-app.onrender.com');
    console.log('');
    console.log('或設置環境變數:');
    console.log('  RENDER_URL=https://your-app.onrender.com node keep-render-alive.js');
    process.exit(1);
  }

  const keepAlive = new RenderKeepAlive(targetUrl);

  // 處理程序退出
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping keep-alive service...');
    keepAlive.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, stopping keep-alive service...');
    keepAlive.stop();
    process.exit(0);
  });

  // 啟動服務
  try {
    keepAlive.start();
  } catch (error) {
    console.error('❌ Failed to start keep-alive service:', error.message);
    process.exit(1);
  }
}

module.exports = RenderKeepAlive;