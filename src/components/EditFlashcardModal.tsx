import React, { useEffect } from "react";
import { Button } from "./ui/button";
import type { FlashcardViewModel, FlashcardBaseData } from "../types/viewModels";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardViewModel | null;
  onClose: () => void;
  onSave: (updatedFlashcard: FlashcardBaseData) => void;
}

const MIN_CHARS = 3; // Minimalna ilość znaków
const MAX_CHARS = 500; // Maksymalna ilość znaków w polu

// Define Zod schema for flashcard editing
const editFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, "Pole przodu fiszki nie może być puste.")
    .min(MIN_CHARS, `Tekst jest za krótki. Minimum to ${MIN_CHARS} znaki.`)
    .max(MAX_CHARS, `Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`),
  back: z
    .string()
    .min(1, "Pole tyłu fiszki nie może być puste.")
    .min(MIN_CHARS, `Tekst jest za krótki. Minimum to ${MIN_CHARS} znaki.`)
    .max(MAX_CHARS, `Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`),
});

type EditFlashcardFormValues = z.infer<typeof editFlashcardSchema>;

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({ isOpen, flashcard, onClose, onSave }) => {
  const form = useForm<EditFlashcardFormValues>({
    resolver: zodResolver(editFlashcardSchema),
    defaultValues: {
      front: "",
      back: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isOpen && flashcard) {
      form.reset({
        front: flashcard.front,
        back: flashcard.back,
      });
    } else if (!isOpen) {
      form.reset({ front: "", back: "" });
      // Ensure errors are also cleared if the modal is closed externally
      form.clearErrors();
    }
  }, [flashcard, isOpen, form]);

  const handleFormSubmit = form.handleSubmit(async (data) => {
    onSave({
      front: data.front.trim(),
      back: data.back.trim(),
    });
    onClose();
  });

  if (!isOpen || !flashcard) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          // Reset form and clear errors when dialog is closed via overlay click or Esc key
          form.reset({ front: flashcard?.front || "", back: flashcard?.back || "" });
          form.clearErrors();
        }
      }}
    >
      <DialogContent className="sm:max-w-[540px]" data-testid="edit-flashcard-modal">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Zmodyfikuj zawartość fiszki poniżej.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6 py-4" data-testid="edit-flashcard-form">
            <FormField
              control={form.control}
              name="front"
              render={({ field, fieldState, formState }) => {
                const currentLength = field.value ? field.value.length : 0;
                const fieldShowError = (formState.isSubmitted || fieldState.isTouched) && !!fieldState.error;
                const isLengthCurrentlyInvalid = currentLength < MIN_CHARS || currentLength > MAX_CHARS;
                const shouldApplyErrorColorToCount =
                  (formState.isSubmitted || fieldState.isTouched) && isLengthCurrentlyInvalid;

                return (
                  <FormItem className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <FormLabel htmlFor={field.name} className="!text-foreground">
                        Przód fiszki
                      </FormLabel>
                      <span
                        className={`text-xs ${shouldApplyErrorColorToCount ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {currentLength} / {MAX_CHARS} znaków
                      </span>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          id={field.name}
                          placeholder="Wpisz treść przodu fiszki..."
                          className={`min-h-[100px] ${
                            fieldShowError
                              ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/40"
                              : ""
                          }`}
                          aria-invalid={!!fieldState.error}
                          data-testid="edit-flashcard-front-textarea"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (fieldState.isTouched || formState.isSubmitted) {
                              form.trigger("front");
                            }
                          }}
                        />
                      </FormControl>
                      {field.value && field.value.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 p-0"
                          onClick={() => {
                            form.setValue("front", "", { shouldValidate: true, shouldDirty: true });
                          }}
                          aria-label="Wyczyść pole"
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
                    {fieldShowError && <FormMessage className="mt-1" data-testid="front-error-message" />}
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="back"
              render={({ field, fieldState, formState }) => {
                const currentLength = field.value ? field.value.length : 0;
                const fieldShowError = (formState.isSubmitted || fieldState.isTouched) && !!fieldState.error;
                const isLengthCurrentlyInvalid = currentLength < MIN_CHARS || currentLength > MAX_CHARS;
                const shouldApplyErrorColorToCount =
                  (formState.isSubmitted || fieldState.isTouched) && isLengthCurrentlyInvalid;

                return (
                  <FormItem className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <FormLabel htmlFor={field.name} className="!text-foreground">
                        Tył fiszki
                      </FormLabel>
                      <span
                        className={`text-xs ${shouldApplyErrorColorToCount ? "text-red-600" : "text-muted-foreground"}`}
                      >
                        {currentLength} / {MAX_CHARS} znaków
                      </span>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          id={field.name}
                          placeholder="Wpisz treść tyłu fiszki..."
                          className={`min-h-[100px] ${
                            fieldShowError
                              ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/40"
                              : ""
                          }`}
                          aria-invalid={!!fieldState.error}
                          data-testid="edit-flashcard-back-textarea"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            if (fieldState.isTouched || formState.isSubmitted) {
                              form.trigger("back");
                            }
                          }}
                        />
                      </FormControl>
                      {field.value && field.value.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-6 w-6 p-0"
                          onClick={() => {
                            form.setValue("back", "", { shouldValidate: true, shouldDirty: true });
                          }}
                          aria-label="Wyczyść pole"
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
                    {fieldShowError && <FormMessage className="mt-1" data-testid="back-error-message" />}
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-edit-button">
                Anuluj
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isValid || form.formState.isSubmitting}
                data-testid="save-edit-button"
              >
                Zapisz
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardModal;
