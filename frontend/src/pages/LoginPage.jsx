import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/auth";
import { apiError } from "../api/client";
import { useAuth } from "../store/auth";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const r = await authApi.login(data);
      login(r);
      toast.success(`Welcome, ${r.user.name}`);
      navigate(r.user.role === "admin" ? "/admin/dashboard" : "/equipment");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">LabLock</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to book lab equipment.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              {...register("email", { required: "Email required" })}
            />
            {errors.email && <p className="text-rose-600 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              {...register("password", { required: "Password required" })}
            />
            {errors.password && <p className="text-rose-600 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          New here? <Link to="/signup" className="text-brand-700 hover:underline">Create an account</Link>
        </p>
        <p className="text-xs text-slate-400 mt-6 text-center">
          Demo seed: admin@lablock.local / password123
        </p>
      </div>
    </div>
  );
}
