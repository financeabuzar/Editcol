import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user || user === false) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
