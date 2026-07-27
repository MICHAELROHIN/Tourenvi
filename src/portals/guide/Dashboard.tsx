import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GuideDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Guide Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Attractions Added</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">18</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Guides Written</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">7</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2,420</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My attractions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Valley Point - pending</p>
          <p>Sunrise Trail - verified</p>
          <p>Temple Market - rejected</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traveler queries for my location</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>Best cafe near Coorg market?</p>
          <p>Is monsoon trekking safe this week?</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuideDashboard;
