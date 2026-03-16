import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialQueries = [
  { id: "q1", question: "Any hidden places in Munnar?", status: "open" },
  { id: "q2", question: "Best sunrise point in Coorg?", status: "open" },
];

const GuideQueryInbox = () => {
  const [queries, setQueries] = useState(initialQueries);
  const [reply, setReply] = useState("");

  const resolve = (id: string) => {
    setQueries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: "resolved" } : row)),
    );
  };

  return (
    <div className="container mx-auto px-4 py-20 space-y-4">
      <h1 className="text-3xl font-bold">Guide Query Inbox</h1>
      {queries.map((query) => (
        <div key={query.id} className="border rounded p-4 space-y-2">
          <p className="font-medium">{query.question}</p>
          <p className="text-sm text-muted-foreground">
            Status: {query.status}
          </p>
          <Textarea
            placeholder="Reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline">Send Reply</Button>
            <Button variant="secondary" onClick={() => resolve(query.id)}>
              Mark Resolved
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GuideQueryInbox;
