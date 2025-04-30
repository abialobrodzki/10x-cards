import { useState, memo, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, TrashIcon, RefreshCwIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { FlashcardItemProps } from "./types";
import { formatDate } from "./utils/formatDate";

const MAX_VISIBLE_LENGTH = 150;

const FlashcardItem = ({ flashcard, onEdit, onDelete }: FlashcardItemProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const frontIsTruncated = flashcard.front.length > MAX_VISIBLE_LENGTH;
  const backIsTruncated = flashcard.back.length > MAX_VISIBLE_LENGTH;

  const getSourceBadge = useCallback(() => {
    switch (flashcard.source) {
      case "manual":
        return <Badge variant="outline">Ręcznie utworzona</Badge>;
      case "ai-full":
        return <Badge variant="secondary">AI</Badge>;
      case "ai-edited":
        return <Badge variant="secondary">AI (edytowana)</Badge>;
      default:
        return null;
    }
  }, [flashcard.source]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Zawijamy tekst z ograniczeniem długości
  const truncateText = (text: string) => {
    if (!text) return "";
    if (isExpanded || text.length <= MAX_VISIBLE_LENGTH) return text;
    return text.slice(0, MAX_VISIBLE_LENGTH) + "...";
  };

  return (
    <Card className="h-full flex flex-col" data-testid={`flashcard-item-${flashcard.id}`}>
      <CardContent className="pt-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="text-xs text-muted-foreground">{formatDate(flashcard.created_at)}</div>
          <div data-testid={`flashcard-source-badge-${flashcard.id}`}>{getSourceBadge()}</div>
        </div>

        <div
          className="relative min-h-[120px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsFlipped(!isFlipped);
            }
          }}
          tabIndex={0}
          role="button"
          aria-pressed={isFlipped}
          aria-label="Obróć fiszkę"
          data-testid={`flashcard-flip-area-${flashcard.id}`}
        >
          <div
            className={`absolute inset-0 transition-all duration-300 ease-in-out ${
              isFlipped ? "opacity-0 -rotate-y-180" : "opacity-100 rotate-y-0"
            }`}
            data-testid={`flashcard-front-side-${flashcard.id}`}
          >
            <h3 className="font-medium">Przód:</h3>
            <p className="mt-2 text-lg whitespace-pre-line" data-testid={`flashcard-front-text-${flashcard.id}`}>
              {truncateText(flashcard.front)}
            </p>
            {frontIsTruncated && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 p-0 h-6"
                onClick={toggleExpand}
                data-testid={`flashcard-front-expand-button-${flashcard.id}`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4 mr-1" /> Zwiń
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4 mr-1" /> Rozwiń
                  </>
                )}
              </Button>
            )}
          </div>

          <div
            className={`absolute inset-0 transition-all duration-300 ease-in-out ${
              isFlipped ? "opacity-100 rotate-y-0" : "opacity-0 rotate-y-180"
            }`}
            data-testid={`flashcard-back-side-${flashcard.id}`}
          >
            <h3 className="font-medium">Tył:</h3>
            <p className="mt-2 text-lg whitespace-pre-line" data-testid={`flashcard-back-text-${flashcard.id}`}>
              {truncateText(flashcard.back)}
            </p>
            {backIsTruncated && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 p-0 h-6"
                onClick={toggleExpand}
                data-testid={`flashcard-back-expand-button-${flashcard.id}`}
              >
                {isExpanded ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4 mr-1" /> Zwiń
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4 mr-1" /> Rozwiń
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          title="Obróć fiszkę"
          data-testid={`flashcard-flip-button-${flashcard.id}`}
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edytuj fiszkę"
            data-testid={`flashcard-edit-button-${flashcard.id}`}
          >
            <EditIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Usuń fiszkę"
            data-testid={`flashcard-delete-button-${flashcard.id}`}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default memo(FlashcardItem);
