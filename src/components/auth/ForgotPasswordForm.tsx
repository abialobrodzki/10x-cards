import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    setServerError(null);
    setIsSuccess(false);

    try {
      // Frontend implementation only - no actual API call yet
      // eslint-disable-next-line no-console
      console.log("Forgot password form values:", values);
      // In a real implementation, we would call the API endpoint here

      // Simulate API call timing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For now, just log success
      // eslint-disable-next-line no-console
      console.log("Password reset email sent");
      setIsSuccess(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Forgot password error:", error);
      setServerError("Wystąpił błąd podczas wysyłania linku resetującego hasło. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Odzyskiwanie hasła</h1>
        <p className="text-sm text-muted-foreground">Podaj adres email, na który wyślemy link do zresetowania hasła</p>
      </div>

      {serverError && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{serverError}</div>}

      {isSuccess ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
          <p>Link do resetowania hasła został wysłany na podany adres email.</p>
          <p className="mt-2">Sprawdź swoją skrzynkę odbiorczą i folder spam.</p>
        </div>
      ) : (
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>
          </form>
        </Form>
      )}

      <div className="text-center text-sm">
        <a href="/auth/login" className="text-primary hover:underline">
          Powrót do logowania
        </a>
      </div>
    </div>
  );
}
