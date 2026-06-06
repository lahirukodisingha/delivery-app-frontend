import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ========================================================
// Development කාලයේදී PWA Cache එක අක්‍රිය කිරීම සඳහා 
// (ඇප් එකේ වැඩ සම්පූර්ණයෙන්ම අවසන් වූ පසු මෙය මකා දැමිය හැක)
// ========================================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister(); // Service worker අක්‍රිය කිරීම
    }
  });
}

if ('caches' in window) {
  caches.keys().then((names) => {
    for (let name of names) {
      caches.delete(name); // පරණ Cache සියල්ල මකා දැමීම
    }
  });
}
// ========================================================

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
