import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { AccountsAuthProvider } from './context/AccountsAuthContext';
import AccountsUnlockModal from './components/accounts/AccountsUnlockModal';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccountsAuthProvider>
          <ConfirmProvider>
            <ErrorBoundary>
              <AppRoutes />
              <AccountsUnlockModal />
            </ErrorBoundary>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </ConfirmProvider>
        </AccountsAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
