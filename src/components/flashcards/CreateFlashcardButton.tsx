import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import type { CreateFlashcardButtonProps } from "./types";

const CreateFlashcardButton = ({ onClick }: CreateFlashcardButtonProps) => {
  return (
    <Button onClick={onClick} className="flex items-center gap-2" data-testid="create-flashcard-button">
      <PlusIcon className="h-4 w-4" />
      <span>Dodaj fiszkę</span>
    </Button>
  );
};

export default CreateFlashcardButton;
