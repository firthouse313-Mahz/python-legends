import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// Intentionally not wrapped in <StrictMode>: it double-invokes effects in
// dev mode, which would create two Babylon engines/WebGL contexts on the
// same canvas for this imperative game code.
createRoot(document.getElementById('root')!).render(<App />);
