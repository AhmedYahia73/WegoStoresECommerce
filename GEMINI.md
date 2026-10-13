# Project Architecture & Coding Rules (E-Commerce Multi-Tenancy)

Always follow these rules automatically across all conversations in this project:

## 1. Projects Structure
- **Central Project (`E:\ECommerce`)**:
  - Super Admin project managing central operations, tenants (`users`), subscription packages, payment methods, and global orders.
  - Central schema tables live in `src/models/central/` with each table in a separate file (`users.ts`, `packages.ts`, `paymentMethods.ts`, `admins.ts`, `orders.ts`).
  - Re-exported in `src/models/schema.ts`.
- **Sub-Admin Project (`E:\SubAdminECommerce`)**:
  - Tenant Multi-Tenancy project where each tenant has their own wildcard schema.
  - Subdomain resolution: extract `subdomain` from host (e.g. `ahmed.wego.com` -> `ahmed`), verify against central `users.subdomain`, throw error if not found, execute against `subdomain` wildcard schema if found.
  - Tenant schema tables live in `E:\SubAdminECommerce\src\models\tenant/` with each table in a separate file:
    `customers.ts` (includes `image` nullable), `categories.ts`, `brands.ts`, `discounts.ts`, `flashDiscounts.ts`, `popups.ts`, `warranties.ts`, `taxes.ts`, `roles.ts`, `permissions.ts`, `staff.ts`, `paymentMethods.ts`, `products.ts`, `attributes.ts`, `values.ts`, `productAttributes.ts`, `productValues.ts`, `cities.ts`, `zones.ts`, `addresses.ts`, `languages.ts`.
- Primary keys use `char("id", { length: 36 }).primaryKey().default(sql\`(UUID())\`)`.

## 2. CRUD & Folder Conventions (`controllers`, `validators`, `routes`)
- **Validators**: Place all Zod validation schemas in `src/validators/{role}/{element}.ts`.
- **Controllers**: Place CRUD controllers in `src/controllers/{role}/{element}.ts`.
- **Routes**: Place route definitions in `src/routes/{role}/{item}.ts` and mount them in `src/routes/{role}/index.ts`.
- **Route Middleware Pattern**: Always attach permission middleware, validation middleware, and `catchAsync` directly on the route.
- **Multilingual Fields (`name`, `description`)**:
  - Support active languages from `lang` table where `status = true`.
  - In add/edit: first language is required, others optional.
  - In fetch: client specifies `?lang=...`, fallback to first language if missing.
  - If `description` is nullable, key is optional.
- **Relational Lists Endpoint (`GET /{item}/lists`) (MANDATORY across all modules with relations)**:
  - Whenever a table has columns referencing other tables (Foreign Key relations needed at create/edit):
    - Create a dedicated `GET /lists` endpoint on that element router (e.g. `GET /products/lists`, `GET /addresses/lists`, `GET /staff/lists`, `GET /zones/lists`).
    - It must fetch and return all the tables related to this element at once as `{ [relatedTableName]: [{ id, name }] }`.
    - Every related item MUST have `{ id, name }`, where `name` is localized according to `?lang=...` (falling back to the first available language if missing).
    - Example for products (`GET /products/lists`):
      returns `{ categories: [{ id, name }], brands: [{ id, name }], discounts: [{ id, name }], flash_discounts: [{ id, name }], taxes: [{ id, name }], warranties: [{ id, name }] }`.
- **Address Google Maps Link**: Compute `map_url = "https://www.google.com/maps/search/?api=1&query=${lat},${lng}"` for addresses.

## 3. Image Service & Handling Rules (MANDATORY across all modules)
All image operations MUST use the centralized image service functions from `src/services/imageService.ts` (or `src/utils/handleImages.ts`) where the storage folder is `uploads`:
1. **On Create / Add**: `uploadImage(req, base64, "uploads")`
2. **On Update / Edit**: `updateImage(req, newBase64, "uploads", oldImageUrlOrPath)`
3. **On Delete / Remove**: `deleteImage(oldImageUrlOrPath)` BEFORE deleting the database record.

## 4. Multi-Tenant Schema Synchronization & Migration Rules
- **Canonical Table Definitions (`TENANT_TABLE_DEFINITIONS`)**:
  - Located in `src/services/tenantSchemaService.ts` in both projects.
  - Acts as the single source of truth for all 21 tenant tables.
  - Whenever any model, table, or column in `E:\SubAdminECommerce\src\models\tenant/` is added, modified, or removed:
    1. ALWAYS update `TENANT_TABLE_DEFINITIONS` in `src/services/tenantSchemaService.ts` in both projects.
    2. This guarantees that **new tenant schemas** created via `createTenantSchema(subdomain)` immediately receive the latest structure.
- **Migrating Existing Tenants (`npm run db:migrate:tenants`)**:
  - Whenever tenant models are updated, execute `npm run db:migrate:tenants`.
  - It inspects `INFORMATION_SCHEMA` across all registered tenants from central `users`:
    - Automatically creates any missing tables.
    - Automatically adds any missing columns via `ALTER TABLE ... ADD COLUMN ...`.
    - Preserves live user data without drop or data loss.
    - Seeds default initial data (languages `ar`, `en` and role `admin`) if missing.

## 5. Pagination Rules for All Fetch (`getAll`) Endpoints (MANDATORY across all modules)
- Every `getAll` endpoint (e.g. `getAllProducts`, `getAllCategories`, `getAllUsers`, etc.) MUST support pagination.
- Query parameters:
  - `page`: default `1`
  - `limit`: default `10`
  - `offset`: `(page - 1) * limit`
- Response structure MUST include a `pagination` object:
  ```json
  {
    "[element]": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
  ```
- Helper functions available in `src/utils/pagination.ts`: `getPaginationParams(req)` and `buildPaginationMeta(total, page, limit)`.
- Dropdown endpoints (`/select`, `/{element}/lists`) remain unpaginated to supply all available options for relational forms.
