import React from "react";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface TextInputFormProps {
  onSubmit: (text: string) => Promise<void>;
  isGenerating: boolean;
}

const MIN_CHARS = 1000;
const MAX_CHARS = 10000;

// Define validation schema using Zod
const textInputSchema = z.object({
  text: z
    .string()
    .min(MIN_CHARS, `Tekst jest zbyt krótki. Minimum to ${MIN_CHARS} znaków.`)
    .max(MAX_CHARS, `Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`),
});

type TextInputFormValues = z.infer<typeof textInputSchema>;

const TextInputForm: React.FC<TextInputFormProps> = ({ onSubmit, isGenerating }) => {
  // Initialize react-hook-form
  const form = useForm<TextInputFormValues>({
    resolver: zodResolver(textInputSchema),
    defaultValues: {
      text: "",
    },
    mode: "onBlur", // Validate on blur, re-validate on change for fields that have been blurred and had errors
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (isGenerating) {
      return;
    }
    try {
      await onSubmit(values.text);
    } catch {
      // Error is handled by the parent component
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="text"
            render={({ field, fieldState, formState }) => {
              const currentLength = field.value ? field.value.length : 0;

              const fieldShowError = (formState.isSubmitted || fieldState.isTouched) && !!fieldState.error;

              const isLengthCurrentlyInvalid = currentLength < MIN_CHARS || currentLength > MAX_CHARS;
              const shouldApplyErrorColorToCount =
                (formState.isSubmitted || fieldState.isTouched) && isLengthCurrentlyInvalid;

              return (
                <FormItem>
                  <FormLabel htmlFor={field.name} className="!text-foreground">
                    Wprowadź tekst edukacyjny (min. {MIN_CHARS}, max. {MAX_CHARS} znaków)
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <textarea
                        id={field.name}
                        placeholder="Wklej tutaj tekst z którego chcesz wygenerować fiszki..."
                        className={`w-full min-h-[200px] p-4 border bg-white rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                          fieldShowError ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isGenerating}
                        data-testid="text-input-textarea"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("text");
                        }}
                      />
                    </FormControl>
                    {currentLength > 0 && !isGenerating && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 h-6 w-6 p-0"
                        onClick={() => form.setValue("text", "", { shouldValidate: true, shouldDirty: true })}
                        aria-label="Wyczyść tekst"
                        data-testid="clear-text-button"
                      >
                        <span className="sr-only">Wyczyść tekst</span>
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                    <div className="flex-grow">
                      {fieldShowError && <FormMessage data-testid="text-input-error-message" />}
                    </div>
                    <div className="flex-shrink-0">
                      <p
                        className={`text-sm ${shouldApplyErrorColorToCount ? "text-red-600" : "text-gray-500"}`}
                        data-testid="character-count"
                      >
                        {currentLength} / {MAX_CHARS} znaków
                      </p>
                    </div>
                  </div>
                </FormItem>
              );
            }}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!form.formState.isValid || isGenerating}
            className="px-6 py-2"
            data-testid="generate-button"
          >
            {isGenerating ? "Generowanie..." : "Generuj fiszki"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TextInputForm;
