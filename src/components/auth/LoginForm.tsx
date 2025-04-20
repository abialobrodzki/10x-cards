/* eslint-disable no-console */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);
    console.log("Rozpoczynam proces logowania...");

    try {
      console.log("Wysyłam zapytanie do /api/auth/login");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include", // Ważne dla ciasteczek
      });

      console.log("Otrzymałem odpowiedź, status:", response.status);
      const data = await response.json();
      console.log("Login response data:", data);

      if (response.ok && data.success) {
        console.log("Logowanie udane, przekierowuję do:", data.redirectUrl);

        // Małe opóźnienie, aby upewnić się, że ciasteczka zostały zapisane
        setTimeout(() => {
          if (data.redirectUrl) {
            // Przekierowanie do podanego URL
            window.location.href = data.redirectUrl;
          } else {
            // Domyślne przekierowanie, jeśli redirectUrl nie jest dostępny
            console.log("Brak redirectUrl, przekierowuję do domyślnej ścieżki");
            window.location.href = "/generate";
          }
        }, 500);
      } else {
        // Obsługa błędów z API
        console.error("Błąd podczas logowania:", data.error);
        setServerError(data.error || "Wystąpił nieznany błąd podczas logowania");
      }
    } catch (err) {
      console.error("Login error:", err);
      setServerError("Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.");
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

      {serverError && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{serverError}</div>}

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

          <div className="text-right text-sm">
            <a href="/auth/forgot-password" className="text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Nie masz jeszcze konta?{" "}
        <a href="/auth/register" className="text-primary hover:underline">
          Zarejestruj się
        </a>
      </div>
    </div>
  );
}
