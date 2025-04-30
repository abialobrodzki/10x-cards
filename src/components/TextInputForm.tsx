import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface TextInputFormProps {
  onSubmit: (text: string) => Promise<void>;
  isGenerating: boolean;
}

const TextInputForm: React.FC<TextInputFormProps> = ({ onSubmit, isGenerating }) => {
  const [text, setText] = useState("");
  const [textError, setTextError] = useState<string | null>(null);
  const [charactersCount, setCharactersCount] = useState(0);
  const MIN_CHARS = 1000;
  const MAX_CHARS = 10000;

  useEffect(() => {
    setCharactersCount(text.length);
    validateText(text);
  }, [text]);

  const validateText = (inputText: string) => {
    if (inputText.length < MIN_CHARS) {
      setTextError(`Tekst jest zbyt krótki. Minimum to ${MIN_CHARS} znaków.`);
      return false;
    } else if (inputText.length > MAX_CHARS) {
      setTextError(`Tekst jest zbyt długi. Maksimum to ${MAX_CHARS} znaków.`);
      return false;
    } else {
      setTextError(null);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateText(text) || isGenerating) {
      return;
    }

    try {
      await onSubmit(text);
    } catch {
      // Error is handled by the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <label htmlFor="inputText" className="block text-sm font-medium text-gray-700">
          Wprowadź tekst edukacyjny (min. {MIN_CHARS}, max. {MAX_CHARS} znaków)
        </label>

        <div className="relative">
          <textarea
            id="inputText"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Wklej tutaj tekst z którego chcesz wygenerować fiszki..."
            className={`w-full min-h-[200px] p-4 border bg-white rounded-md shadow-sm focus:ring-2 focus:ring-primary focus:border-primary ${
              textError ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isGenerating}
            data-testid="text-input-textarea"
          />

          {text.length > 0 && !isGenerating && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 h-6 w-6 p-0"
              onClick={() => setText("")}
              aria-label="Wyczyść tekst"
              data-testid="clear-text-button"
            >
              <span className="sr-only">Wyczyść tekst</span>
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

        <div className="flex justify-between items-center">
          <div>
            {textError && (
              <p className="text-sm text-red-600" data-testid="text-input-error-message">
                {textError}
              </p>
            )}
          </div>
          <div>
            <p
              className={`text-sm ${
                charactersCount < MIN_CHARS || charactersCount > MAX_CHARS ? "text-red-600" : "text-gray-500"
              }`}
              data-testid="character-count"
            >
              {charactersCount} / {MAX_CHARS} znaków
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!!textError || isGenerating || text.length === 0}
          className="px-6 py-2"
          data-testid="generate-button"
        >
          {isGenerating ? "Generowanie..." : "Generuj fiszki"}
        </Button>
      </div>
    </form>
  );
};

export default TextInputForm;
