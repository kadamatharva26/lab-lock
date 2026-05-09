import clsx from "clsx";

const STYLES = {
  requested: "bg-amber-100 text-amber-800",
  approved:  "bg-emerald-100 text-emerald-800",
  rejected:  "bg-rose-100 text-rose-800",
  in_use:    "bg-sky-100 text-sky-800",
  returned:  "bg-slate-200 text-slate-700",
  cancelled: "bg-slate-100 text-slate-500 line-through",
};

export function StatusBadge({ status }) {
  return <span className={clsx("badge", STYLES[status] || "bg-slate-100")}>{status}</span>;
}
