import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const rows = [
  {
    id: "u1",
    name: "Asha",
    email: "asha@example.com",
    role: "user",
    trips: 4,
    joined: "2025-07-01",
    status: "active",
  },
  {
    id: "u2",
    name: "Ravi",
    email: "ravi@example.com",
    role: "guide",
    trips: 2,
    joined: "2025-06-15",
    status: "active",
  },
];

const UserManagement = () => {
  const [search, setSearch] = useState("");

  const filtered = rows.filter((row) =>
    [row.name, row.email, row.role, row.status].some((field) =>
      field.includes(search.toLowerCase()),
    ),
  );

  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">User Management</h1>
      <Input
        placeholder="Search by name/email/role/status"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Trips</th>
              <th className="text-left p-2">Joined</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.name}</td>
                <td className="p-2">{row.email}</td>
                <td className="p-2">{row.role}</td>
                <td className="p-2">{row.trips}</td>
                <td className="p-2">{row.joined}</td>
                <td className="p-2">{row.status}</td>
                <td className="p-2 space-x-2">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    Change Role
                  </Button>
                  <Button size="sm" variant="secondary">
                    Suspend
                  </Button>
                  <Button size="sm" variant="destructive">
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
