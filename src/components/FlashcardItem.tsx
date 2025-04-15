import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { FlashcardViewModel } from "../types/viewModels";

interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  index: number;
  onAccept: (index: number) => void;
  onEdit: (index: number) => void;
  onReject: (index: number) => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ flashcard, index, onAccept, onEdit, onReject }) => {
  const getStatusBadge = () => {
    if (flashcard.isAccepted) {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Zaakceptowana
          {flashcard.isEdited && " (edytowana)"}
        </div>
      );
    }

    if (flashcard.isRejected) {
      return (
        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Odrzucona
        </div>
      );
    }

    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Oczekująca
      </div>
    );
  };

  return (
    <Card
      className={`border ${
        flashcard.isAccepted
          ? "border-green-200 bg-green-50"
          : flashcard.isRejected
            ? "border-red-200 bg-red-50"
            : "border-gray-200"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:gap-6">
          {/* Front side */}
          <div className="flex-1 mb-4 md:mb-0">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Przód:</h3>
            <div className="p-3 bg-white rounded-md border border-gray-200 min-h-[100px]">{flashcard.front}</div>
          </div>

          {/* Back side */}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Tył:</h3>
            <div className="p-3 bg-white rounded-md border border-gray-200 min-h-[100px]">{flashcard.back}</div>
          </div>

          {/* Actions */}
          <div className="flex flex-row md:flex-col justify-end items-center space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="icon"
              className={`${flashcard.isAccepted ? "bg-green-100 text-green-700 border-green-300" : ""}`}
              onClick={() => onAccept(index)}
              disabled={flashcard.isAccepted}
              title="Akceptuj"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>

            <Button variant="outline" size="icon" onClick={() => onEdit(index)} title="Edytuj">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className={`${flashcard.isRejected ? "bg-red-100 text-red-700 border-red-300" : ""}`}
              onClick={() => onReject(index)}
              disabled={flashcard.isRejected}
              title="Odrzuć"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-4 flex justify-end">{getStatusBadge()}</div>
      </CardContent>
    </Card>
  );
};

export default FlashcardItem;
