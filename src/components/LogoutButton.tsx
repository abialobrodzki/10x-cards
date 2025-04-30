/* eslint-disable no-console */
import { useState } from "react";
import { Button } from "./ui/button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Ważne dla ciasteczek
      });

      console.log("Odpowiedź wylogowania:", response.status);

      if (response.ok) {
        try {
          const data = await response.json();
          console.log("Dane wylogowania:", data);

          if (data.redirectUrl) {
            // Przekierowanie do strony logowania
            window.location.href = data.redirectUrl;
          } else {
            // Domyślne przekierowanie do strony logowania
            window.location.href = "/auth/login";
          }
        } catch (e) {
          console.error("Błąd parsowania odpowiedzi:", e);
          // Domyślne przekierowanie
          window.location.href = "/auth/login";
        }
      } else if (response.redirected) {
        // Bezpośrednie przekierowanie
        window.location.href = response.url;
      } else {
        // W przypadku błędu, także przekieruj do logowania
        console.error("Błąd wylogowywania, przekierowuję do strony logowania");
        window.location.href = "/auth/login";
      }
    } catch (error) {
      console.error("Błąd podczas wylogowywania:", error);
      // W przypadku wyjątku, przekieruj do logowania
      window.location.href = "/auth/login";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={isLoading}
      className="hover:text-destructive"
      data-testid="logout-button"
    >
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
