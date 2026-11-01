import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { HandlerApp } from './components/handler/HandlerApp';

createRoot(document.getElementById('root')!).render(<StrictMode><HandlerApp /></StrictMode>);
