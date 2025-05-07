/* eslint-disable no-console */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

/**
 * Schemat Zod do walidacji danych wejściowych formularza logowania.
 * Wymaga adresu email (prawidłowy format) i hasła (niepuste).
 */
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * Typ danych formularza logowania wywnioskowany ze schematu `loginSchema`.
 */
type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Komponent React renderujący formularz logowania.
 * Obsługuje walidację formularza przy użyciu react-hook-form i Zod,
 * wysyła dane logowania do endpointu API `/api/auth/login` i przekierowuje
 * użytkownika po pomyślnym zalogowaniu. Obsługuje również wyświetlanie błędów serwera
 * i stan ładowania.
 *
 * @component
 * @returns {JSX.Element} Formularz logowania w postaci elementu JSX.
 * @dependencies
 * - react: `useState` do zarządzania stanem.
 * - react-hook-form: `useForm` do zarządzania formularzem i walidacją.
 * - @hookform/resolvers/zod: Integracja Zod z react-hook-form.
 * - zod: Definicja schematu walidacji `loginSchema`.
 * - ../ui/button, ../ui/input, ../ui/form: Komponenty UI (Shadcn/ui).
 * @sideEffects
 * - Wysyła żądania POST do `/api/auth/logout` (próba wyczyszczenia ciasteczek) i `/api/auth/login`.
 * - W przypadku sukcesu modyfikuje `window.location.href` w celu przekierowania.
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Funkcja obsługująca wysyłanie formularza logowania.
   * Waliduje dane, próbuje wyczyścić stare ciasteczka sesji (opcjonalnie),
   * wysyła dane logowania do API, obsługuje odpowiedzi (sukces/błąd)
   * i zarządza stanem ładowania oraz błędami serwera.
   *
   * @param {LoginFormValues} values - Zwalidowane dane z formularza (email i hasło).
   * @returns {Promise<void>} Promise, który rozwiązuje się po zakończeniu procesu wysyłania.
   * @throws {Error} Może rzucić błąd w przypadku problemów z siecią lub przetwarzaniem odpowiedzi (choć są one łapane wewnętrznie).
   * @sideEffects
   * - Ustawia stan `isLoading` i `serverError`.
   * - Wywołuje `fetch` do endpointów API.
   * - Modyfikuje `window.location.href` w przypadku pomyślnego logowania.
   */
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);
    console.log("Rozpoczynam proces logowania...");

    try {
      // Najpierw spróbuj wylogować użytkownika, aby usunąć stare ciasteczka
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include", // Ważne dla ciasteczek
        });
        console.log("Wyczyszczono stare ciasteczka sesji");
      } catch (logoutErr) {
        console.warn("Nie udało się wyczyścić starych ciasteczek:", logoutErr);
      }

      console.log("Wysyłam zapytanie do /api/auth/login");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Ważne dla ciasteczek
      });

      console.log("Otrzymałem odpowiedź, status:", response.status);

      if (response.ok) {
        console.log("Logowanie pomyślne, przekierowuję do /generate");

        // Dodajemy opóźnienie, aby upewnić się, że ciasteczka zostały zapisane
        setTimeout(() => {
          window.location.href = "/generate";
        }, 500);
      } else {
        const errorData = await response.json();
        setServerError(errorData.error || "Nieudane logowanie. Sprawdź swoje dane.");
        console.error("Błąd logowania:", errorData);
      }
    } catch (error) {
      console.error("Wystąpił błąd podczas logowania:", error);
      setServerError("Wystąpił błąd podczas łączenia z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Logowanie</h1>
        <p className="text-sm text-muted-foreground">Wprowadź swoje dane, aby się zalogować</p>
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" data-testid="server-error-message">
          {serverError}
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

          <div className="text-right text-sm">
            <a
              href="/auth/forgot-password"
              className="text-primary underline underline-offset-2"
              data-testid="forgot-password-link"
            >
              Zapomniałeś hasła?
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-button">
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Nie masz jeszcze konta?{" "}
        <a href="/auth/register" className="text-primary underline underline-offset-2" data-testid="register-link">
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}
