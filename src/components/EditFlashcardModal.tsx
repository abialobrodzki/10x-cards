import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import type { FlashcardViewModel, FlashcardBaseData } from "../types/viewModels";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

  const MIN_CHARS = 3; // Minimalna ilość znaków
  const MAX_CHARS = 500; // Maksymalna ilość znaków w polu

  useEffect(() => {
    if (flashcard && isOpen) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setFrontError(null);
      setBackError(null);
      setFrontCharsCount(flashcard.front.length);
      setBackCharsCount(flashcard.back.length);
    } else if (!isOpen) {
      setFront("");
      setBack("");
      setFrontError(null);
      setBackError(null);
      setFrontCharsCount(0);
      setBackCharsCount(0);
    }
  }, [flashcard, isOpen]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!front.trim()) {
      setFrontError("Pole przodu fiszki nie może być puste");
      isValid = false;
    } else if (front.length < MIN_CHARS) {
      setFrontError(`Tekst jest za krótki. Minimum to ${MIN_CHARS} znaki.`);
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
    } else if (back.length < MIN_CHARS) {
      setBackError(`Tekst jest za krótki. Minimum to ${MIN_CHARS} znaki.`);
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
    if (!text.trim()) {
      setFrontError("Pole przodu fiszki nie może być puste");
    } else if (text.length < MIN_CHARS) {
      setFrontError(`Tekst jest za krótki. Minimum to ${MIN_CHARS} znaki.`);
    } else if (text.length > MAX_CHARS) {
      setFrontError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
    } else {
      setFrontError(null);
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setBack(text);
    setBackCharsCount(text.length);
    if (!text.trim()) {
      setBackError("Pole tyłu fiszki nie może być puste");
    } else if (text.length < MIN_CHARS) {
      setBackError(`Tekst jest za krótki. Minimum to ${MIN_CHARS} znaki.`);
    } else if (text.length > MAX_CHARS) {
      setBackError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
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
    onClose();
  };

  if (!isOpen || !flashcard) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px]" data-testid="edit-flashcard-modal">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Zmodyfikuj zawartość fiszki poniżej.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="front">Przód fiszki</Label>
              <span className={`text-xs ${frontCharsCount > MAX_CHARS ? "text-red-600" : "text-muted-foreground"}`}>
                {frontCharsCount} / {MAX_CHARS} znaków
              </span>
            </div>
            <div className="relative">
              <Textarea
                id="front"
                value={front}
                onChange={handleFrontChange}
                placeholder="Wpisz treść przodu fiszki..."
                className={`min-h-[100px] ${frontError ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/40" : ""}`}
                aria-invalid={!!frontError}
                data-testid="edit-flashcard-front-textarea"
              />
              {front.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => {
                    setFront("");
                    setFrontCharsCount(0);
                    setFrontError(null);
                  }}
                  aria-label="Wyczyść pole"
                  data-testid="clear-front-button"
                >
                  <span className="sr-only">Wyczyść pole</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}
            </div>
            {frontError && (
              <p className="text-sm text-destructive mt-1" data-testid="front-error-message">
                {frontError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="back">Tył fiszki</Label>
              <span className={`text-xs ${backCharsCount > MAX_CHARS ? "text-red-600" : "text-muted-foreground"}`}>
                {backCharsCount} / {MAX_CHARS} znaków
              </span>
            </div>
            <div className="relative">
              <Textarea
                id="back"
                value={back}
                onChange={handleBackChange}
                placeholder="Wpisz treść tyłu fiszki..."
                className={`min-h-[100px] ${backError ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/40" : ""}`}
                aria-invalid={!!backError}
                data-testid="edit-flashcard-back-textarea"
              />
              {back.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => {
                    setBack("");
                    setBackCharsCount(0);
                    setBackError(null);
                  }}
                  aria-label="Wyczyść pole"
                  data-testid="clear-back-button"
                >
                  <span className="sr-only">Wyczyść pole</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}
            </div>
            {backError && (
              <p className="text-sm text-destructive mt-1" data-testid="back-error-message">
                {backError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-edit-button">
              Anuluj
            </Button>
            <Button type="submit" disabled={!!frontError || !!backError} data-testid="save-edit-button">
              Zapisz
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardModal;
