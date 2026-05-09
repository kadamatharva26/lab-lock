import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { bookingsApi } from "../api/bookings";
import { apiError } from "../api/client";
import { FullPageLoader } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";

export default function MyBookingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const refresh = () => {
    setLoading(true);
    bookingsApi
      .list({ mine: 1 })
      .then((r) => setItems(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, []);

  const cancel = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await bookingsApi.transition(id, { status: "cancelled", note: "Cancelled by requester" });
      toast.success("Booking cancelled");
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (loading) return <FullPageLoader />;

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Bookings</h1>
      <div className="flex flex-wrap gap-2">
        {["all", "requested", "approved", "in_use", "returned", "rejected", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={
              filter === s
                ? "btn-primary"
                : "btn-secondary"
            }
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No bookings here yet"
          description="Browse equipment and request your first slot."
          action={<Link to="/equipment" className="btn-primary">Browse equipment</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.equipment?.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(b.startTime).toLocaleString()} – {new Date(b.endTime).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {b.status === "requested" && (
                      <button onClick={() => cancel(b.id)} className="text-rose-600 hover:underline">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
