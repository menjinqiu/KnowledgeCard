import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/global.css';
import './styles/layout.css';
import './styles/sidebar-compact.css';
import './styles/dashboard.css';
import './styles/library.css';
import './styles/directory.css';
import './styles/detail-editor.css';
import './styles/collections.css';
import './styles/print-center.css';
import './styles/data-management.css';
import './styles/style-lab.css';
import './styles/print.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
