# Project Architecture & Coding Rules (E-Commerce Multi-Tenancy)

Always follow these rules automatically across all conversations in this project:

## 1. Projects Structure
- **Central Project (`E:\ECommerce`)**:
  - Super Admin project managing central operations, tenants (`users`), subscription packages, payment methods, and global orders.
  - Central schema tables live in `src/models/central/` with each table in a separate file (`users.ts`, `packages.ts`, `paymentMethods.ts`, `admins.ts`, `orders.ts`).
  - Re-exported in `src/models/schema.ts`.
- **Sub-Admin Project (`E:\SubAdminECommerce`)**:
  - Tenant Multi-Tenancy project where each tenant has their own wildcard schema.
  - Tenant schema tables live in `E:\SubAdminECommerce\src\models\tenant/` with each table in a separate file:
    `customers.ts`, `categories.ts`, `brands.ts`, `discounts.ts`, `flashDiscounts.ts`, `popups.ts`, `warranties.ts`, `taxes.ts`, `roles.ts`, `permissions.ts`, `staff.ts`, `paymentMethods.ts`, `products.ts`, `attributes.ts`, `values.ts`, `productAttributes.ts`, `productValues.ts`, `cities.ts`, `zones.ts`, `addresses.ts`, `languages.ts`.
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
