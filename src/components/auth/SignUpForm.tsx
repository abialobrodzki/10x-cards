import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

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

type SignUpFormValues = z.infer<typeof signUpSchema>;

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

  async function onSubmit(values: SignUpFormValues) {
    setIsLoading(true);
    setServerError(null);
    setRegistrationSuccess(false);
    setRequiresEmailConfirmation(false);

    try {
      // Wywołanie endpointu API rejestracji
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      // Odświeżamy stronę w przypadku sukcesu (przekierowanie jest po stronie serwera)
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        // Obsługa błędów z API
        setServerError(data.error || "Wystąpił błąd podczas rejestracji");
      } else if (data.success) {
        // Obsługa pomyślnej rejestracji, która może wymagać weryfikacji emaila
        setRegistrationSuccess(true);
        if (data.requiresEmailConfirmation) {
          setRequiresEmailConfirmation(true);
        }
        form.reset();
      }
    } catch (error) {
      /* eslint-disable no-console */
      console.error("Błąd podczas rejestracji:", error);
      setServerError("Nie można połączyć się z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Rejestracja</h1>
        <p className="text-sm text-muted-foreground">Utwórz nowe konto, aby korzystać z aplikacji</p>
      </div>

      {serverError && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{serverError}</div>}

      {registrationSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Rejestracja zakończona pomyślnie!</p>
          {requiresEmailConfirmation && (
            <p className="mt-2">
              Na Twój adres email został wysłany link aktywacyjny. Sprawdź swoją skrzynkę pocztową i kliknij link, aby
              aktywować konto.
            </p>
          )}
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
                    <Input placeholder="nazwa@example.com" type="email" {...field} disabled={isLoading} />
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
                    <Input placeholder="********" type="password" {...field} disabled={isLoading} />
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
                    <Input placeholder="********" type="password" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Rejestracja..." : "Zarejestruj się"}
            </Button>
          </form>
        </Form>
      )}

      {!registrationSuccess && (
        <div className="text-center text-sm">
          Masz już konto?{" "}
          <a href="/auth/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      )}

      {registrationSuccess && requiresEmailConfirmation && (
        <div className="text-center">
          <Button asChild variant="outline" className="mt-4">
            <a href="/auth/login">Przejdź do strony logowania</a>
          </Button>
        </div>
      )}
    </div>
  );
}
