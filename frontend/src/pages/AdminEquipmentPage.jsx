import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { equipmentApi } from "../api/equipment";
import { labRoomsApi } from "../api/labrooms";
import { apiError } from "../api/client";
import { FullPageLoader } from "../components/Spinner";

const CONDITIONS = ["new", "good", "fair", "needs_repair", "out_of_service"];

function EquipmentForm({ initial, labRooms, onSave, onCancel, busy }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initial || {
      name: "",
      category: "",
      labRoomId: labRooms[0]?.id || "",
      quantity: 1,
      condition: "good",
      notes: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="card p-6 space-y-3"
      noValidate
    >
      <h2 className="text-lg font-semibold">
        {initial ? "Edit equipment" : "Add equipment"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            {...register("name", { required: "Required", minLength: 2 })}
          />
          {errors.name && (
            <p className="text-rose-600 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="label">Category</label>
          <input
            className="input"
            {...register("category", { required: "Required" })}
          />
          {errors.category && (
            <p className="text-rose-600 text-xs mt-1">
              {errors.category.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Lab room</label>
          <select
            className="input"
            {...register("labRoomId", { required: "Required" })}
          >
            {labRooms.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input
            type="number"
            min={1}
            className="input"
            {...register("quantity", {
              required: true,
              valueAsNumber: true,
              min: { value: 1, message: "At least 1" },
            })}
          />
        </div>
        <div>
          <label className="label">Condition</label>
          <select className="input" {...register("condition")}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea rows={2} className="input" {...register("notes")} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function AdminEquipmentPage() {
  const [items, setItems] = useState([]);
  const [labRooms, setLabRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=hidden, {}=new, {id,...}=edit
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      equipmentApi.list({ pageSize: 100 }),
      labRoomsApi.list(),
    ])
      .then(([eqRes, lrRes]) => {
        setItems(eqRes.data || []);
        setLabRooms(lrRes.data || []);
      })
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  const save = async (form) => {
    setBusy(true);
    try {
      if (editing && editing.id) {
        await equipmentApi.update(editing.id, form);
        toast.success("Equipment updated");
      } else {
        await equipmentApi.create(form);
        toast.success("Equipment added");
      }
      setEditing(null);
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!confirm(`Retire "${item.name}"? It will be hidden from students.`))
      return;
    try {
      await equipmentApi.remove(item.id);
      toast.success("Equipment retired");
      refresh();
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (loading) return <FullPageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage equipment</h1>
        {!editing && (
          <button
            className="btn-primary"
            onClick={() => setEditing({})}
            disabled={labRooms.length === 0}
          >
            + Add equipment
          </button>
        )}
      </div>

      {editing && (
        <EquipmentForm
          initial={editing.id ? editing : null}
          labRooms={labRooms}
          onSave={save}
          onCancel={() => setEditing(null)}
          busy={busy}
        />
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Lab</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => (
              <tr key={it.id}>
                <td className="px-4 py-3 font-medium">{it.name}</td>
                <td className="px-4 py-3 text-slate-600">{it.category}</td>
                <td className="px-4 py-3 text-slate-600">
                  {it.labRoom?.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{it.quantity}</td>
                <td className="px-4 py-3 text-slate-600">{it.condition}</td>
                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                  <button
                    className="text-brand-700 hover:underline"
                    onClick={() =>
                      setEditing({
                        id: it.id,
                        name: it.name,
                        category: it.category,
                        labRoomId: it.labRoomId,
                        quantity: it.quantity,
                        condition: it.condition,
                        notes: it.notes || "",
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="text-rose-600 hover:underline"
                    onClick={() => remove(it)}
                  >
                    Retire
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
