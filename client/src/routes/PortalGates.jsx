import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const PasswordGate = ({ children }) => {
  const { user } = useAuth();
  if (user?.mustChangePassword) {
    return <Navigate to="/force-password-change" replace />;
  }
  return children;
};

export const StaffGate = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'staff' && user?.verificationStatus !== 'verified') {
    return <Navigate to="/staff/pending" replace />;
  }
  return children;
};