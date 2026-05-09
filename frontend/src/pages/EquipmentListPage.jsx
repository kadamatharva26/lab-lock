import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { equipmentApi } from "../api/equipment";
import { apiError } from "../api/client";
import { FullPageLoader } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";

export default function EquipmentListPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const available = params.get("available") || "";
  const page = parseInt(params.get("page") || "1", 10);

  useEffect(() => {
    setLoading(true);
    equipmentApi
      .list({
        search: search || undefined,
        category: category || undefined,
        available: available || undefined,
        page,
        pageSize: 20,
      })
      .then((res) => setData(res))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, [search, category, available, page]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setParams(next);
  };

  if (loading) return <FullPageLoader />;
  if (error) return <div className="text-rose-600">{error}</div>;

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Equipment</h1>
      </div>
      <div className="card p-4 grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Name or category"
            defaultValue={search}
            onBlur={(e) => update("search", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && update("search", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <input
            className="input"
            placeholder="All"
            defaultValue={category}
            onBlur={(e) => update("category", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Available on</label>
          <input
            type="date"
            className="input"
            defaultValue={available}
            onChange={(e) => update("available", e.target.value)}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No equipment matches your filters"
          description="Try clearing the search or pick a different date."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Lab</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">{available ? `Status on ${available}` : "Status"}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{it.name}</td>
                  <td className="px-4 py-3 text-slate-600">{it.category}</td>
                  <td className="px-4 py-3 text-slate-600">{it.labRoom?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{it.quantity}</td>
                  <td className="px-4 py-3">
                    {available ? (
                      it.busyOnDate ? (
                        <span className="badge bg-amber-100 text-amber-800">Booked</span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-800">Available</span>
                      )
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">{it.condition}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/equipment/${it.id}`} className="text-brand-700 hover:underline text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => update("page", String(page - 1))}
          >
            Prev
          </button>
          <span className="px-3 py-2">
            Page {page} of {data.totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= data.totalPages}
            onClick={() => update("page", String(page + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
