import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, selectIsAdmin } from "../store/auth";
import clsx from "clsx";

const navLinkClass = ({ isActive }) =>
  clsx(
    "px-3 py-2 rounded-md text-sm font-medium",
    isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100"
  );

export default function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = useAuth(selectIsAdmin);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 sm:gap-8">
              <span className="text-lg font-bold text-brand-700">LabLock</span>
              <nav className="flex gap-1">
                <NavLink to="/equipment" className={navLinkClass}>Equipment</NavLink>
                <NavLink to="/my-bookings" className={navLinkClass}>My Bookings</NavLink>
                {isAdmin && (
                  <>
                    <NavLink to="/admin/dashboard" className={navLinkClass}>Dashboard</NavLink>
                    <NavLink to="/admin/bookings" className={navLinkClass}>Approvals</NavLink>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-slate-600">
                {user?.name} <span className="text-slate-400">·</span> <span className="capitalize">{user?.role}</span>
              </span>
              <button onClick={handleLogout} className="btn-secondary">Sign out</button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500">
          © 2026 LabLock · SE ZG503 Full Stack Application Development
        </div>
      </footer>
    </div>
  );
}
