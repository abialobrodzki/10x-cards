import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { FlashcardDto } from "@/types";

interface FlashcardExportButtonProps {
  flashcards: FlashcardDto[];
  isDisabled?: boolean;
}

const FlashcardExportButton = ({ flashcards, isDisabled = false }: FlashcardExportButtonProps) => {
  const handleExport = () => {
    if (flashcards.length === 0) return;

    // Przygotowanie danych w formacie CSV
    const headers = ["ID", "Przód", "Tył", "Źródło", "Data utworzenia"];

    const csvRows = [
      headers.join(","), // Nagłówki
      ...flashcards.map((card) => {
        // Escapowanie przecinków i cudzysłowów w contencie
        const front = `"${card.front.replace(/"/g, '""')}"`;
        const back = `"${card.back.replace(/"/g, '""')}"`;
        const created = new Date(card.created_at).toLocaleString();

        return [card.id, front, back, card.source, `"${created}"`].join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    // Tworzenie Blob i URL do pobrania
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Tworzenie linku do pobrania i symulacja kliknięcia
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `10xcards-export-${timestamp}.csv`);
    // Skip append/remove in test environment to avoid happy-dom issues with mock link
    if (import.meta.env.MODE !== "test") {
      document.body.appendChild(link);
    }
    link.click();

    // Czyszczenie
    if (import.meta.env.MODE !== "test") {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isDisabled || flashcards.length === 0}
      title={flashcards.length === 0 ? "Brak fiszek do eksportu" : "Eksportuj fiszki do CSV"}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      <span>Eksportuj CSV</span>
    </Button>
  );
};

export default memo(FlashcardExportButton);
