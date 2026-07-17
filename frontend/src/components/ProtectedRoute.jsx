import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * If the user is NOT authenticated, they are redirected to /auth.
 * The `replace` flag prevents the login page from being pushed onto the
 * history stack, so the back button doesn't loop back to a blocked route.
 *
 * Usage in router.jsx:
 *   { element: <ProtectedRoute />, children: [ ...protected routes ] }
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Renders the matched child route
  return <Outlet />;
}
