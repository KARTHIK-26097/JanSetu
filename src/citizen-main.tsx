import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { CitizenApp } from './components/citizen/CitizenApp';

createRoot(document.getElementById('root')!).render(<StrictMode><CitizenApp /></StrictMode>);
