import { useState, useEffect, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { FlashcardFormModalProps, FlashcardFormValues } from "./types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Definicja schematu walidacji
const flashcardFormSchema = z.object({
  front: z
    .string()
    .min(1, "Pole przodu fiszki nie może być puste")
    .min(3, "Tekst jest za krótki. Minimum to 3 znaki.")
    .max(500, "Tekst jest zbyt długi. Maksimum to 500 znaków."),
  back: z
    .string()
    .min(1, "Pole tyłu fiszki nie może być puste")
    .min(3, "Tekst jest za krótki. Minimum to 3 znaki.")
    .max(500, "Tekst jest zbyt długi. Maksimum to 500 znaków."),
  source: z.enum(["manual", "ai-full", "ai-edited"]),
  generation_id: z.number().nullable().optional(),
});

type FlashcardFormSchema = z.infer<typeof flashcardFormSchema>;

const FlashcardFormModal = ({ isOpen, onClose, flashcard, onSubmit, isSubmitting }: FlashcardFormModalProps) => {
  const isEditing = !!flashcard;
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inicjalizacja formularza
  const form = useForm<FlashcardFormSchema>({
    resolver: zodResolver(flashcardFormSchema),
    defaultValues: {
      front: "",
      back: "",
      source: "manual",
      generation_id: null,
    },
    mode: "onTouched",
  });

  // Aktualizacja wartości formularza gdy flashcard się zmienia
  useEffect(() => {
    if (flashcard) {
      form.reset({
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source as "manual" | "ai-full" | "ai-edited",
        generation_id: flashcard.generation_id || null,
      });
    } else {
      form.reset({
        front: "",
        back: "",
        source: "manual",
        generation_id: null,
      });
    }
  }, [flashcard, form]);

  // Obsługa wysłania formularza
  const handleSubmit = async (values: FlashcardFormSchema) => {
    setSubmitError(null);
    try {
      // Check if it is an AI flashcard being edited and if content has changed
      if (isEditing && flashcard?.source === "ai-full") {
        if (values.front !== flashcard.front || values.back !== flashcard.back) {
          values.source = "ai-edited";
        }
      }

      await onSubmit(values as FlashcardFormValues);

      // Po pomyślnym utworzeniu nowej fiszki, resetuj formularz
      if (!isEditing) {
        form.reset({
          front: "",
          back: "",
          source: "manual",
          generation_id: null,
        });
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania fiszki. Spróbuj ponownie."
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setSubmitError(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[540px]" data-testid="flashcard-form-modal">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">{isEditing ? "Edytuj fiszkę" : "Utwórz nową fiszkę"}</DialogTitle>
          <DialogDescription data-testid="dialog-description">
            {isEditing ? "Zmodyfikuj zawartość fiszki poniżej." : "Wypełnij formularz aby utworzyć nową fiszkę."}
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <Alert variant="destructive" className="mb-4" data-testid="submit-error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4" data-testid="flashcard-form">
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel data-testid="front-label">Przód fiszki</FormLabel>
                    <span className="text-xs text-muted-foreground">{field.value.length}/500 znaków</span>
                  </div>
                  <div className="relative">
                    <FormControl>
                      <Textarea
                        placeholder="Wpisz treść przodu fiszki..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="front-textarea"
                      />
                    </FormControl>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-6 w-6 p-0"
                        onClick={() => field.onChange("")}
                        data-testid="clear-front-button"
                      >
                        <span className="sr-only">Wyczyść pole</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                  <FormMessage data-testid="front-form-message" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel data-testid="back-label">Tył fiszki</FormLabel>
                    <span className="text-xs text-muted-foreground">{field.value.length}/500 znaków</span>
                  </div>
                  <div className="relative">
                    <FormControl>
                      <Textarea
                        placeholder="Wpisz treść tyłu fiszki..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="back-textarea"
                      />
                    </FormControl>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-6 w-6 p-0"
                        onClick={() => field.onChange("")}
                        data-testid="clear-back-button"
                      >
                        <span className="sr-only">Wyczyść pole</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                  <FormMessage data-testid="back-form-message" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                data-testid="cancel-button"
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.formState.isValid} data-testid="save-button">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loader-icon" />
                    <span data-testid="loader-text">Zapisywanie...</span>
                  </>
                ) : (
                  <span>Zapisz</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default memo(FlashcardFormModal);
