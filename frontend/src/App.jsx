import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import EquipmentListPage from "./pages/EquipmentListPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminEquipmentPage from "./pages/AdminEquipmentPage";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/equipment" element={<EquipmentListPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute role="admin">
              <AdminBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/equipment"
          element={
            <ProtectedRoute role="admin">
              <AdminEquipmentPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/equipment" replace />} />
      <Route path="*" element={<Navigate to="/equipment" replace />} />
    </Routes>
  );
}
