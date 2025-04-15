import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import type { FlashcardViewModel, FlashcardBaseData } from "../types/viewModels";

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardViewModel | null;
  onClose: () => void;
  onSave: (updatedFlashcard: FlashcardBaseData) => void;
}

const EditFlashcardModal: React.FC<EditFlashcardModalProps> = ({ isOpen, flashcard, onClose, onSave }) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [frontCharsCount, setFrontCharsCount] = useState(0);
  const [backCharsCount, setBackCharsCount] = useState(0);

  const MAX_CHARS = 500; // Maksymalna ilość znaków w polu

  useEffect(() => {
    if (flashcard && isOpen) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setFrontError(null);
      setBackError(null);
      setFrontCharsCount(flashcard.front.length);
      setBackCharsCount(flashcard.back.length);
    }
  }, [flashcard, isOpen]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!front.trim()) {
      setFrontError("Pole przodu fiszki nie może być puste");
      isValid = false;
    } else if (front.length > MAX_CHARS) {
      setFrontError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
      isValid = false;
    } else {
      setFrontError(null);
    }

    if (!back.trim()) {
      setBackError("Pole tyłu fiszki nie może być puste");
      isValid = false;
    } else if (back.length > MAX_CHARS) {
      setBackError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
      isValid = false;
    } else {
      setBackError(null);
    }

    return isValid;
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setFront(text);
    setFrontCharsCount(text.length);
    if (text.length > MAX_CHARS) {
      setFrontError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
    } else if (!text.trim()) {
      setFrontError("Pole przodu fiszki nie może być puste");
    } else {
      setFrontError(null);
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBack(text);
    setBackCharsCount(text.length);
    if (text.length > MAX_CHARS) {
      setBackError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
    } else if (!text.trim()) {
      setBackError("Pole tyłu fiszki nie może być puste");
    } else {
      setBackError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      front: front.trim(),
      back: back.trim(),
    });
  };

  if (!isOpen || !flashcard) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Edycja fiszki</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500" aria-label="Zamknij">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="front" className="block text-sm font-medium text-gray-700">
                  Przód fiszki
                </label>
                <span className={`text-xs ${frontCharsCount > MAX_CHARS ? "text-red-600" : "text-gray-500"}`}>
                  {frontCharsCount} / {MAX_CHARS}
                </span>
              </div>
              <textarea
                id="front"
                value={front}
                onChange={handleFrontChange}
                className={`w-full p-3 border rounded-md min-h-[100px] ${
                  frontError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {frontError && <p className="mt-1 text-sm text-red-600">{frontError}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="back" className="block text-sm font-medium text-gray-700">
                  Tył fiszki
                </label>
                <span className={`text-xs ${backCharsCount > MAX_CHARS ? "text-red-600" : "text-gray-500"}`}>
                  {backCharsCount} / {MAX_CHARS}
                </span>
              </div>
              <textarea
                id="back"
                value={back}
                onChange={handleBackChange}
                className={`w-full p-3 border rounded-md min-h-[100px] ${
                  backError ? "border-red-500" : "border-gray-300"
                }`}
              />
              {backError && <p className="mt-1 text-sm text-red-600">{backError}</p>}
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Anuluj
              </Button>
              <Button type="submit" disabled={!!frontError || !!backError}>
                Zapisz zmiany
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditFlashcardModal;
