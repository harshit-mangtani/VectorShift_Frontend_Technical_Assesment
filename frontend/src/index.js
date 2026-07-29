import React from 'react';
import ReactDOM from 'react-dom/client';

// React Flow's stylesheet first, ours second. Webpack emits CSS in first-require order,
// and most of our canvas rules target the same selectors at the same specificity — so
// whichever sheet lands last wins the tie. Importing it inside ui.js put it *after*
// index.css, which silently reverted the handles, the zoom bar and the edge colour to
// React Flow's defaults. Order is the whole mechanism; don't move these.
import 'reactflow/dist/style.css';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
