import React from 'react';
import ReactDOM from 'react-dom/client';

// Order matters: our overrides must land after React Flow's sheet.
import 'reactflow/dist/style.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
