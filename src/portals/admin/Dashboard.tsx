import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const tripsPerDay = [
  { day: "Mon", trips: 14 },
  { day: "Tue", trips: 18 },
  { day: "Wed", trips: 17 },
  { day: "Thu", trips: 22 },
  { day: "Fri", trips: 31 },
  { day: "Sat", trips: 27 },
  { day: "Sun", trips: 20 },
];

const categories = [
  { category: "Nature", count: 33 },
  { category: "Heritage", count: 20 },
  { category: "Food", count: 17 },
  { category: "Adventure", count: 13 },
];

const AdminDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          "Total Users",
          "Active Trips",
          "Pending Verifications",
          "Open Reports",
          "Guides",
          "Attractions",
        ].map((label, index) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(index + 3) * 24}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Trips per day (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tripsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line dataKey="trips" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attraction categories</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>New guide registered in Kerala</p>
          <p>2 attractions approved</p>
          <p>1 report escalated to support</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
