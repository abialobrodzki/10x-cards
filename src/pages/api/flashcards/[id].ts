import { z } from "zod";
import type { APIContext } from "astro";
import type { NotFoundErrorResponseDto, ValidationErrorResponseDto, UpdateFlashcardDto } from "../../../types";
import {
  getFlashcardByIdService,
  updateFlashcardService,
  deleteFlashcardService,
} from "../../../lib/services/flashcard.service";

export const prerender = false;

// Schema for validating URL parameters
const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

// Schema for validating PATCH request body (all fields optional)
const PatchFlashcardSchema = z.object({
  front: z.string().min(3).max(500).optional(),
  back: z.string().min(3).max(500).optional(),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
});

// Schema for validating PUT request body (all fields required)
const PutFlashcardSchema = z.object({
  front: z.string().min(3).max(500),
  back: z.string().min(3).max(500),
  source: z.enum(["ai-full", "ai-edited", "manual"]),
});

export async function GET({ params, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate parameters
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get flashcard by ID
    const flashcard = await getFlashcardByIdService(locals.supabase, locals.user.id, paramsResult.data.id);

    if (!flashcard) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return successful response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH({ params, request, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate parameters
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = PatchFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard data",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update flashcard
    const flashcardDto: UpdateFlashcardDto = validationResult.data;
    const updatedFlashcard = await updateFlashcardService(
      locals.supabase,
      locals.user.id,
      paramsResult.data.id,
      flashcardDto
    );

    if (!updatedFlashcard) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return successful response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT({ params, request, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate parameters
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body (stricter for PUT)
    const body = await request.json();
    const validationResult = PutFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard data",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update flashcard
    const flashcardDto: UpdateFlashcardDto = validationResult.data;
    const updatedFlashcard = await updateFlashcardService(
      locals.supabase,
      locals.user.id,
      paramsResult.data.id,
      flashcardDto
    );

    if (!updatedFlashcard) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return successful response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error updating flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE({ params, locals }: APIContext) {
  try {
    // Check authorization
    if (!locals.supabase || !locals.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate parameters
    const paramsResult = ParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      const errorResponse: ValidationErrorResponseDto = {
        error: "Invalid flashcard ID",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete flashcard
    const deleted = await deleteFlashcardService(locals.supabase, locals.user.id, paramsResult.data.id);

    if (!deleted) {
      const errorResponse: NotFoundErrorResponseDto = {
        error: "Flashcard not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return successful response (no content)
    return new Response(null, { status: 204 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting flashcard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
