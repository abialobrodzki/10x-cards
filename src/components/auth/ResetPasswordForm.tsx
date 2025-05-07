/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
/* eslint-disable no-console */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

/**
 * Schemat Zod do walidacji danych wejściowych formularza resetowania hasła.
 * Wymaga nowego hasła (min. 8 znaków) oraz potwierdzenia hasła.
 * Schemat zawiera również walidację sprawdzającą, czy hasło i potwierdzenie hasła są identyczne.
 */
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują",
    path: ["confirmPassword"],
  });

/**
 * Typ danych formularza resetowania hasła wywnioskowany ze schematu `resetPasswordSchema`.
 */
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

/**
 * Właściwości (props) komponentu ResetPasswordForm.
 */
interface ResetPasswordFormProps {
  /** Token lub kod resetowania hasła przekazany do komponentu. Może pochodzić z URL. */
  token: string;
}

/**
 * Komponent React renderujący formularz resetowania hasła.
 * Umożliwia użytkownikowi ustawienie nowego hasła po kliknięciu w link resetujący otrzymany email.
 * Komponent automatycznie wyciąga token resetowania z URL (hash, query params), localStorage lub propsów.
 * Obsługuje walidację formularza, wysyła nowe hasło i token do endpointu API `/api/auth/reset-password`,
 * obsługuje odpowiedzi (sukces/błąd) i zarządza stanem ładowania oraz komunikatami dla użytkownika.
 * Czyści token z URL i/lub localStorage po jego wyodrębnieniu.
 *
 * @component
 * @param {ResetPasswordFormProps} props - Właściwości komponentu.
 * @returns {JSX.Element} Formularz resetowania hasła w postaci elementu JSX.
 * @dependencies
 * - react: `useState`, `useEffect` do zarządzania stanem i efektami ubocznymi.
 * - react-hook-form: `useForm` do zarządzania formularzem i walidacją.
 * - @hookform/resolvers/zod: Integracja Zod z react-hook-form.
 * - zod: Definicja schematu walidacji `resetPasswordSchema`.
 * - ../ui/button, ../ui/input, ../ui/form: Komponenty UI (Shadcn/ui).
 * @sideEffects
 * - Modyfikuje stan komponentu (isLoading, isSuccess, serverError, finalToken, debugInfo).
 * - Odczytuje i potencjalnie usuwa dane z `localStorage` (`reset_password_token`).
 * - Modyfikuje URL przeglądarki (`window.location.hash`, `window.history.replaceState`).
 * - Wysyła żądanie POST do `/api/auth/reset-password`.
 * - W przypadku sukcesu przekierowuje użytkownika (`window.location.href`).
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [finalToken, setFinalToken] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  /**
   * Funkcja pomocnicza do logowania debugowych informacji do konsoli i stanu komponentu.
   *
   * @param {string} message - Wiadomość do zalogowania.
   */
  const logDebug = (message: string) => {
    console.log(message);
    setDebugInfo((prev) => prev + message + "\n");
  };

  /**
   * Efekt uboczny uruchamiany przy pierwszym renderowaniu komponentu.
   * Odpowiada za próbę wyodrębnienia tokenu resetowania hasła z różnych źródeł:
   * 1. Propsy komponentu (`token`).
   * 2. `localStorage` (klucz `reset_password_token`).
   * 3. Hash URL (`#access_token=...`).
   * 4. Query params URL (`?token=...` lub `?code=...`).
   * Znaleziony token jest zapisywany w stanie `finalToken`. W przypadku znalezienia
   * tokenu w hash URL lub localStorage, token jest odpowiednio czyszczony z tych źródeł
   * dla bezpieczeństwa.
   *
   * @dependencies [token] - Efekt reaguje na zmianę wartości tokenu przekazanego w propsach.
   * @sideEffects
   * - Odczytuje `window.location.href`, `window.location.hash`, `window.location.search`.
   * - Odczytuje i usuwa element z `localStorage`.
   * - Modyfikuje `window.history.replaceState` w celu wyczyszczenia hasha URL.
   * - Ustawia stan `finalToken` i `debugInfo`.
   */
  useEffect(() => {
    logDebug("ResetPasswordForm - rozpoczęcie wyciągania tokenu");
    logDebug(`URL: ${window.location.href}`);

    // Check all possible token sources
    const sources = {
      props: token && token.length > 0 ? token : null,
      localStorage:
        typeof window !== "undefined" && window.localStorage ? localStorage.getItem("reset_password_token") : null,
      hash:
        typeof window !== "undefined" && window.location.hash
          ? (() => {
              try {
                const hashValue = window.location.hash.substring(1);
                const params = new URLSearchParams(hashValue);
                return params.get("access_token");
              } catch (e) {
                console.error("Błąd podczas parsowania hash:", e);
                return null;
              }
            })()
          : null,
      query:
        typeof window !== "undefined" && window.location.search
          ? (() => {
              try {
                const params = new URLSearchParams(window.location.search);
                // First check for 'token' parameter
                const tokenParam = params.get("token");
                if (tokenParam) return tokenParam;

                // Then check for 'code' parameter which is what Supabase sends
                const codeParam = params.get("code");
                if (codeParam) {
                  logDebug(`Found 'code' parameter instead of 'token': ${codeParam}`);
                  return codeParam;
                }

                return null;
              } catch (e) {
                console.error("Błąd podczas parsowania search params:", e);
                return null;
              }
            })()
          : null,
    };

    // Log all token sources
    logDebug(`Token z props: ${sources.props ? `istnieje (${sources.props.length} znaków)` : "brak"}`);
    logDebug(
      `Token z localStorage: ${sources.localStorage ? `istnieje (${sources.localStorage.length} znaków)` : "brak"}`
    );
    logDebug(`Token z hash: ${sources.hash ? `istnieje (${sources.hash.length} znaków)` : "brak"}`);
    logDebug(`Token z query: ${sources.query ? `istnieje (${sources.query.length} znaków)` : "brak"}`);

    // Sprawdź czy jest token z propsów
    if (sources.props) {
      logDebug(`Używam tokenu z propsów, długość: ${sources.props.length}`);
      setFinalToken(sources.props);
      return;
    }

    // Sprawdź localStorage
    if (sources.localStorage) {
      logDebug(`Używam tokenu z localStorage, długość: ${sources.localStorage.length}`);
      setFinalToken(sources.localStorage);
      // Usuń token z localStorage po użyciu
      localStorage.removeItem("reset_password_token");
      return;
    }

    // Sprawdź URL hash
    if (sources.hash) {
      logDebug(`Używam tokenu z URL hash, długość: ${sources.hash.length}`);
      setFinalToken(sources.hash);
      // Wyczyść URL hash dla bezpieczeństwa
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname);
        logDebug("Wyczyszczono URL hash");
      }
      return;
    }

    // Sprawdź URL query params
    if (sources.query) {
      logDebug(`Używam tokenu z URL query params, długość: ${sources.query.length}`);
      setFinalToken(sources.query);
      return;
    }

    logDebug("Nie znaleziono tokenu w żadnym źródle");
  }, [token]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * Funkcja obsługująca wysyłanie formularza resetowania hasła.
   * Waliduje nowe hasło i potwierdzenie hasła przy użyciu `resetPasswordSchema`.
   * Sprawdza, czy dostępny jest token resetowania (`finalToken`).
   * Wysyła token i nowe hasło do endpointu API `/api/auth/reset-password`.
   * Przetwarza odpowiedź serwera, ustawia komunikaty o błędach lub sukcesie,
   * i zarządza stanem ładowania. W przypadku sukcesu wyświetla komunikat
   * lub przekierowuje użytkownika.
   *
   * @param {ResetPasswordFormValues} values - Zwalidowane dane z formularza (nowe hasło, potwierdzenie hasła).
   * @returns {Promise<void>} Promise, który rozwiązuje się po zakończeniu procesu wysyłania.
   * @throws {Error} Może rzucić błąd w przypadku problemów z siecią lub przetwarzaniem odpowiedzi (choć są one łapane wewnętrznie).
   * @sideEffects
   * - Ustawia stany `isLoading`, `isSuccess`, `serverError`.
   * - Wywołuje `fetch` do endpointu API `/api/auth/reset-password`.
   * - Wywołuje `form.reset()` w przypadku sukcesu.
   * - Może wywołać `window.location.href` w przypadku przekierowania z API.
   */
  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);
    setServerError(null);
    setIsSuccess(false);

    // Sprawdź czy mamy token resetowania
    if (!finalToken) {
      setServerError("Brak tokenu resetowania hasła. Spróbuj wygenerować nowy link do resetowania.");
      setIsLoading(false);
      return;
    }

    try {
      // Debug token value
      logDebug(`Token używany do resetowania: ${finalToken.substring(0, 10)}...`);
      logDebug(`Długość tokenu: ${finalToken.length}`);

      // Wywołanie endpointu API resetowania hasła
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: finalToken,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      // Log actual request
      logDebug(
        "Wysłane dane (token ukryty):" +
          JSON.stringify({
            token: `${finalToken.substring(0, 10)}... (${finalToken.length} znaków)`,
            password: "********",
            confirmPassword: "********",
          })
      );

      const data = await response.json();
      logDebug(`Odpowiedź API: ${JSON.stringify(data)}`);

      if (!response.ok) {
        setServerError(data.error || "Wystąpił błąd podczas resetowania hasła");
        return;
      }

      // Check if we need to redirect
      if (data.redirect) {
        logDebug(`Przekierowanie na: ${data.redirectTo || "/auth/login"}`);
        window.location.href = data.redirectTo || "/auth/login";
        return;
      }

      // Wyświetlenie komunikatu o sukcesie
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Błąd podczas resetowania hasła:", error);
      setServerError("Nie można połączyć się z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Resetowanie hasła</h1>
        <p className="text-sm text-muted-foreground">Wprowadź nowe hasło</p>
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" data-testid="server-error-message">
          {serverError}
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4" data-testid="reset-success-message">
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
            <p>Hasło zostało pomyślnie zmienione!</p>
          </div>
          <Button className="w-full" asChild>
            <a href="/auth/login" data-testid="go-to-login-button">
              Przejdź do logowania
            </a>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nowe hasło</FormLabel>
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
                  <FormLabel>Potwierdź nowe hasło</FormLabel>
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
              disabled={isLoading || !finalToken}
              data-testid="reset-password-button"
            >
              {isLoading ? "Resetowanie..." : "Zresetuj hasło"}
            </Button>

            {!finalToken && (
              <div className="mt-2 text-sm text-red-500 text-center" data-testid="no-token-error-message">
                Brak tokenu resetowania.{" "}
                <a href="/auth/forgot-password" className="underline" data-testid="generate-new-link">
                  Wygeneruj nowy link
                </a>
              </div>
            )}

            {import.meta.env.DEV && debugInfo && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap">
                <details>
                  <summary className="cursor-pointer">Debug info</summary>
                  {debugInfo}
                </details>
              </div>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}
