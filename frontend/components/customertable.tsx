type Customer = {
  name: string;
  company: string;
  status: string;
  value: string;
};

type CustomerTableProps = {
  customers: Customer[];
};

export default function CustomerTable({
  customers,
}: CustomerTableProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">Recent Customers</h3>
          <p className="text-sm text-muted mt-1">
            A snapshot of your customer relationships.
          </p>
        </div>

        <button className="text-sm text-primary font-semibold">
          View all →
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-4 font-medium">Customer</th>
              <th className="py-4 font-medium">Company</th>
              <th className="py-4 font-medium">Status</th>
              <th className="py-4 font-medium text-right">Deal Value</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.name}
                className="border-b border-border last:border-0"
              >
                <td className="py-5 font-semibold">{customer.name}</td>
                <td className="py-5 text-muted">{customer.company}</td>
                <td className="py-5">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-primary">
                    {customer.status}
                  </span>
                </td>
                <td className="py-5 text-right font-medium">
                  {customer.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
