import { Button } from "@/components/ui/button";

const ReportManagement = () => {
  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Report Management</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline">Filter Severity</Button>
        <Button variant="outline">Assign</Button>
        <Button variant="secondary">Bulk Resolve</Button>
        <Button>Export CSV</Button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Report</th>
              <th className="text-left p-2">Severity</th>
              <th className="text-left p-2">Assigned</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2">Spam attraction submission</td>
              <td className="p-2">high</td>
              <td className="p-2">Team A</td>
              <td className="p-2">open</td>
            </tr>
            <tr className="border-t">
              <td className="p-2">Guide misconduct report</td>
              <td className="p-2">critical</td>
              <td className="p-2">Team B</td>
              <td className="p-2">investigating</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportManagement;
