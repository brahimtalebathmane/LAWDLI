import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize localStorage with safe defaults to prevent reload loops
const initializeLocalStorage = () => {
  try {
    // Check if localStorage is available
    if (typeof Storage !== 'undefined') {
      // Initialize language if not set
      if (!localStorage.getItem('lawdli_language')) {
        localStorage.setItem('lawdli_language', 'ar');
      }
      
      // Validate existing language setting
      const currentLang = localStorage.getItem('lawdli_language');
      if (currentLang !== 'ar' && currentLang !== 'fr') {
        localStorage.setItem('lawdli_language', 'ar');
      }
    }
  } catch (error) {
    console.warn('localStorage not available:', error);
  }
};

// Initialize localStorage before app starts
initializeLocalStorage();

// Create root and render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
