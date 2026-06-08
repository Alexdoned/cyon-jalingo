import { Navigate, Outlet, useLocation } from 'react-router-dom';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
