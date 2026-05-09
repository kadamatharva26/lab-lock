import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/auth";
import { apiError } from "../api/client";
import { useAuth } from "../store/auth";

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: "student" },
  });
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const r = await authApi.signup(data);
      login(r);
      toast.success(`Welcome, ${r.user.name}`);
      navigate("/equipment");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md card p-8">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">Create account</h1>
        <p className="text-sm text-slate-500 mb-6">Join as a student or supervisor.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label">Name</label>
            <input className="input" {...register("name", { required: "Name required", minLength: { value: 2, message: "Min 2 chars" } })} />
            {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...register("email", { required: "Email required" })} />
            {errors.email && <p className="text-rose-600 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" {...register("password", { required: "Password required", minLength: { value: 8, message: "Min 8 chars" } })} />
            {errors.password && <p className="text-rose-600 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...register("role")}>
              <option value="student">Student</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Admin accounts are created via the seed script only.</p>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-brand-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
