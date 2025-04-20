/* eslint-disable no-console */
import { useState } from "react";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (response.ok) {
        try {
          const data = await response.json();
          console.log("Rejestracja pomyślna:", data);

          // Przekierowanie po udanej rejestracji
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          } else {
            // Domyślne przekierowanie do strony logowania
            window.location.href = "/login";
          }
        } catch (e) {
          console.error("Błąd podczas parsowania odpowiedzi:", e);
          // Domyślne przekierowanie nawet w przypadku błędu parsowania
          window.location.href = "/login";
        }
      } else if (response.redirected) {
        // Bezpośrednie przekierowanie
        window.location.href = response.url;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Nieudana rejestracja. Spróbuj ponownie.");
        console.error("Błąd rejestracji:", errorData);
      }
    } catch (error) {
      console.error("Wystąpił błąd podczas rejestracji:", error);
      setError("Wystąpił błąd podczas łączenia z serwerem. Spróbuj ponownie później.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Imię
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Potwierdź hasło
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full mt-1 px-3 py-2 border rounded-md"
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? "Rejestracja..." : "Zarejestruj się"}
      </button>
    </form>
  );
};

export { RegisterForm };
