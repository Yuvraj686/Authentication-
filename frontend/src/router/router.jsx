import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import NotFoundPage from "../components/NotFoundPage";

/**
 * Lazy-loaded page components.
 *
 * Both AuthPage and GroupChatPage are large files (~10 KB and ~20 KB).
 * Lazy loading means each is only downloaded when first navigated to,
 * rather than bundled into the initial JS chunk.
 */
const AuthPage = lazy(() => import("../AuthPage"));
const GroupChatPage = lazy(() => import("../GroupChatPage"));

/**
 * A minimal full-screen spinner shown while lazy chunks load.
 * Keeps the dark AetherChat theme during code-splitting transitions.
 */
function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1117",
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(99,102,241,0.25)",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.75s linear infinite",
          display: "inline-block",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * Wraps a lazy component in Suspense with the shared PageLoader fallback.
 */
function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/**
 * Centralized route configuration using the modern createBrowserRouter API.
 *
 * Route tree:
 *
 *  /                → redirect to /auth
 *  /auth            → AuthPage        (PublicRoute guard — bounces to /chat if logged in)
 *  /chat            → GroupChatPage   (ProtectedRoute guard — bounces to /auth if logged out)
 *  *                → NotFoundPage    (catch-all 404)
 */
const router = createBrowserRouter([
  // Root redirect
  {
    path: "/",
    element: <Navigate to="/auth" replace />,
  },

  // ── Public routes (only accessible when NOT authenticated) ──────────────
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/auth",
        element: withSuspense(AuthPage),
      },
    ],
  },

  // ── Protected routes (only accessible when authenticated) ───────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/chat",
        element: withSuspense(GroupChatPage),
      },
    ],
  },

  // ── Catch-all 404 ────────────────────────────────────────────────────────
  {
    path: "*",
    element: withSuspense(NotFoundPage),
  },
]);

export default router;
