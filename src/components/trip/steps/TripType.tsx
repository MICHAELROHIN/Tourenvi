import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UserRound, UsersRound, House } from "lucide-react";
import type { TripType } from "@/context/TripContext";

const tripTypes: Array<{
  value: TripType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "solo", label: "Solo", icon: UserRound },
  { value: "family", label: "Family", icon: House },
  { value: "group", label: "Group", icon: UsersRound },
];

type Props = {
  value: TripType;
  onChange: (value: TripType) => void;
};

const TripTypeStep = ({ value, onChange }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {tripTypes.map((type) => {
        const Icon = type.icon;
        const selected = type.value === value;
        return (
          <Card
            key={type.value}
            className={cn(
              "cursor-pointer border transition-all",
              selected
                ? "border-primary ring-2 ring-primary/20"
                : "border-border",
            )}
            onClick={() => onChange(type.value)}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon className="h-5 w-5" /> {type.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {type.label} trip planning preset
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TripTypeStep;
