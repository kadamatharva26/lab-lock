import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { dashboardApi } from "../api/dashboard";
import { apiError } from "../api/client";
import { FullPageLoader } from "../components/Spinner";

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-brand-700 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .summary()
      .then((r) => setData(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageLoader />;
  if (!data) return null;

  const utilization = (data.utilization || []).map((u) => ({
    name: u.name.length > 18 ? u.name.slice(0, 18) + "…" : u.name,
    hours: Number(u.hoursLast30Days?.toFixed?.(1) || u.hoursLast30Days || 0),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total equipment" value={data.totalEquipment} />
        <StatCard label="Active today" value={data.activeToday} hint="In-use right now" />
        <StatCard label="Pending approvals" value={data.pending} />
        <StatCard label="Bookings this week" value={data.thisWeek} />
      </div>

      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4">
          Top utilization (last 30 days, hours booked)
        </h2>
        {utilization.length === 0 ? (
          <p className="text-sm text-slate-500">No bookings recorded yet.</p>
        ) : (
          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer>
              <BarChart
                data={utilization}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 80, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                  formatter={(v) => [`${v} hrs`, "Booked"]}
                />
                <Bar dataKey="hours" fill="#0369a1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
