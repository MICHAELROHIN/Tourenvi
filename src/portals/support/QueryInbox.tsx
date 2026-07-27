import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SupportQueryInbox = () => {
  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Support Query Inbox</h1>
      {[
        "AI escalation: route confusion",
        "Refund issue: failed checkout",
        "Abuse report in chat",
      ].map((query) => (
        <div key={query} className="border rounded p-4 space-y-2">
          <p className="font-medium">{query}</p>
          <Textarea placeholder="Reply / notes" />
          <div className="flex gap-2">
            <Button variant="outline">Assign</Button>
            <Button>Reply</Button>
            <Button variant="secondary">Resolve</Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SupportQueryInbox;
