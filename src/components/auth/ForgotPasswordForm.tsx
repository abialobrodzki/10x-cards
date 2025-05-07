import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

/**
 * Schemat Zod do walidacji danych wejściowych formularza resetowania hasła (tylko email).
 * Wymaga adresu email (prawidłowy format).
 */
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

/**
 * Typ danych formularza resetowania hasła wywnioskowany ze schematu `forgotPasswordSchema`.
 */
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Komponent React renderujący formularz żądania resetowania hasła.
 * Obsługuje walidację formularza przy użyciu react-hook-form i Zod,
 * wysyła adres email do endpointu API `/api/auth/forgot-password`,
 * obsługuje odpowiedzi (sukces/błąd) i zarządza stanem ładowania oraz
 * komunikatami dla użytkownika. Zawsze wyświetla komunikat o sukcesie
 * po wysłaniu żądania, niezależnie od tego, czy email istnieje w bazie (dla bezpieczeństwa).
 *
 * @component
 * @returns {JSX.Element} Formularz żądania resetowania hasła w postaci elementu JSX.
 * @dependencies
 * - react: `useState` do zarządzania stanem.
 * - react-hook-form: `useForm` do zarządzania formularzem i walidacją.
 * - @hookform/resolvers/zod: Integracja Zod z react-hook-form.
 * - zod: Definicja schematu walidacji `forgotPasswordSchema`.
 * - ../ui/button, ../ui/input, ../ui/form: Komponenty UI (Shadcn/ui).
 * @sideEffects
 * - Wysyła żądanie POST do `/api/auth/forgot-password`.
 */
export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  /**
   * Funkcja obsługująca wysyłanie formularza żądania resetowania hasła.
   * Waliduje dane, wysyła je do endpointu API `/api/auth/forgot-password`,
   * przetwarza odpowiedź serwera, ustawia komunikaty o błędach lub sukcesie,
   * i zarządza stanem ładowania. Resetuje formularz w przypadku sukcesu.
   *
   * @param {ForgotPasswordFormValues} values - Zwalidowane dane z formularza (tylko email).
   * @returns {Promise<void>} Promise, który rozwiązuje się po zakończeniu procesu wysyłania.
   * @throws {Error} Może rzucić błąd w przypadku problemów z siecią lub przetwarzaniem odpowiedzi (choć są one łapane wewnętrznie).
   * @sideEffects
   * - Ustawia stany `isLoading`, `isSuccess`, `serverError`.
   * - Wywołuje `fetch` do endpointu API `/api/auth/forgot-password`.
   * - Wywołuje `form.reset()` w przypadku sukcesu.
   */
  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    setServerError(null);
    setIsSuccess(false);

    try {
      // Wywołanie endpointu API resetowania hasła
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.error || "Wystąpił błąd podczas wysyłania linku resetującego");
        return;
      }

      // Wyświetlenie komunikatu o sukcesie
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      /* eslint-disable no-console */
      console.error("Błąd podczas wysyłania żądania resetowania hasła:", error);
      setServerError("Nie można połączyć się z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Resetowanie hasła</h1>
        <p className="text-sm text-muted-foreground">
          Wprowadź swój adres email, aby otrzymać link do resetowania hasła
        </p>
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" data-testid="server-error-message">
          {serverError}
        </div>
      )}

      {isSuccess && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800" data-testid="reset-link-sent-message">
          Link do resetowania hasła został wysłany na podany adres email, jeśli istnieje w naszej bazie.
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="nazwa@example.com"
                    type="email"
                    {...field}
                    disabled={isLoading}
                    data-testid="email-input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="send-reset-link-button">
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <a href="/auth/login" className="text-primary underline" data-testid="back-to-login-link">
          Wróć do logowania
        </a>
      </div>
    </div>
  );
}
