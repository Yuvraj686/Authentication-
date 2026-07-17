import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PublicRoute — wraps routes that should only be visible when logged OUT.
 *
 * If the user IS already authenticated, they are redirected to /chat
 * so they can't navigate back to the login page after signing in.
 *
 * Usage in router.jsx:
 *   { element: <PublicRoute />, children: [ /auth route ] }
 */
export default function PublicRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
