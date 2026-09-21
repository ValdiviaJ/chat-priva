import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { DecoyPage } from './pages/DecoyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { SecurityProvider } from './utils/SecurityProvider';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SecurityProvider>
          <BrowserRouter>
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/chat/:roomId' element={<ChatPage />} />
              <Route path='/decoy' element={<DecoyPage />} />
              <Route path='*' element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </SecurityProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;

