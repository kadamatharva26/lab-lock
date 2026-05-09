import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { bookingsApi } from "../api/bookings";
import { apiError } from "../api/client";
import { FullPageLoader } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";
import { EmptyState } from "../components/EmptyState";

const TABS = [
  { key: "requested", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "in_use", label: "In use" },
  { key: "returned", label: "Returned" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

export default function AdminBookingsPage() {
  const [tab, setTab] = useState("requested");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    setLoading(true);
    bookingsApi
      .list({ status: tab })
      .then((r) => setItems(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [tab]);

  const transition = async (id, body, successMsg) => {
    setBusy(true);
    try {
      await bookingsApi.transition(id, body);
      toast.success(successMsg);
      setRejectFor(null);
      setRejectReason("");
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const approve = (id) =>
    transition(id, { status: "approved", note: "Approved" }, "Booking approved");

  const markInUse = (id) =>
    transition(id, { status: "in_use", note: "Equipment checked out" }, "Marked in use");

  const markReturned = (id) =>
    transition(id, { status: "returned", note: "Equipment returned" }, "Marked returned");

  const submitReject = () => {
    if (rejectReason.trim().length < 3) {
      toast.error("Reason must be at least 3 characters");
      return;
    }
    transition(
      rejectFor,
      { status: "rejected", rejectReason: rejectReason.trim() },
      "Booking rejected",
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage bookings</h1>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "btn-primary"
                : "btn-secondary"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <FullPageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${tab} bookings`}
          description="Try switching tabs."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.equipment?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.requester?.name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.supervisor?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(b.startTime).toLocaleString()} —{" "}
                    {new Date(b.endTime).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    {b.status === "requested" && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => approve(b.id)}
                          className="text-emerald-700 hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => {
                            setRejectFor(b.id);
                            setRejectReason("");
                          }}
                          className="text-rose-600 hover:underline"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === "approved" && (
                      <button
                        disabled={busy}
                        onClick={() => markInUse(b.id)}
                        className="text-brand-700 hover:underline"
                      >
                        Mark in-use
                      </button>
                    )}
                    {b.status === "in_use" && (
                      <button
                        disabled={busy}
                        onClick={() => markReturned(b.id)}
                        className="text-slate-700 hover:underline"
                      >
                        Mark returned
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Reject booking</h2>
            <p className="text-sm text-slate-500 mb-3">
              Tell the requester why. They'll see this reason on their bookings page.
            </p>
            <textarea
              rows={3}
              className="input"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Lab is closed for maintenance that day"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn-secondary"
                onClick={() => {
                  setRejectFor(null);
                  setRejectReason("");
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="btn-primary bg-rose-600 hover:bg-rose-700"
                onClick={submitReject}
                disabled={busy}
              >
                {busy ? "Rejecting…" : "Reject booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
