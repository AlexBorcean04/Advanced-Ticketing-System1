import { Navigate } from 'react-router-dom';
import { isAuthed } from '../lib/auth.js';

const RequireAdmin = ({ children }) => {
  if (!isAuthed()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default RequireAdmin;
