import { memo } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGridIcon, ListIcon } from "lucide-react";

export type ViewMode = "grid" | "list";

interface FlashcardsViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const FlashcardsViewToggle = ({ currentView, onViewChange }: FlashcardsViewToggleProps) => {
  return (
    <div className="flex border rounded-md overflow-hidden">
      <Button
        variant={currentView === "grid" ? "default" : "ghost"}
        size="sm"
        className={`rounded-none px-3 ${currentView === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        onClick={() => onViewChange("grid")}
        aria-label="Widok siatki"
        aria-pressed={currentView === "grid"}
        data-testid="grid-view-button"
      >
        <LayoutGridIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Siatka</span>
      </Button>
      <Button
        variant={currentView === "list" ? "default" : "ghost"}
        size="sm"
        className={`rounded-none px-3 ${currentView === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        onClick={() => onViewChange("list")}
        aria-label="Widok listy"
        aria-pressed={currentView === "list"}
        data-testid="list-view-button"
      >
        <ListIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Lista</span>
      </Button>
    </div>
  );
};

export default memo(FlashcardsViewToggle);
