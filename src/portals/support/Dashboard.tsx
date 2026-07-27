import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SupportDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Support Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Open Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">43</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">19</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">16m</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-300">
        <CardHeader>
          <CardTitle>Priority Queue</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="rounded bg-red-50 border border-red-200 p-2">
            URGENT: Family tracking disconnected for 45 mins
          </p>
          <p className="rounded bg-red-50 border border-red-200 p-2">
            URGENT: Payment dispute in booking #4828
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportDashboard;
