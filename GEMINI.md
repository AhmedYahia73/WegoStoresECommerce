# Project Architecture & Coding Rules (E-Commerce Multi-Tenancy)

Always follow these rules automatically across all conversations in this project:

## 1. Database & Schema Structure (`src/models/`)
- **Multi-Tenancy Architecture**:
  - Central schema tables (Super Admin) live in `src/models/central/` with **each table in a separate file** (e.g., `users.ts`, `packages.ts`, `paymentMethods.ts`, `admins.ts`, `orders.ts`).
  - Sub-schemas (Tenant schemas) live in their dedicated folder inside `src/models/` with each table in a separate file.
  - All central/schema tables are re-exported in `src/models/schema.ts`.
- Primary keys use `char("id", { length: 36 }).primaryKey().default(sql\`(UUID())\`)`.

## 2. CRUD & Folder Conventions (`controllers`, `validators`, `routes`)
- **Validators**: Place all Zod validation schemas in `src/validators/{role}/{element}.ts`.
- **Controllers**: Place CRUD controllers in `src/controllers/{role}/{element}.ts`.
- **Routes**: Place route definitions in `src/routes/{role}/{item}.ts` and mount them in `src/routes/{role}/index.ts`.
- **Route Middleware Pattern**: Always attach permission middleware, validation middleware, and `catchAsync` directly on the route, e.g.:
  ```ts
  router.get("/", checkOnlyAdmin(), catchAsync(getAllItems));
  router.post("/", checkOnlyAdmin(), validate(createItemSchema), catchAsync(createItem));
  ```
- **Automatic Swagger from Zod**: `src/config/swagger.ts` automatically scans all Express routes and reads the Zod schema attached by `validate(schema)` to generate OpenAPI parameters (`params`, `query`) and `requestBody` (`body`) keys. Do not clutter route files with manual `@swagger` JSDoc blocks.
- **Relational Selection Endpoints**: Whenever a table has columns referencing another table (Foreign Key relation), create a selection API endpoint that fetches `{ id, name }` for the tables needed for dropdown/selection.

## 3. Image Upload / Update / Delete Service (`src/utils/handleImages.ts`)
Always use the standard functions in `src/utils/handleImages.ts` whenever any model has an image/icon field:
- **On Create**: Use `uploadImage(req, base64, folder)` — saves the image in `uploads/{folder}` and returns its URL string to store in the database.
- **On Update**: Use `updateImage(req, newBase64, folder, oldImageUrlOrPath)` — deletes the old image from `uploads` first (if it exists), saves the new image in `uploads/{folder}`, and returns the new URL string to store in the database.
- **On Delete**: Use `deleteImage(oldImageUrlOrPath)` — deletes the old image file from `uploads` before/when deleting the database record.
