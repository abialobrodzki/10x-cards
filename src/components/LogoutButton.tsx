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
        },
      });

      // Jeśli serwer przekierował lub operacja się powiodła, odświeżamy stronę
      if (response.ok || response.redirected) {
        window.location.href = response.redirected ? response.url : "/";
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Błąd podczas wylogowywania:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={isLoading} className="hover:text-destructive">
      {isLoading ? "Wylogowywanie..." : "Wyloguj"}
    </Button>
  );
}
