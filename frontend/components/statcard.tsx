
type StatCardProps = {
  label: string;
  value: string;
  change: string;
};

export default function StatCard({
  label,
  value,
  change,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-sm font-medium text-muted">{label}</p>

      <h3 className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </h3>

      <p className="mt-3 text-sm text-primary">
        {change}{" "}
        <span className="text-muted">
          vs last month
        </span>
      </p>
    </div>
  );
}
