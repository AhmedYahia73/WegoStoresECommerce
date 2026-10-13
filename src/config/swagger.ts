import express, { Express, Router } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// 1. Patch Express Router.use so sub-router mount paths are captured in Express 4 & 5
const routerProto = Object.getPrototypeOf(express.Router());
if (routerProto && !routerProto.__swaggerPatched) {
  const originalUse = routerProto.use;
  routerProto.use = function (this: any, ...args: any[]) {
    const stackLenBefore = this.stack ? this.stack.length : 0;
    const result = originalUse.apply(this, args);
    if (typeof args[0] === "string" && this.stack) {
      for (let i = stackLenBefore; i < this.stack.length; i++) {
        this.stack[i].__mountPath = args[0];
      }
    }
    return result;
  };
  routerProto.__swaggerPatched = true;
}

// 2. Convert a Zod schema node into an OpenAPI 3.0 schema object
function zodNodeToOpenApi(
  zodSchema: any,
  fieldName?: string
): { schema: Record<string, any>; isOptional: boolean } {
  if (!zodSchema || !zodSchema._def) {
    return { schema: { type: "string" }, isOptional: false };
  }

  const def = zodSchema._def;
  const typeName: string = def.typeName;

  if (typeName === "ZodEffects") {
    return zodNodeToOpenApi(def.schema, fieldName);
  }

  if (typeName === "ZodOptional") {
    const inner = zodNodeToOpenApi(def.innerType, fieldName);
    return { schema: inner.schema, isOptional: true };
  }

  if (typeName === "ZodDefault") {
    const inner = zodNodeToOpenApi(def.innerType, fieldName);
    const defaultVal =
      typeof def.defaultValue === "function" ? def.defaultValue() : undefined;
    return {
      schema: { ...inner.schema, ...(defaultVal !== undefined ? { default: defaultVal } : {}) },
      isOptional: true,
    };
  }

  if (typeName === "ZodNullable") {
    const inner = zodNodeToOpenApi(def.innerType, fieldName);
    return {
      schema: { ...inner.schema, nullable: true },
      isOptional: inner.isOptional,
    };
  }

  if (typeName === "ZodObject") {
    const shape = typeof def.shape === "function" ? def.shape() : def.shape || {};
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, propZod] of Object.entries(shape)) {
      const converted = zodNodeToOpenApi(propZod, key);
      properties[key] = converted.schema;
      if (!converted.isOptional) {
        required.push(key);
      }
    }

    return {
      schema: {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
      },
      isOptional: false,
    };
  }

  if (typeName === "ZodString") {
    const result: Record<string, any> = { type: "string" };
    const checks: any[] = def.checks || [];

    for (const check of checks) {
      if (check.kind === "email") {
        result.format = "email";
        result.example = "user@example.com";
      } else if (check.kind === "uuid") {
        result.format = "uuid";
        result.example = "550e8400-e29b-41d4-a716-446655440000";
      } else if (check.kind === "url") {
        result.format = "uri";
      } else if (check.kind === "datetime") {
        result.format = "date-time";
      } else if (check.kind === "min") {
        result.minLength = check.value;
      } else if (check.kind === "max") {
        result.maxLength = check.value;
      }
    }

    if (!result.example && fieldName) {
      const lower = fieldName.toLowerCase();
      if (lower.includes("password")) {
        result.format = "password";
        result.example = "secret123";
      } else if (lower.includes("icon") || lower.includes("image") || lower.includes("photo") || lower.includes("logo")) {
        result.example = "https://example.com/uploads/sample.png";
      } else if (lower.includes("phone")) {
        result.example = "+201012345678";
      } else if (lower.includes("subdomain")) {
        result.example = "my-store";
      } else if (lower === "name" || lower.endsWith("_name")) {
        result.example = "Sample Name";
      } else if (lower.includes("description")) {
        result.example = "Sample description";
      }
    }

    return { schema: result, isOptional: false };
  }

  if (typeName === "ZodNumber") {
    const checks: any[] = def.checks || [];
    const isInt = checks.some((c) => c.kind === "int");
    const result: Record<string, any> = { type: isInt ? "integer" : "number" };

    for (const check of checks) {
      if (check.kind === "min") result.minimum = check.value;
      if (check.kind === "max") result.maximum = check.value;
    }

    if (fieldName) {
      const lower = fieldName.toLowerCase();
      if (lower.includes("price") || lower.includes("total")) {
        result.example = 100.0;
      } else {
        result.example = 10;
      }
    }

    return { schema: result, isOptional: false };
  }

  if (typeName === "ZodBoolean") {
    return { schema: { type: "boolean", example: true }, isOptional: false };
  }

  if (typeName === "ZodEnum") {
    const values = def.values || [];
    return {
      schema: {
        type: "string",
        enum: values,
        ...(values[0] !== undefined ? { example: values[0] } : {}),
      },
      isOptional: false,
    };
  }

  if (typeName === "ZodNativeEnum") {
    const values = Object.values(def.values || {});
    return {
      schema: {
        type: "string",
        enum: values,
      },
      isOptional: false,
    };
  }

  if (typeName === "ZodArray") {
    const itemSchema = zodNodeToOpenApi(def.type, fieldName).schema;
    return {
      schema: {
        type: "array",
        items: itemSchema,
      },
      isOptional: false,
    };
  }

  if (typeName === "ZodUnion" || typeName === "ZodDiscriminatedUnion") {
    const options = (def.options || []).map(
      (opt: any) => zodNodeToOpenApi(opt, fieldName).schema
    );
    return {
      schema: { oneOf: options },
      isOptional: false,
    };
  }

  if (typeName === "ZodDate") {
    return {
      schema: { type: "string", format: "date-time" },
      isOptional: false,
    };
  }

  if (typeName === "ZodRecord") {
    return {
      schema: {
        type: "object",
        additionalProperties: zodNodeToOpenApi(def.valueType, fieldName).schema,
      },
      isOptional: false,
    };
  }

  return { schema: { type: "string" }, isOptional: false };
}

// Helper to format camelCase / snake_case into Title Case
function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Normalize path and convert Express `:param` into OpenAPI `{param}`
function normalizeOpenApiPath(fullPath: string): string {
  const cleaned = ("/" + fullPath)
    .replace(/\/+/g, "/")
    .replace(/\/$/, "");
  const finalPath = cleaned || "/";
  return finalPath.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}

// Derive tag name from path, e.g. `/api/super_admin/payment_methods` -> `Super Admin - Payment Methods`
function deriveTagFromPath(openApiPath: string): string {
  const segments = openApiPath
    .split("/")
    .filter((s) => s && s !== "api" && !s.startsWith("{"));
  if (segments.length >= 2) {
    return `${toTitleCase(segments[0])} - ${toTitleCase(segments[1])}`;
  }
  if (segments.length === 1) {
    return toTitleCase(segments[0]);
  }
  return "General";
}

// Traverse Express Router stack and build OpenAPI paths object automatically
function extractPathsFromRouter(
  router: any,
  prefix = "/api",
  paths: Record<string, any> = {}
): Record<string, any> {
  if (!router || !Array.isArray(router.stack)) {
    return paths;
  }

  for (const layer of router.stack) {
    if (layer.route) {
      const routePath = layer.route.path || "";
      const openApiPath = normalizeOpenApiPath(`${prefix}/${routePath}`);
      const methods = Object.keys(layer.route.methods || {}).filter(
        (m) => layer.route.methods[m] && m !== "_all"
      );
      const routeStack: any[] = layer.route.stack || [];

      // Look for validate(zodSchema) middleware and catchAsync(controller) on this route
      let zodSchema: any = null;
      let controllerName = "";

      for (const subLayer of routeStack) {
        const fn = subLayer.handle;
        if (fn && fn.__zodSchema) {
          zodSchema = fn.__zodSchema;
        }
        if (fn && fn.__controllerName) {
          controllerName = fn.__controllerName;
        } else if (fn && fn.name && fn.name !== "handler" && fn.name !== "wrapped" && fn.name !== "<anonymous>") {
          controllerName = fn.name;
        }
      }

      // Unwrap ZodEffects if root schema is wrapped
      let rootZod = zodSchema;
      while (rootZod && rootZod._def?.typeName === "ZodEffects") {
        rootZod = rootZod._def.schema;
      }
      const rootShape =
        rootZod && rootZod._def?.typeName === "ZodObject"
          ? typeof rootZod._def.shape === "function"
            ? rootZod._def.shape()
            : rootZod._def.shape
          : {};

      const bodyZod = rootShape?.body;
      const paramsZod = rootShape?.params;
      const queryZod = rootShape?.query;

      const parameters: any[] = [];
      const addedPathParams = new Set<string>();

      // 1. Extract path parameters from Zod `params` schema
      if (paramsZod) {
        const convertedParams = zodNodeToOpenApi(paramsZod).schema;
        const props = convertedParams.properties || {};
        for (const [paramName, paramSchema] of Object.entries(props)) {
          addedPathParams.add(paramName);
          parameters.push({
            in: "path",
            name: paramName,
            required: true,
            schema: paramSchema,
          });
        }
      }

      // Also ensure any `{param}` in the route path is documented even without a Zod params schema
      const pathParamMatches = openApiPath.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
      for (const match of pathParamMatches) {
        const paramName = match.slice(1, -1);
        if (!addedPathParams.has(paramName)) {
          parameters.push({
            in: "path",
            name: paramName,
            required: true,
            schema: { type: "string" },
          });
        }
      }

      // 2. Extract query parameters from Zod `query` schema
      if (queryZod) {
        const convertedQuery = zodNodeToOpenApi(queryZod).schema;
        const props = convertedQuery.properties || {};
        const reqList: string[] = convertedQuery.required || [];
        for (const [queryName, querySchema] of Object.entries(props)) {
          parameters.push({
            in: "query",
            name: queryName,
            required: reqList.includes(queryName),
            schema: querySchema,
          });
        }
      }

      // 3. Extract requestBody from Zod `body` schema
      let requestBody: any = undefined;
      if (bodyZod) {
        const convertedBody = zodNodeToOpenApi(bodyZod).schema;
        requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: convertedBody,
            },
          },
        };
      }

      const tag = deriveTagFromPath(openApiPath);

      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }

      for (const method of methods) {
        const summary = controllerName
          ? toTitleCase(controllerName)
          : `${method.toUpperCase()} ${openApiPath}`;

        paths[openApiPath][method] = {
          tags: [tag],
          summary,
          security: [{ bearerAuth: [] }],
          ...(parameters.length > 0 ? { parameters } : {}),
          ...(requestBody && ["post", "put", "patch"].includes(method)
            ? { requestBody }
            : {}),
          responses: {
            200: {
              description: "Successful operation",
            },
            201: {
              description: "Created successfully",
            },
            400: {
              description: "Validation / Bad Request Error",
            },
            401: {
              description: "Unauthorized",
            },
            403: {
              description: "Forbidden",
            },
            404: {
              description: "Not Found",
            },
          },
        };
      }
    } else if (layer.handle && Array.isArray(layer.handle.stack)) {
      // Mounted Sub-Router
      const mountSegment = layer.__mountPath || layer.path || "";
      const nextPrefix = `${prefix}/${mountSegment}`.replace(/\/+/g, "/");
      extractPathsFromRouter(layer.handle, nextPrefix, paths);
    }
  }

  return paths;
}

export const setupSwagger = (app: Express, apiRouter?: Router) => {
  const autoPaths = apiRouter ? extractPathsFromRouter(apiRouter, "/api") : {};

  const options: swaggerJSDoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "E-Commerce Multi-Tenancy API Documentation",
        version: "1.0.0",
        description:
          "API documentation automatically generated from Express Routes & Zod Validation Schemas",
      },
      servers: [
        {
          url: "http://localhost:3001",
          description: "Local Development Server",
        },
        {
          url: "https://salesbcknd.systego.net",
          description: "Production Server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      paths: autoPaths,
    },
    apis: [
      "./src/routes/**/*.ts",
      "./src/controllers/**/*.ts",
      "./dist/routes/**/*.js",
      "./dist/controllers/**/*.js",
    ],
  };

  const swaggerSpec: any = swaggerJSDoc(options);

  // Merge auto-detected Zod routes with any explicit JSDoc routes
  swaggerSpec.paths = {
    ...autoPaths,
    ...(swaggerSpec.paths || {}),
  };

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("📝 Swagger documentation is available at http://localhost:3001/api-docs");
};