import { RouterProvider } from "react-router-dom";
import router from "./router/router";

/**
 * App — thin shell that hands control to the centralized router.
 *
 * All auth state lives in AuthContext (provided by main.jsx).
 * All routing logic lives in router/router.jsx.
 * This component has no responsibilities beyond mounting the router.
 */
export default function App() {
  return <RouterProvider router={router} />;
}
