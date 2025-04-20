import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie pasują",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);
    setServerError(null);
    setIsSuccess(false);

    try {
      // Frontend implementation only - no actual API call yet
      // eslint-disable-next-line no-console
      console.log("Reset password form values:", { ...values, token });
      // In a real implementation, we would call the API endpoint here

      // Simulate API call timing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // eslint-disable-next-line no-console
      console.log("Password reset successful");
      setIsSuccess(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Reset password error:", error);
      setServerError("Link resetujący hasło jest nieprawidłowy lub wygasł.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Ustaw nowe hasło</h1>
        <p className="text-sm text-muted-foreground">Wprowadź i potwierdź swoje nowe hasło</p>
      </div>

      {serverError && <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{serverError}</div>}

      {isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
            <p>Twoje hasło zostało pomyślnie zresetowane.</p>
            <p className="mt-2">Możesz teraz zalogować się używając nowego hasła.</p>
          </div>

          <Button className="w-full" asChild>
            <a href="/auth/login">Przejdź do logowania</a>
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
                  <FormLabel>Potwierdź nowe hasło</FormLabel>
                  <FormControl>
                    <Input placeholder="********" type="password" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Przetwarzanie..." : "Resetuj hasło"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
