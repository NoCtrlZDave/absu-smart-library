import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { BookProvider } from './context/BookContext.jsx';
import { StudentProvider } from './context/StudentContext.jsx';
import { AuditProvider } from './context/AuditContext.jsx';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <BookProvider>
            <StudentProvider>
              <AuditProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </AuditProvider>
            </StudentProvider>
          </BookProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
