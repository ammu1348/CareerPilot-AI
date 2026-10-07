import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

export const AdminPortal = lazy(() => import("./AdminPortal.jsx"));
const path = window.location.pathname;
const isAdminRoute = path === "/admin" || path.startsWith("/admin/");
const rootView = isAdminRoute
  ? (
    <Suspense fallback={<div className="route-loading" role="status">Opening secure workspace…</div>}>
      <AdminPortal />
    </Suspense>
  )
  : <App />;

createRoot(document.getElementById("root")).render(
  <StrictMode>{rootView}</StrictMode>,
);
