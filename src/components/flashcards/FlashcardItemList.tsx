import { memo, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import type { FlashcardItemProps } from "./types";
import { formatDate } from "./utils/formatDate";
import { useState } from "react";

const MAX_VISIBLE_LENGTH = 150;

const FlashcardItemList = ({ flashcard, onEdit, onDelete }: FlashcardItemProps) => {
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
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">Przód:</h3>
              <div className="text-xs text-muted-foreground">{formatDate(flashcard.created_at)}</div>
            </div>
            <p className="whitespace-pre-line">{truncateText(flashcard.front)}</p>
            {frontIsTruncated && (
              <Button variant="ghost" size="sm" className="mt-1 p-0 h-6" onClick={toggleExpand}>
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

          <div className="w-px h-auto bg-border hidden md:block" />

          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">Tył:</h3>
              {getSourceBadge()}
            </div>
            <p className="whitespace-pre-line">{truncateText(flashcard.back)}</p>
            {backIsTruncated && (
              <Button variant="ghost" size="sm" className="mt-1 p-0 h-6" onClick={toggleExpand}>
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

      <CardFooter className="flex justify-end border-t p-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edytuj fiszkę"
        >
          <EditIcon className="h-4 w-4 mr-2" />
          Edytuj
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Usuń fiszkę"
          className="text-destructive hover:text-destructive"
        >
          <TrashIcon className="h-4 w-4 mr-2" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
};

export default memo(FlashcardItemList);
