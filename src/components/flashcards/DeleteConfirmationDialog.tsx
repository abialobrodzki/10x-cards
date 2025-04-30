import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { DeleteConfirmationDialogProps } from "./types";

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  flashcardFront,
}: DeleteConfirmationDialogProps) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch {
      // Handle error silently - the parent component should handle errors
      // or implement more robust error handling if needed
    }
  };

  // Skracamy treść fiszki na potrzeby potwierdzenia
  const truncatedContent = flashcardFront.length > 50 ? `${flashcardFront.substring(0, 50)}...` : flashcardFront;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent data-testid="delete-confirmation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Zamierzasz usunąć fiszkę: <span className="font-medium">&quot;{truncatedContent}&quot;</span>
            <br />
            Ta operacja jest nieodwracalna i spowoduje trwałe usunięcie fiszki.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} data-testid="cancel-delete-button">
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="confirm-delete-button"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Usuwanie...</span>
              </>
            ) : (
              <span>Usuń</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
