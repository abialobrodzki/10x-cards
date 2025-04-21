/* eslint-disable no-console */
/* eslint-env browser */
/* global URLSearchParams, localStorage, history, console */
// Skrypt do ekstrakcji tokenu z URL hash i zapisania go do localStorage
// Skrypt wykonuje się natychmiast po załadowaniu strony

console.log("[token-extractor] Inicjalizacja ekstrakcji tokenu");
console.log("[token-extractor] Pełny URL:", window.location.href);
console.log("[token-extractor] Hash:", window.location.hash);
console.log("[token-extractor] Search params:", window.location.search);

// Funkcja wykonująca się po załadowaniu DOM
document.addEventListener("DOMContentLoaded", function () {
  console.log("[token-extractor] DOM załadowany, rozpoczynam sprawdzanie hash URL");
  console.log("[token-extractor] Pełny URL po załadowaniu DOM:", window.location.href);

  let foundToken = false;

  // Najpierw sprawdź query params (code i token)
  if (window.location.search) {
    const searchParams = new URLSearchParams(window.location.search);

    // Sprawdź czy mamy parametr code (format Supabase)
    const codeParam = searchParams.get("code");
    if (codeParam) {
      console.log("[token-extractor] Znaleziono kod weryfikacyjny w query params:", codeParam.length, "znaków");
      localStorage.setItem("reset_password_token", codeParam);
      console.log("[token-extractor] Kod weryfikacyjny zapisany w localStorage");
      foundToken = true;
    }

    // Sprawdź czy mamy parametr token
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      console.log("[token-extractor] Znaleziono token w query params:", tokenParam.length, "znaków");
      localStorage.setItem("reset_password_token", tokenParam);
      console.log("[token-extractor] Token z query params zapisany w localStorage");
      foundToken = true;
    }
  }

  // Następnie sprawdź, czy w URL jest hash (jeśli jeszcze nie znaleźliśmy tokenu)
  if (!foundToken && window.location.hash) {
    const hashValue = window.location.hash.substring(1);
    console.log("[token-extractor] Znaleziono hash:", hashValue);
    console.log("[token-extractor] Długość hash:", hashValue.length);

    try {
      // Parsuj parametry URL
      const params = new URLSearchParams(hashValue);
      console.log("[token-extractor] Parametry z hash:", Array.from(params.entries()));

      const accessToken = params.get("access_token");
      console.log(
        "[token-extractor] Access token:",
        accessToken ? `znaleziony (${accessToken.length} znaków)` : "brak"
      );

      // Jeśli znaleziono access_token, zapisz go do localStorage
      if (accessToken) {
        console.log("[token-extractor] Znaleziono access_token, zapisuję do localStorage");
        localStorage.setItem("reset_password_token", accessToken);
        console.log("[token-extractor] Token zapisany w localStorage");
        foundToken = true;

        // Wyczyść fragment URL dla bezpieczeństwa
        if (history && history.replaceState) {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
          console.log("[token-extractor] URL hash wyczyszczony");
        }
      } else {
        console.log("[token-extractor] Nie znaleziono access_token w hash");

        // Sprawdź czy jest error_code=otp_expired i przekieruj jeśli tak
        const errorCode = params.get("error_code");
        if (errorCode === "otp_expired") {
          console.log("[token-extractor] Wykryto wygasły token (otp_expired), przekierowuję");
          window.location.href = "/auth/forgot-password?reason=expired";
        }
      }
    } catch (e) {
      console.error("[token-extractor] Błąd podczas parsowania hash URL:", e);
    }
  }

  // Sprawdź czy znaleźliśmy token i czy formularz jest załadowany
  if (foundToken) {
    const resetForm = document.querySelector("form");
    if (!resetForm) {
      console.log("[token-extractor] Formularz nie znaleziony, odświeżam stronę");
      window.location.reload();
    } else {
      console.log("[token-extractor] Formularz znaleziony, nie trzeba odświeżać strony");
    }
  } else {
    console.log("[token-extractor] Nie znaleziono tokenu w żadnym źródle");
  }
});
