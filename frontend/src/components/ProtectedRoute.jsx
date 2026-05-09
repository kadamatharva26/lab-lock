import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export function ProtectedRoute({ children, role }) {
  const { user, token } = useAuth();
  const loc = useLocation();
  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  if (role && user.role !== role && user.role !== "admin") {
    // admin always allowed; others must match exactly
    return <Navigate to="/equipment" replace />;
  }
  return children;
}
