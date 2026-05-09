import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { equipmentApi } from "../api/equipment";
import { bookingsApi } from "../api/bookings";
import { apiError } from "../api/client";
import { FullPageLoader } from "../components/Spinner";
import { StatusBadge } from "../components/StatusBadge";

function combineDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export default function EquipmentDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const refresh = () => {
    setLoading(true);
    equipmentApi
      .get(id)
      .then((r) => setData(r.data))
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, [id]);

  const onSubmit = async (form) => {
    setConflicts(null);
    try {
      const payload = {
        equipmentId: id,
        startTime: combineDateTime(form.date, form.start),
        endTime: combineDateTime(form.date, form.end),
        purpose: form.purpose,
      };
      await bookingsApi.create(payload);
      toast.success("Booking submitted — pending approval");
      reset({ date: "", start: "", end: "", purpose: "" });
      refresh();
    } catch (e) {
      const detail = e?.response?.data?.error?.details;
      if (Array.isArray(detail)) {
        setConflicts(detail);
        toast.error("Conflict — see below");
      } else {
        toast.error(apiError(e));
      }
    }
  };

  if (loading) return <FullPageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Link to="/equipment" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
      <div className="card p-6">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-6 mt-4 text-sm">
          <div><span className="text-slate-500">Category:</span> {data.category}</div>
          <div><span className="text-slate-500">Condition:</span> {data.condition}</div>
          <div><span className="text-slate-500">Quantity:</span> {data.quantity}</div>
          <div><span className="text-slate-500">Lab:</span> {data.labRoom?.name}</div>
          <div className="col-span-2"><span className="text-slate-500">Supervisor:</span> {data.supervisor?.name || "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Upcoming bookings</h2>
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming bookings.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">When</th>
                  <th className="py-2">Status</th>
                  {data.upcoming[0]?.requester !== undefined && <th className="py-2">By</th>}
                </tr>
              </thead>
              <tbody>
                {data.upcoming.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="py-2">
                      {new Date(b.startTime).toLocaleString()} –{" "}
                      {new Date(b.endTime).toLocaleTimeString()}
                    </td>
                    <td className="py-2"><StatusBadge status={b.status} /></td>
                    {b.requester && <td className="py-2 text-slate-600">{b.requester.name}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Request a slot</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" {...register("date", { required: "Required" })} />
              {errors.date && <p className="text-rose-600 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <input type="time" className="input" {...register("start", { required: "Required" })} />
              </div>
              <div>
                <label className="label">End</label>
                <input type="time" className="input" {...register("end", { required: "Required" })} />
              </div>
            </div>
            <div>
              <label className="label">Purpose</label>
              <textarea rows={3} className="input" {...register("purpose", { required: "Required", minLength: 3 })} />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? "Submitting…" : "Request booking"}
            </button>
            {conflicts && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-800 space-y-1">
                <p className="font-medium">Cannot book this slot:</p>
                <ul className="list-disc list-inside">
                  {conflicts.map((c, i) => (
                    <li key={i}>{c.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
