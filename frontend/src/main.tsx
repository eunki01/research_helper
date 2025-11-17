// src/main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ------------------- 중요! -------------------
import Cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';

// Cola 레이아웃을 Cytoscape에 등록합니다.
// 이 코드는 앱이 시작될 때 딱 한 번만 실행됩니다.
Cytoscape.use(cola);
// ---------------------------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)