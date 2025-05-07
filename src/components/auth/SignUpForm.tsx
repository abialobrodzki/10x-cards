/* eslint-disable no-console */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

/**
 * Schemat Zod do walidacji danych wejściowych formularza rejestracji.
 * Wymaga adresu email (prawidłowy format), hasła (min. 8 znaków) oraz potwierdzenia hasła.
 * Schemat zawiera również walidację sprawdzającą, czy hasło i potwierdzenie hasła są identyczne.
 */
const signUpSchema = z
  .object({
    email: z.string().email("Nieprawidłowy adres email"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują",
    path: ["confirmPassword"],
  });

/**
 * Typ danych formularza rejestracji wywnioskowany ze schematu `signUpSchema`.
 */
type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Komponent React renderujący formularz rejestracji.
 * Obsługuje walidację formularza przy użyciu react-hook-form i Zod,
 * wysyła dane rejestracji do endpointu API `/api/auth/register`,
 * obsługuje odpowiedzi (sukces/błąd, wymagana weryfikacja email) i zarządza
 * stanem ładowania oraz komunikatami dla użytkownika.
 *
 * @component
 * @returns {JSX.Element} Formularz rejestracji w postaci elementu JSX.
 * @dependencies
 * - react: `useState` do zarządzania stanem.
 * - react-hook-form: `useForm` do zarządzania formularzem i walidacją.
 * - @hookform/resolvers/zod: Integracja Zod z react-hook-form.
 * - zod: Definicja schematu walidacji `signUpSchema`.
 * - ../ui/button, ../ui/input, ../ui/form: Komponenty UI (Shadcn/ui).
 * @sideEffects
 * - Wysyła żądanie POST do `/api/auth/register`.
 * - W przypadku pomyślnej rejestracji i braku wymogu potwierdzenia email może modyfikować `window.location.href` (przekierowanie z API).
 */
export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Funkcja obsługująca wysyłanie formularza rejestracji.
   * Waliduje dane, wysyła je do endpointu API `/api/auth/register`,
   * przetwarza odpowiedź serwera, ustawia komunikaty o błędach lub sukcesie,
   * i zarządza stanem ładowania. Resetuje formularz w przypadku sukcesu.
   *
   * @param {SignUpFormValues} values - Zwalidowane dane z formularza (email, hasło, potwierdzenie hasła).
   * @returns {Promise<void>} Promise, który rozwiązuje się po zakończeniu procesu wysyłania.
   * @throws {Error} Może rzucić błąd w przypadku problemów z siecią lub przetwarzaniem odpowiedzi (choć są one łapane wewnętrznie).
   * @sideEffects
   * - Ustawia stany `isLoading`, `serverError`, `registrationSuccess`, `requiresEmailConfirmation`.
   * - Wywołuje `fetch` do endpointu API `/api/auth/register`.
   * - Wywołuje `form.reset()` w przypadku sukcesu.
   * - Może wywołać `window.location.assign` lub `window.location.href` w przypadku przekierowania z API.
   */
  async function onSubmit(values: SignUpFormValues) {
    console.log("[onSubmit] Start");
    if (isLoading) {
      console.log("[onSubmit] Already loading, preventing second submission.");
      return;
    }
    setIsLoading(true);
    setServerError(null);
    setRegistrationSuccess(false);
    setRequiresEmailConfirmation(false);

    try {
      console.log("[onSubmit] Before fetch");
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      console.log("[onSubmit] After fetch", {
        ok: response.ok,
        status: response.status,
        redirected: response.redirected,
        url: response.url,
      });

      if (response.redirected) {
        console.log("[onSubmit] Redirecting to:", response.url);
        // Use both methods to handle redirects for test compatibility
        window.location.assign(response.url);
        window.location.href = response.url;
        console.log("[onSubmit] Redirect href assigned");
        return;
      }

      console.log("[onSubmit] Before response.json()");
      const data = await response.json();
      console.log("[onSubmit] After response.json()", data);

      if (!response.ok) {
        console.log("[onSubmit] Handling !response.ok", data);
        setServerError(data.error || "Wystąpił błąd podczas rejestracji");
        form.clearErrors();
      } else if (data.success) {
        console.log("[onSubmit] Handling data.success", data);
        setRegistrationSuccess(true);
        if (data.requiresEmailConfirmation) {
          console.log("[onSubmit] Setting requiresEmailConfirmation");
          setRequiresEmailConfirmation(true);
        }
        console.log("[onSubmit] Before form.reset()");
        form.reset();
        console.log("[onSubmit] After form.reset()");
      }
    } catch (error) {
      /* eslint-disable no-console */
      console.error("[onSubmit] CATCH BLOCK ERROR:", error);
      setServerError("Nie można połączyć się z serwerem. Spróbuj ponownie później.");
    } finally {
      console.log("[onSubmit] Finally block");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Rejestracja</h1>
        <p className="text-sm text-muted-foreground">Utwórz nowe konto, aby korzystać z aplikacji</p>
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" data-testid="server-error-message">
          {serverError}
        </div>
      )}

      {registrationSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800" data-testid="registration-success-message">
          <p className="font-medium">Rejestracja zakończona pomyślnie!</p>
          {requiresEmailConfirmation && (
            <p className="mt-2">
              Na Twój adres email został wysłany <span>link aktywacyjny</span>. Sprawdź swoją skrzynkę pocztową i
              kliknij link, aby aktywować konto.
            </p>
          )}
          {requiresEmailConfirmation ? (
            <p className="mt-2 text-center">
              <a href="/auth/login" className="text-primary hover:underline" data-testid="login-link-after-signup">
                Przejdź do strony logowania
              </a>
            </p>
          ) : null}
        </div>
      )}

      {!registrationSuccess && (
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="********"
                      type="password"
                      {...field}
                      disabled={isLoading}
                      data-testid="password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="********"
                      type="password"
                      {...field}
                      disabled={isLoading}
                      data-testid="confirm-password-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
              data-testid="signup-button"
            >
              {isLoading ? "Rejestracja..." : "Zarejestruj się"}
            </Button>
          </form>
        </Form>
      )}

      {!registrationSuccess && (
        <div className="text-center text-sm">
          Masz już konto?{" "}
          <a href="/auth/login" className="text-primary underline" data-testid="login-link">
            Zaloguj się
          </a>
        </div>
      )}
    </div>
  );
}
