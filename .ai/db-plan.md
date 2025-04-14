# Schemat bazy danych - 10x-cards

## 1. Tabele

### 1.1. Tabela: auth.users
- **id**: UUID, klucz główny
- Tabela zarządzana przez system autoryzacji

---

### 1.2. Tabela: flashcards
- **id**: INT8, klucz główny, sekwencja
- **front**: VARCHAR, nie NULL
- **back**: VARCHAR, nie NULL
- **source**: VARCHAR, nie NULL
- **created_at**: TIMESTAMPTZ, nie NULL, domyślna wartość: now()
- **updated_at**: TIMESTAMPTZ, nie NULL, domyślna wartość: now()
- **generation_id**: INT8, opcjonalny, klucz obcy odnoszący się do generations(id)
- **user_id**: UUID, nie NULL, klucz obcy odnoszący się do auth.users(id)

**Relacje:**
- Każdy rekord w flashcards należy do jednego użytkownika (auth.users), relacja jeden-do-wielu.
- Opcjonalna relacja do konkretnej generacji (generations), relacja jeden-do-wielu.

**Indeksy:**
- Indeks na kolumnie user_id
- Indeks na kolumnie created_at
- Indeks na kolumnie generation_id

**Trigery:**
- Trigger typu BEFORE UPDATE do automatycznej aktualizacji pola updated_at

**Row Level Security (RLS):**
- Włączone zabezpieczenie RLS, z polityką umożliwiającą dostęp do wierszy tylko użytkownikowi, którego id odpowiada wartości w kolumnie user_id.

---

### 1.3. Tabela: generations
- **id**: INT8, klucz główny, sekwencja
- **user_id**: UUID, nie NULL, klucz obcy odnoszący się do auth.users(id)
- **model**: VARCHAR, nie NULL
- **generated_count**: INT4, nie NULL
- **accepted_unedited_count**: INT4, nie NULL
- **accepted_edited_count**: INT4, nie NULL
- **source_text_hash**: VARCHAR, nie NULL
- **source_text_length**: INT4, nie NULL
- **generation_duration**: INT4, nie NULL
- **created_at**: TIMESTAMPTZ, nie NULL, domyślna wartość: now()
- **updated_at**: TIMESTAMPTZ, nie NULL, domyślna wartość: now()

**Relacje:**
- Każdy rekord w generations jest powiązany z jednym użytkownikiem (auth.users), relacja jeden-do-wielu.
- Jedna generacja może być źródłem wielu rekordów, ale każdy rekord należy tylko do jednego użytkownika.

**Indeksy:**
- Indeks na kolumnie user_id
- Indeks na kolumnie created_at
- Indeks na kolumnie source_text_hash

---

### 1.4. Tabela: generation_error_logs
- **id**: INT8, klucz główny, sekwencja
- **user_id**: UUID, nie NULL, klucz obcy odnoszący się do auth.users(id)
- **model**: VARCHAR, nie NULL
- **source_text_hash**: VARCHAR, nie NULL
- **source_text_length**: INT4, nie NULL
- **error_code**: VARCHAR, nie NULL
- **error_message**: TEXT, nie NULL
- **created_at**: TIMESTAMPTZ, nie NULL, domyślna wartość: now()

**Relacje:**
- Każdy rekord w generation_error_logs jest powiązany z jednym użytkownikiem (auth.users), relacja jeden-do-wielu.

**Indeksy:**
- Indeks na kolumnie user_id
- Indeks na kolumnie created_at
- Indeks na kolumnie error_code

---

## 2. Relacje między tabelami

- **auth.users** (1) <-> (N) **flashcards** poprzez kolumnę user_id w tabeli flashcards.
- **auth.users** (1) <-> (N) **generations** poprzez kolumnę user_id w tabeli generations.
- **auth.users** (1) <-> (N) **generation_error_logs** poprzez kolumnę user_id w tabeli generation_error_logs.
- **generations** (1) <-> (N) **flashcards** poprzez kolumnę generation_id w tabeli flashcards.

---

## 3. Indeksy

- Tabela **flashcards**: indeksy na kolumnach user_id, created_at oraz generation_id.
- Tabela **generations**: indeksy na kolumnach user_id, created_at oraz source_text_hash.
- Tabela **generation_error_logs**: indeksy na kolumnach user_id, created_at oraz error_code.

---

## 4. Zasady PostgreSQL (RLS & Trigery)

**Row Level Security (RLS):**
- W tabelach flashcards, generations oraz generation_error_logs włączono RLS.
- Polityka: dostęp do wiersza mają tylko użytkownicy, których id odpowiada wartości w kolumnie user_id.

**Trigery:**
- Trigery wykonujące automatyczną aktualizację pola updated_at przy każdej modyfikacji rekordów w tabelach flashcards i generations. 