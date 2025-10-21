import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import { config, logEnvironmentInfo } from './config/environment';
import './index.css';

// 在開發環境中顯示環境資訊
if (config.ENABLE_DEBUG_MODE) {
  logEnvironmentInfo();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);