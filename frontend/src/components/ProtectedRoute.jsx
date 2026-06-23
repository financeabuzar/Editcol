import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  if (!ready) return (
    <div className="min-h-[60vh] flex items-center justify-center text-gray-500">Loading…</div>
  );
  if (!user || user === false) return <Navigate to="/login" replace />;
  if (role && user.role !== role && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}
