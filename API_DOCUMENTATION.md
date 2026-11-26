# ECommerce (Central / Super Admin) — API Documentation

توثيق شامل لجميع الـ APIs في مشروع `ECommerce` (`E:\backend\ECommerce WegoStation\ECommerce`).

---

## 1. الإعدادات العامة (Base Info)

- **Default Port:** `3001` (`process.env.PORT || 3001`)
- **Base URL:** `http://localhost:3001/api`
- **Static Files (الملفات المرفوعة):** `http://localhost:3001/uploads/<filename>`
- **Swagger UI:** مفعّل تلقائياً عبر `setupSwagger(app, ApiRoute)` في `src/server.ts`.

### Headers الأساسية

| Header | القيمة / الوصف | مطلوب؟ |
|---|---|---|
| `Authorization` | `Bearer <jwt_token>` | مطلوب في جميع مسارات `/api/super_admin/*` ما عدا `/auth/login` |
| `Content-Type` | `application/json` (أو `multipart/form-data` في مسارات رفع الملفات) | حسب الـ endpoint |

### شكل الاستجابة الموحد (Standard Responses)

#### عند النجاح (Success)
```json
{
  "success": true,
  "data": { ... }
}
```

#### عند الخطأ (Error)
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error message",
    "details": "..."
  }
}
```

أكواد الأخطاء الشائعة:
- `400`: `BadRequest` أو `ZodError` (`message: "Validation failed"`, `details: [{ field, message }]`)
- `401`: `UnauthorizedError` (لا يوجد توكن / توكن غير صالح أو منتهي / بيانات دخول خاطئة)
- `403`: `ForbiddenError` (الحساب ليس Super Admin في جدول `admins`)
- `404`: `NotFound` (العنصر أو المسار غير موجود)
- `409`: `ConflictError` (بيانات مكررة مثل `email` / `subdomain` / `phone`)
- `413`: حجم الطلب أو الملف أكبر من المسموح

### Pagination (في جميع مسارات `GET /`)
- **Query Params:**
  - `page` (optional, default `1`, min `1`)
  - `limit` (optional, default `10`, min `1`)
- **Pagination Object في الـ Response:**
  ```json
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
  ```

### Localization (`?lang=`)
- في الجداول التي تحتوي حقولاً متعددة اللغات (مثل `packages.name`):
  - تمرير `?lang=ar` أو `?lang=en` يرجع النص حسب اللغة المطلوبة، مع الرجوع الافتراضي إلى `"ar"` ثم أول لغة متاحة.
  - يتم تحويل حقول الـ JSON تلقائياً إلى كائنات (`parseJsonIfNeeded` / MySQL `typeCast`) في القراءة والإنشاء والتعديل.

---

## 2. Health Check

### `GET /api/test`
- **الشرح:** اختبار سريع للتأكد من عمل السيرفر.
- **Headers:** لا يتطلب مصادقة.
- **Response (`200`):**
  ```json
  {
    "message": "API is working! notify token"
  }
  ```

---

## 3. Upload (`/api/upload`)

> لا تتطلب توكن مصادقة حالياً (حسب `src/routes/index.ts`). الحد الأقصى لحجم الملف `15MB`، وتُقبل الصور فقط (`image/*`).

### 3.1 `POST /api/upload`
- **الشرح:** رفع صورة واحدة وحفظها في `uploads/` وإرجاع رابطها المباشر.
- **Headers:** `Content-Type: multipart/form-data`
- **Body (`form-data`):**
  - `image` (`File`, required): ملف صورة (`image/*`).
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Image uploaded successfully",
      "url": "http://localhost:3001/uploads/550e8400-e29b-41d4-a716-446655440000.png",
      "filename": "550e8400-e29b-41d4-a716-446655440000.png"
    }
  }
  ```
- **Errors:** `400` إذا لم يُرفق ملف في `image` أو لم يكن الملف صورة.

### 3.2 `POST /api/upload/multiple`
- **الشرح:** رفع عدة صور دفعة واحدة (بحد أقصى `10` صور).
- **Headers:** `Content-Type: multipart/form-data`
- **Body (`form-data`):**
  - `images` (`File[]`, required, max `10`): ملفات صور (`image/*`).
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Images uploaded successfully",
      "urls": [
        "http://localhost:3001/uploads/uuid1.png",
        "http://localhost:3001/uploads/uuid2.jpg"
      ],
      "count": 2
    }
  }
  ```
- **Errors:** `400` إذا لم تُرفق أي صور.

---

## 4. Super Admin Auth (`/api/super_admin/auth`)

### 4.1 `POST /api/super_admin/auth/login`
- **الشرح:** تسجيل دخول السوبر أدمن من جدول `admins` والحصول على JWT Token.
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "admin@wegostores.com",
    "password": "password123"
  }
  ```
  - `email`: `string` (valid email, required)
  - `password`: `string` (min 6 chars, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Login successful",
      "token": "<jwt_token>",
      "admin": {
        "id": "uuid",
        "name": "Super Admin",
        "email": "admin@wegostores.com"
      }
    }
  }
  ```
- **Errors:** `400` (validation), `401` (`"Invalid email or password"`).

---

## 5. Admins (`/api/super_admin/admins`)

> جميع المسارات تتطلب `Authorization: Bearer <token>` (حساب `admin`).

### 5.1 `GET /api/super_admin/admins`
- **الشرح:** جلب قائمة الأدمنز مع Pagination.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page`, `limit`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "admins": [
        {
          "id": "uuid",
          "name": "Super Admin",
          "email": "admin@wegostores.com",
          "createdAt": "2026-01-01T00:00:00.000Z",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 5.2 `GET /api/super_admin/admins/:id`
- **الشرح:** جلب بيانات أدمن واحد عبر الـ `id`.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "admin": {
        "id": "uuid",
        "name": "Super Admin",
        "email": "admin@wegostores.com",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `400` (invalid uuid), `404` (`"Admin not found"`).

### 5.3 `POST /api/super_admin/admins`
- **الشرح:** إنشاء حساب سوبر أدمن جديد.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "Operations Manager",
    "email": "ops@wegostores.com",
    "password": "password123"
  }
  ```
  - `name`: `string` (min 1, required)
  - `email`: `string` (email, unique, required)
  - `password`: `string` (min 6, required)
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": { "message": "Admin created successfully" }
  }
  ```
- **Errors:** `400` (validation), `409` (`"Email already exists"`).

### 5.4 `PUT /api/super_admin/admins/:id`
- **الشرح:** تعديل بيانات أدمن.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Path Params:** `id` (`uuid`, required)
- **Body (all optional):**
  ```json
  {
    "name": "New Name",
    "email": "new@wegostores.com",
    "password": "newpassword123"
  }
  ```
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Admin updated successfully" }
  }
  ```
- **Errors:** `400`, `404`, `409` (`"Email already exists"`).

### 5.5 `DELETE /api/super_admin/admins/:id`
- **الشرح:** حذف أدمن.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Admin deleted successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"Admin not found"`).

---

## 6. Payment Methods (`/api/super_admin/payment_methods`)

> جميع المسارات تتطلب `Authorization: Bearer <token>`. يدعم رفع `icon` كصورة عبر `multipart/form-data` أو كرابط URL نصي.

### 6.1 `GET /api/super_admin/payment_methods`
- **الشرح:** جلب جميع طرق الدفع المركزية مع Pagination.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page`, `limit`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "paymentMethods": [
        {
          "id": "uuid",
          "name": "Visa & MasterCard",
          "icon": "http://localhost:3001/uploads/visa.png",
          "description": "الدفع الآمن عبر البطاقات البنكية",
          "status": true,
          "createdAt": "2026-01-01T00:00:00.000Z",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 6.2 `GET /api/super_admin/payment_methods/select`
- **الشرح:** جلب طرق الدفع المفعلة (`status = true`) بدون Pagination لاستخدامها في الـ Dropdowns.
- **Headers:** `Authorization: Bearer <token>`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "paymentMethods": [
        { "id": "uuid", "name": "Visa & MasterCard" }
      ]
    }
  }
  ```

### 6.3 `GET /api/super_admin/payment_methods/:id`
- **الشرح:** جلب طريقة دفع بالـ `id`.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "paymentMethod": {
        "id": "uuid",
        "name": "Visa & MasterCard",
        "icon": "http://localhost:3001/uploads/visa.png",
        "description": "...",
        "status": true,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `400`, `404` (`"Payment method not found"`).

### 6.4 `POST /api/super_admin/payment_methods`
- **الشرح:** إنشاء طريقة دفع جديدة (يقبل `multipart/form-data` لرفع صورة `icon` أو `application/json` برابط `icon`).
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` أو `application/json`
- **Body:**
  - `name` (`string`, min 1, required)
  - `icon` (`File` image/* أو `string` URL, required)
  - `description` (`string | null`, optional)
  - `status` (`boolean`, optional, default `true`)
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": { "message": "Payment method created successfully" }
  }
  ```

### 6.5 `PUT /api/super_admin/payment_methods/:id`
- **الشرح:** تعديل طريقة دفع (يحذف ملف الأيقونة القديم من `uploads/` تلقائياً عند تغيير `icon`).
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` أو `application/json`
- **Path Params:** `id` (`uuid`, required)
- **Body (all optional):** `name`, `icon`, `description`, `status`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Payment method updated successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"Payment method not found"`).

### 6.6 `DELETE /api/super_admin/payment_methods/:id`
- **الشرح:** حذف طريقة دفع وحذف ملف الأيقونة الفعلي من `uploads/`.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Payment method deleted successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"Payment method not found"`).

---

## 7. Packages (`/api/super_admin/packages`)

> جميع المسارات تتطلب `Authorization: Bearer <token>`.
> الحقول: `name` (JSON متعدد اللغات), `price`, `orders_from` (`int >= 0`), `orders_to` (`int >= orders_from` أو `null` لعدد غير محدود), `sort` (`int >= 0` — يتم الترتيب تصاعدياً `sort ASC` في جميع استعلامات الباقات).

### 7.1 `GET /api/super_admin/packages`
- **الشرح:** جلب جميع الباقات مرتبة تصاعدياً حسب `sort` مع Pagination وترجمة الاسم.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page`, `limit`, `lang` (optional, e.g. `ar` / `en`)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "packages": [
        {
          "id": "uuid",
          "name": "باقة المبتدئين",
          "names": { "ar": "باقة المبتدئين", "en": "Starter Package" },
          "price": "299.00",
          "orders_from": 0,
          "orders_to": 50,
          "sort": 1,
          "createdAt": "2026-01-01T00:00:00.000Z",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "pagination": { "total": 4, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 7.2 `GET /api/super_admin/packages/select`
- **الشرح:** جلب الباقات بدون Pagination مرتبة تصاعدياً حسب `sort` لاستخدامها في الـ Dropdowns.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "packages": [
        {
          "id": "uuid",
          "name": "VIP Enterprise Package",
          "price": "2499.00",
          "orders_from": 501,
          "orders_to": null,
          "sort": 4
        }
      ]
    }
  }
  ```

### 7.3 `GET /api/super_admin/packages/:id`
- **الشرح:** جلب باقة محددة بالـ `id`.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Query Params:** `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "package": {
        "id": "uuid",
        "name": "باقة المبتدئين",
        "names": { "ar": "باقة المبتدئين", "en": "Starter Package" },
        "price": "299.00",
        "orders_from": 0,
        "orders_to": 50,
        "sort": 1,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `400`, `404` (`"Package not found"`).

### 7.4 `POST /api/super_admin/packages`
- **الشرح:** إنشاء باقة جديدة.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": { "ar": "باقة الأعمال", "en": "Business Package" },
    "price": 999.00,
    "orders_from": 0,
    "orders_to": null,
    "sort": 1
  }
  ```
  - `name`: `Record<string, string>` (required, at least one non-empty language string)
  - `price`: `number >= 0` أو `string` بصيغة `^\d+(\.\d{1,2})?$` (required)
  - `orders_from`: `integer >= 0` (required)
  - `orders_to`: `integer >= 0` أو `null` (optional, default `null`؛ إذا كان رقم يجب أن يكون `>= orders_from`)
  - `sort`: `integer >= 0` (required)
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": { "message": "Package created successfully" }
  }
  ```

### 7.5 `PUT /api/super_admin/packages/:id`
- **الشرح:** تعديل باقة.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Path Params:** `id` (`uuid`, required)
- **Body (all optional):** `name`, `price`, `orders_from`, `orders_to` (`integer >= 0 | null`), `sort` (`integer >= 0`)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Package updated successfully" }
  }
  ```
- **Errors:** `400` (إذا كان `orders_to` غير `null` وأصغر من `orders_from`), `404` (`"Package not found"`).

### 7.6 `DELETE /api/super_admin/packages/:id`
- **الشرح:** حذف باقة.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Package deleted successfully" }
  }
  ```

### 7.7 `DELETE /api/super_admin/packages/bulk`
- **الشرح:** حذف مجموعة باقات دفعة واحدة.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "ids": ["uuid-1", "uuid-2"]
  }
  ```
  - `ids`: `string[]` (min 1 item, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "2 package(s) deleted successfully",
      "deletedCount": 2
    }
  }
  ```

---

## 8. Users / Tenants (`/api/super_admin/users`)

> جميع المسارات تتطلب `Authorization: Bearer <token>`.
> عند إنشاء User يتم إنشاء قاعدة بيانات الـ tenant (`subdomain`) تلقائياً؛ وعند تغيير `subdomain` يتم إعادة تسمية الـ schema؛ وعند الحذف يتم حذف الـ schema.
> عند تعيين أو تغيير `package_id` يتم نسخ `orders_from` و `orders_to` من الباقة تلقائياً وتعيين `start_date = today` و `end_date = today + 1 month`.

### 8.1 `GET /api/super_admin/users`
- **الشرح:** جلب جميع المستخدمين (التجار) مع Pagination وعدد طلباتهم من `orders`.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `page`, `limit`, `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        {
          "id": "uuid",
          "name": "Ahmed Store",
          "email": "ahmed@gmail.com",
          "subdomain": "ahmed",
          "phone": "123456789",
          "package_id": "uuid",
          "package_name": "الباقة الذهبية VIP",
          "package_names": { "ar": "الباقة الذهبية VIP", "en": "VIP Enterprise Package" },
          "orders_from": 501,
          "orders_to": null,
          "orders": 0,
          "wallet": "0.00",
          "start_date": "2026-01-01",
          "end_date": "2027-01-01",
          "orders_count": 1,
          "createdAt": "2026-01-01T00:00:00.000Z",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "pagination": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 8.2 `GET /api/super_admin/users/lists`
- **الشرح:** جلب القوائم المرتبطة بنموذج إضافة/تعديل اليوزر (الباقات المتاحة).
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "packages": [
        {
          "id": "uuid",
          "name": "باقة المبتدئين",
          "price": "299.00",
          "orders_from": 0,
          "orders_to": 50,
          "sort": 1
        }
      ]
    }
  }
  ```

### 8.3 `GET /api/super_admin/users/select`
- **الشرح:** جلب قائمة مختصرة باليوزرز (`id`, `name`, `phone`) للـ Dropdowns.
- **Headers:** `Authorization: Bearer <token>`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        { "id": "uuid", "name": "Ahmed Store", "phone": "123456789" }
      ]
    }
  }
  ```

### 8.4 `GET /api/super_admin/users/:id`
- **الشرح:** جلب بيانات يوزر محدد بالـ `id` مع عدد طلباته.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Query Params:** `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "uuid",
        "name": "Ahmed Store",
        "email": "ahmed@gmail.com",
        "subdomain": "ahmed",
        "phone": "123456789",
        "package_id": "uuid",
        "package_name": "الباقة الذهبية VIP",
        "package_names": { "ar": "الباقة الذهبية VIP", "en": "VIP Enterprise Package" },
        "orders_from": 501,
        "orders_to": null,
        "orders": 0,
        "wallet": "0.00",
        "start_date": "2026-01-01",
        "end_date": "2027-01-01",
        "orders_count": 1,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `400`, `404` (`"User not found"`).

### 8.5 `POST /api/super_admin/users`
- **الشرح:** إنشاء مستخدم (تاجر) جديد وإنشاء الـ tenant schema الخاصة به تلقائياً. *(حقول `orders_from`, `orders_to`, `orders` تُدار تلقائياً من الباقة والقيم الافتراضية ولا تُمرر في الـ Body.)*
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "Ahmed Store",
    "email": "ahmed@gmail.com",
    "subdomain": "ahmed",
    "phone": "01012345678",
    "password": "password123",
    "package_id": "uuid",
    "wallet": 0
  }
  ```
  - `name` (`string`, min 1, required)
  - `email` (`string`, email, unique, required)
  - `subdomain` (`string`, min 1, unique, required)
  - `phone` (`string`, min 1, unique, required)
  - `password` (`string`, min 6, required)
  - `package_id` (`uuid | null`, optional — عند تمريرها تُنسخ `orders_from`/`orders_to` من الباقة وتُحسب `start_date`/`end_date`)
  - `wallet` (`number >= 0` أو decimal string, optional, default `0`)
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": { "message": "User and tenant schema created successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"Selected package not found"`), `409` (`Email`/`Subdomain`/`Phone` already exists).

### 8.6 `PUT /api/super_admin/users/:id`
- **الشرح:** تعديل بيانات مستخدم (وعند تغيير `subdomain` يعيد تسمية الـ schema، وعند تمرير `package_id` يحدّث `orders_from`/`orders_to`/`start_date`/`end_date`، وعند تمرير `package_id: null` يصفرها. حقول `orders_from`, `orders_to`, `orders` تلقائية ولا تُمرر في الـ Body).
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Path Params:** `id` (`uuid`, required)
- **Body (all optional):** `name`, `email`, `subdomain`, `phone`, `password`, `package_id` (`uuid | null`), `wallet`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "User updated successfully" }
  }
  ```
- **Errors:** `400`, `404`, `409`.

### 8.7 `DELETE /api/super_admin/users/:id`
- **الشرح:** حذف مستخدم وحذف الـ tenant schema الخاصة به.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "User and tenant schema deleted successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"User not found"`).

---

## 9. User Orders — طلبات الباقات (`/api/super_admin/user_orders`)

> جميع المسارات تتطلب `Authorization: Bearer <token>`.
> عند الموافقة (`approve`) على الطلب، يتم ربط اليوزر بالباقة ونسخ `orders_from` و `orders_to` من الباقة مع تعيين `start_date = today` و `end_date = today + 1 month`.

### 9.1 `GET /api/super_admin/user_orders`
- **الشرح:** جلب جميع طلبات الباقات مع Pagination وفلاتر متعددة.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:**
  - `page`, `limit`
  - `lang` (optional)
  - `user_id` (optional, uuid)
  - `package_id` (optional, uuid)
  - `status` (optional: `pending` | `approve` | `reject`)
  - `from` (optional, date/ISO string — فلتر من تاريخ `createdAt`)
  - `to` (optional, date/ISO string — فلتر إلى نهاية يوم `createdAt`)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "user_orders": [
        {
          "id": "uuid",
          "price": "2499.00",
          "user_id": "uuid",
          "user_name": "Ahmed Store",
          "user_phone": "123456789",
          "package_id": "uuid",
          "package_name": "الباقة الذهبية VIP",
          "status": "pending",
          "reject_reason": null,
          "receipt": "http://localhost:3001/uploads/uuid.png",
          "createdAt": "2026-01-01T00:00:00.000Z",
          "updatedAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "pagination": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 9.2 `GET /api/super_admin/user_orders/lists`
- **الشرح:** جلب القوائم المطلوبة لإنشاء/فلترة طلبات الباقات (`users` و `packages`).
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:** `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        { "id": "uuid", "name": "Ahmed Store", "phone": "123456789" }
      ],
      "packages": [
        {
          "id": "uuid",
          "name": "باقة المبتدئين",
          "price": "299.00",
          "orders_from": 0,
          "orders_to": 50,
          "sort": 1
        }
      ]
    }
  }
  ```

### 9.3 `GET /api/super_admin/user_orders/:id`
- **الشرح:** جلب تفاصيل طلب باقة بالـ `id`.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Query Params:** `lang` (optional)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "user_order": {
        "id": "uuid",
        "price": "2499.00",
        "user_id": "uuid",
        "user_name": "Ahmed Store",
        "user_phone": "123456789",
        "package_id": "uuid",
        "package_name": "الباقة الذهبية VIP",
        "status": "pending",
        "reject_reason": null,
        "receipt": "http://localhost:3001/uploads/uuid.png",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `400`, `404` (`"Order not found"`).

### 9.4 `POST /api/super_admin/user_orders`
- **الشرح:** إنشاء طلب اشتراك باقة جديد بحالة `pending` (يدعم رفع إيصال `receipt` كملف صورة أو PDF عبر `multipart/form-data` أو كرابط نصي).
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` أو `application/json`
- **Body:**
  - `package_id` (`uuid`, required)
  - `user_id` (`uuid`, required)
  - `price` (`number` أو decimal string `^\d+(\.\d{1,2})?$`, required)
  - `receipt` (`File` image/* or `application/pdf`, أو `string` URL, optional/nullable)
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": { "message": "User order created successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"User not found"` أو `"Package not found"`).

### 9.5 `PATCH /api/super_admin/user_orders/:id/status`
- **الشرح:** الموافقة على الطلب (`approve`) وتفعيل اشتراك اليوزر، أو رفضه (`reject`) مع سبب الرفض.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Path Params:** `id` (`uuid`, required)
- **Body (Approve):**
  ```json
  {
    "status": "approve"
  }
  ```
- **Body (Reject):**
  ```json
  {
    "status": "reject",
    "reject_reason": "إيصال التحويل غير واضح"
  }
  ```
  - `status`: `"approve" | "reject"` (required)
  - `reject_reason`: `string` (required عند `status === "reject"`)
- **Response (`200` — Approve):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Order approved successfully and user subscription activated",
      "status": "approve",
      "subscription": {
        "package_id": "uuid",
        "orders_from": 501,
        "orders_to": null,
        "start_date": "2026-11-26",
        "end_date": "2026-12-26"
      }
    }
  }
  ```
- **Response (`200` — Reject):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Order rejected successfully",
      "status": "reject",
      "reject_reason": "إيصال التحويل غير واضح"
    }
  }
  ```
- **Errors:** `400`, `404` (`"Order not found"` أو `"Associated package not found"`).

### 9.6 `DELETE /api/super_admin/user_orders/:id`
- **الشرح:** حذف طلب باقة مع حذف ملف `receipt` من `uploads/` إن وجد.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Order deleted successfully" }
  }
  ```

### 9.7 `DELETE /api/super_admin/user_orders/bulk`
- **الشرح:** حذف عدة طلبات باقات دفعة واحدة مع حذف ملفات `receipt` المرتبطة بها.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "ids": ["uuid-1", "uuid-2"]
  }
  ```
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "2 order(s) deleted successfully",
      "deletedCount": 2
    }
  }
  ```

---

## 10. Wallet Orders — طلبات شحن المحفظة (`/api/super_admin/wallet_orders`)

> جميع المسارات تتطلب `Authorization: Bearer <token>`.
> عند الموافقة (`approve`) يتم التحقق أن الطلب لم يُعتمد مسبقاً، ثم يُضاف مبلغ `wallet` إلى رصيد اليوزر (`users.wallet += order.wallet`) داخل Transaction.

### 10.1 `GET /api/super_admin/wallet_orders`
- **الشرح:** جلب جميع طلبات شحن المحفظة مع Pagination وفلاتر.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params:**
  - `page`, `limit`
  - `user_id` (optional, uuid)
  - `status` (optional: `pending` | `approve` | `reject`)
  - `from` (optional, date/ISO string)
  - `to` (optional, date/ISO string)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "wallet_orders": [
        {
          "id": "uuid",
          "wallet": "500.00",
          "user_id": "uuid",
          "user_name": "Ahmed Store",
          "user_phone": "123456789",
          "status": "pending",
          "reject_reason": null,
          "receipt": "http://localhost:3001/uploads/uuid.pdf",
          "createdAt": "2026-11-26T10:00:00.000Z",
          "updatedAt": "2026-11-26T10:00:00.000Z"
        }
      ],
      "pagination": { "total": 2, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 10.2 `GET /api/super_admin/wallet_orders/lists`
- **الشرح:** جلب قائمة اليوزرز (`id`, `name`, `phone`) لنموذج إضافة/فلترة طلبات الشحن.
- **Headers:** `Authorization: Bearer <token>`
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "users": [
        { "id": "uuid", "name": "Ahmed Store", "phone": "123456789" }
      ]
    }
  }
  ```

### 10.3 `GET /api/super_admin/wallet_orders/:id`
- **الشرح:** جلب تفاصيل طلب شحن محفظة بالـ `id`.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "wallet_order": {
        "id": "uuid",
        "wallet": "500.00",
        "user_id": "uuid",
        "user_name": "Ahmed Store",
        "user_phone": "123456789",
        "status": "pending",
        "reject_reason": null,
        "receipt": "http://localhost:3001/uploads/uuid.pdf",
        "createdAt": "2026-11-26T10:00:00.000Z",
        "updatedAt": "2026-11-26T10:00:00.000Z"
      }
    }
  }
  ```
- **Errors:** `400`, `404` (`"Wallet order not found"`).

### 10.4 `POST /api/super_admin/wallet_orders`
- **الشرح:** إنشاء طلب شحن محفظة جديد بحالة `pending` مع إمكانية رفع ملف `receipt` (صورة أو PDF).
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` أو `application/json`
- **Body:**
  - `wallet` (`number > 0` أو decimal string `^\d+(\.\d{1,2})?$` وقيمته `> 0`, required)
  - `user_id` (`uuid`, required)
  - `receipt` (`File` image/* or `application/pdf`, أو `string` URL, optional/nullable)
- **Response (`201`):**
  ```json
  {
    "success": true,
    "data": { "message": "Wallet order created successfully" }
  }
  ```
- **Errors:** `400`, `404` (`"User not found"`).

### 10.5 `PATCH /api/super_admin/wallet_orders/:id/status`
- **الشرح:** اعتماد طلب شحن المحفظة (`approve`) لإضافة المبلغ إلى `users.wallet`، أو رفضه (`reject`) مع سبب الرفض.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Path Params:** `id` (`uuid`, required)
- **Body (Approve):**
  ```json
  {
    "status": "approve"
  }
  ```
- **Body (Reject):**
  ```json
  {
    "status": "reject",
    "reject_reason": "المبلغ غير مطابق للتحويل"
  }
  ```
- **Response (`200` — Approve):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Wallet order approved successfully and user wallet credited",
      "status": "approve",
      "added_wallet": "500.00",
      "user_wallet": "500.00"
    }
  }
  ```
- **Response (`200` — Reject):**
  ```json
  {
    "success": true,
    "data": {
      "message": "Wallet order rejected successfully",
      "status": "reject",
      "reject_reason": "المبلغ غير مطابق للتحويل"
    }
  }
  ```
- **Errors:** `400` (`"Wallet order is already approved"` أو نقص `reject_reason`), `404` (`"Wallet order not found"`).

### 10.6 `DELETE /api/super_admin/wallet_orders/:id`
- **الشرح:** حذف طلب شحن محفظة مع حذف ملف `receipt` من `uploads/` إن وجد.
- **Headers:** `Authorization: Bearer <token>`
- **Path Params:** `id` (`uuid`, required)
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": { "message": "Wallet order deleted successfully" }
  }
  ```

### 10.7 `DELETE /api/super_admin/wallet_orders/bulk`
- **الشرح:** حذف عدة طلبات شحن محفظة دفعة واحدة مع حذف ملفات `receipt` المرتبطة بها.
- **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body:**
  ```json
  {
    "ids": ["uuid-1", "uuid-2"]
  }
  ```
- **Response (`200`):**
  ```json
  {
    "success": true,
    "data": {
      "message": "2 wallet order(s) deleted successfully",
      "deletedCount": 2
    }
  }
  ```
