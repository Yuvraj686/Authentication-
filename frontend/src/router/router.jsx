import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import NotFoundPage from "../components/NotFoundPage";

const AuthPage = lazy(() => import("../AuthPage"));
const GroupChatPage = lazy(() => import("../GroupChatPage"));

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

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/auth" replace />,
  },

  {
    element: <PublicRoute />,
    children: [
      {
        path: "/auth",
        element: withSuspense(AuthPage),
      },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/chat",
        element: withSuspense(GroupChatPage),
      },
    ],
  },

  {
    path: "*",
    element: withSuspense(NotFoundPage),
  },
]);

export default router;
