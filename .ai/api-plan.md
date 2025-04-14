# REST API Plan

## 1. Resources

- **Users**: Represents the system users (managed via auth.users in Supabase). Although authentication is handled externally, user identification is critical for resource access.
- **Flashcards**: Corresponds to the flashcards table. Contains fields such as id, front, back, source, created_at, updated_at, generation_id, and user_id. Enforced validations ensure that front and back are non-null strings with a length between 100 and 500 characters. Additionally, the source field represents the flashcard source type and must be one of: 'ai-full', 'ai-edited', or 'manual'.
- **Generations**: Maps to the generations table. Stores metadata regarding auto-generated flashcards including model details (stored internally, not selectable by users), generation counts, source text metrics, and timestamps.
- **Generation Error Logs**: Relates to the generation_error_logs table. Records any errors that occur during the flashcard generation process, including error codes and messages.

## 2. Endpoints

### 2.1. Authentication Note

**Authentication will be implemented in a later phase of the project.** 

For the initial MVP implementation, all endpoints will operate without requiring user authentication. This allows for faster development and testing of core functionalities. In future iterations, authentication will be added using Supabase's auth system.

For endpoints that reference user-specific data, a temporary system-assigned user ID will be used to maintain data separation during development.

### 2.2. Flashcards Endpoints

- **GET /flashcards**
  - *Description*: Retrieve a paginated list of flashcards.
  - *Query Parameters*: 
    - `page` (number)
    - `pageSize` (number)
    - `sortBy` (e.g., created_at)
    - Optional filters (e.g., by generation_id, source type)
  - *Response*: 
    ```json
    { "flashcards": [ { "id": 1, "front": "string", "back": "string", "source": "string", "created_at": "timestamp", "updated_at": "timestamp", "generation_id": "number" } ], "total": number }
    ```
  - *Success Code*: 200 OK

- **GET /flashcards/{id}**
  - *Description*: Retrieve details of a specific flashcard.
  - *Response*: 
    ```json
    { "id": 1, "front": "string", "back": "string", "source": "string", "created_at": "timestamp", "updated_at": "timestamp", "generation_id": "number" }
    ```
  - *Success Code*: 200 OK
  - *Error Codes*: 404 Not Found

- **POST /flashcards**
  - *Description*: Create one or more flashcards manually. This endpoint accepts either a single flashcard object or an array of flashcards, and is used during both manual creation and AI-generated flashcard creation (including both complete and edited flashcards).
  - *Request Payload*: 
    - *Single flashcard example*:
    ```json
    { "front": "string", "back": "string", "source": "string", "generation_id": "number (optional)" }
    ```
    - *Multiple flashcards example*:
    ```json
    { "flashcards": [ { "front": "string", "back": "string", "source": "string", "generation_id": "number (optional)" } ] }
    ```
  - *Response*: Created flashcard object or array of flashcard objects with all details.
  - *Success Code*: 201 Created
  - *Error Codes*: 400 Bad Request

- **PUT /flashcards/{id}** or **PATCH /flashcards/{id}**
  - *Description*: Update an existing flashcard. Partial updates can be supported with PATCH.
  - *Request Payload*: Fields to update (e.g., front, back, source).
  - *Response*: Updated flashcard details.
  - *Success Code*: 200 OK
  - *Error Codes*: 400 Bad Request, 404 Not Found

- **DELETE /flashcards/{id}**
  - *Description*: Delete a flashcard.
  - *Success Code*: 204 No Content
  - *Error Codes*: 404 Not Found

### 2.3. Generations Endpoints

These endpoints handle the auto-generation workflow of flashcards using an external LLM API.

- **POST /generations/generate**
  - *Description*: Accepts user-provided text (between 1000 and 10000 characters) to trigger automatic flashcard generation. The system automatically selects the AI model used for generation.
  - *Request Payload*: 
    ```json
    { "text": "string" }
    ```
  - *Process*: 
    - Validate text length.
    - Create a new generation record.
    - Initiate an LLM API call to generate flashcard suggestions using the system-selected model.
    - On success, return the list of generated flashcards along with generation metadata.
  - *Response*: 
    ```json
    {
      "generation": { "id": 1, "generated_count": number, "accepted_unedited_count": number, "accepted_edited_count": number, "created_at": "timestamp", "updated_at": "timestamp", "model": "string" },
      "flashcards": [ { "front": "string", "back": "string", "source": "ai-full" } ]
    }
    ```
    *Note*: The `model` field is included in the response for informational purposes only.
  - *Success Code*: 200 OK
  - *Error Codes*: 400 Bad Request, 500 Internal Server Error

- **GET /generations**
  - *Description*: Retrieve a paginated list of generation records.
  - *Query Parameters*: 
    - `page` (number)
    - `pageSize` (number)
    - `sortBy` (e.g., created_at)
  - *Response*: 
    ```json
    { "generations": [ { "id": 1, "generated_count": number, "accepted_unedited_count": number, "accepted_edited_count": number, "created_at": "timestamp", "updated_at": "timestamp", "model": "string", "source_text_hash": "string", "source_text_length": number, "generation_duration": number } ], "total": number }
    ```
  - *Success Code*: 200 OK

- **GET /generations/{id}**
  - *Description*: Get details for a specific generation record, optionally including associated flashcards.
  - *Query Parameters*: 
    - `include_flashcards` (boolean, default: false) - Whether to include associated flashcards in the response
  - *Response*: 
    ```json
    { 
      "generation": { "id": 1, "generated_count": number, "accepted_unedited_count": number, "accepted_edited_count": number, "created_at": "timestamp", "updated_at": "timestamp", "model": "string", "source_text_hash": "string", "source_text_length": number, "generation_duration": number },
      "flashcards": [ { "id": 1, "front": "string", "back": "string", "source": "string", "created_at": "timestamp", "updated_at": "timestamp" } ]
    }
    ```
  - *Success Code*: 200 OK
  - *Error Codes*: 404 Not Found

- **POST /generations/{id}/accept-flashcards**
  - *Description*: Accept and store AI-generated flashcards, either as presented or after editing.
  - *Request Payload*: 
    ```json
    { 
      "flashcards": [
        { "front": "string", "back": "string", "source": "ai-full" },
        { "front": "string", "back": "string", "source": "ai-edited" }
      ]
    }
    ```
  - *Response*: 
    ```json
    {
      "generation": { "id": 1, "accepted_unedited_count": number, "accepted_edited_count": number, "updated_at": "timestamp" },
      "flashcards": [ { "id": 1, "front": "string", "back": "string", "source": "string", "created_at": "timestamp" } ]
    }
    ```
  - *Success Code*: 201 Created
  - *Error Codes*: 400 Bad Request, 404 Not Found

### 2.4. Generation Error Logs Endpoints

- **GET /generation-error-logs**
  - *Description*: Retrieve a list of error logs related to flashcard generation for debugging purposes.
  - *Query Parameters*: 
    - `page` (number)
    - `pageSize` (number) 
    - `error_code` (optional filter by error code)
  - *Response*: 
    ```json
    { "logs": [ { "id": 1, "error_code": "string", "error_message": "string", "created_at": "timestamp", "model": "string", "source_text_hash": "string", "source_text_length": number } ], "total": number }
    ```
  - *Success Code*: 200 OK

### 2.5. Study Session Endpoints

These endpoints support the spaced repetition learning algorithm integration as mentioned in the PRD.

- **GET /study-session**
  - *Description*: Retrieve flashcards that are scheduled for a study session based on a spaced repetition algorithm. The system uses an external ready-made spaced repetition algorithm as specified in the PRD.
  - *Query Parameters*:
    - `limit` (number) - Number of flashcards to retrieve for the session (default: 20)
  - *Response*: 
    ```json
    { "flashcards": [ { "id": 1, "front": "string", "back": "string", "source": "string", "next_review": "timestamp" } ] }
    ```
  - *Success Code*: 200 OK

- **POST /study-session/review**
  - *Description*: Submit a review result for a flashcard after studying it, updating its scheduling based on the spaced repetition algorithm.
  - *Request Payload*: 
    ```json
    { "flashcard_id": 1, "quality": number }
    ```
    *Note*: The quality parameter should be an integer from 0-5 indicating how well the user remembered the flashcard (0=failed, 5=perfect recall), following the selected spaced repetition algorithm's rating scale.
  - *Response*: 
    ```json
    { 
      "flashcard_id": 1, 
      "next_review": "timestamp" 
    }
    ```
  - *Success Code*: 200 OK
  - *Error Codes*: 400 Bad Request, 404 Not Found

## 3. Authorization

**Authorization mechanisms will be implemented in a later phase of the project.**

For the initial MVP implementation, the system will operate without user-specific access controls. In future iterations, the following will be implemented:

- JWT-based authentication integrated with Supabase's auth system
- Row Level Security (RLS) at the database level
- Rate limiting for API endpoints, especially those interfacing with LLM services

## 4. Validation and Business Logic

- **Input Validation**:
  - Flashcards: Ensure `front` and `back` are non-null strings with a length between 100 and 500 characters, and `source` is a non-null string whose value is restricted to one of the allowed types: 'ai-full', 'ai-edited', or 'manual'.
  - Generation: Validate that the provided text is within the 1000 to 10000 character range.
  - Study Session Review: The quality rating must be an integer between 0 and 5.

- **Business Logic**:
  - When auto-generating flashcards (/generations/generate), trigger an external LLM API call using a system-selected AI model. In the event of an error, log details in the `generation_error_logs` table and return an appropriate error message.
  - The system selects the appropriate LLM model via openrouter.ai and stores the model name internally for tracking and metrics purposes, but does not expose model selection to the user.
  - Track generation metadata including counts for generated flashcards and accepted variants (unedited and edited), as well as performance metrics like source_text_hash, source_text_length, and generation_duration as specified in the database schema.
  - The spaced repetition algorithm (using an external ready-made implementation as specified in the PRD) calculates the next review date based on the user's quality rating and the flashcard's review history.
  - Use pagination, filtering, and sorting for list endpoints to enhance performance and usability.
  - Error handling with detailed messages and proper HTTP status codes (400, 404, 500) is enforced throughout the API.

## 5. Summary

- This API plan addresses key resources derived from the database schema and core business functionalities outlined in the PRD.
- CRUD endpoints are provided for flashcards and generation records, with additional endpoints for error logging, and study sessions.
- Authentication and authorization mechanisms will be implemented in future phases.
- The system automatically selects the appropriate AI model for flashcard generation without user intervention, but stores model information for internal tracking and metrics.
- The design leverages the modern tech stack (Astro 5, TypeScript 5, React 19, Tailwind 4, Shadcn/ui, and Supabase), ensuring a robust, scalable, and maintainable system.
- Support for metrics collection is built into the generations table, allowing for analysis of flashcard generation quality as specified in the PRD.
