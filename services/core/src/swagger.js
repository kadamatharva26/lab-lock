// Hand-written OpenAPI 3.0 spec for the LabLock API surface.
// Mounted at /docs.

const spec = {
  openapi: "3.0.3",
  info: {
    title: "LabLock API",
    version: "1.0.0",
    description:
      "Campus lab equipment booking with three-way conflict detection. Auth endpoints are served by auth-service (proxied via gateway under `/auth`). Domain endpoints below are served by core-service (proxied via gateway under `/api`).",
  },
  servers: [
    { url: "http://localhost:4000", description: "Gateway (recommended)" },
    { url: "http://localhost:4002", description: "core-service direct" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ErrorEnvelope: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: {},
            },
          },
        },
      },
      Equipment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          category: { type: "string" },
          condition: { type: "string", enum: ["good", "needs_service", "broken"] },
          quantity: { type: "integer" },
          labRoomId: { type: "string", format: "uuid" },
          supervisorId: { type: "string", format: "uuid", nullable: true },
          isActive: { type: "boolean" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          equipmentId: { type: "string", format: "uuid" },
          requesterId: { type: "string", format: "uuid" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          status: {
            type: "string",
            enum: ["requested", "approved", "rejected", "in_use", "returned", "cancelled"],
          },
          purpose: { type: "string" },
          rejectReason: { type: "string", nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a new user account",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  name: { type: "string" },
                  role: { type: "string", enum: ["student", "supervisor"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Account created, returns JWT" },
          409: { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Logged in" }, 401: { description: "Bad credentials" } },
      },
    },
    "/auth/me": {
      get: { tags: ["Auth"], summary: "Get current user", responses: { 200: { description: "OK" } } },
    },
    "/api/lab-rooms": {
      get: { tags: ["Lab Rooms"], summary: "List lab rooms", responses: { 200: { description: "OK" } } },
      post: { tags: ["Lab Rooms"], summary: "Create lab room (admin)", responses: { 201: { description: "Created" } } },
    },
    "/api/equipment": {
      get: {
        tags: ["Equipment"],
        summary: "List equipment with filters",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20 } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "available", in: "query", description: "YYYY-MM-DD", schema: { type: "string", format: "date" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: { tags: ["Equipment"], summary: "Create equipment (admin)", responses: { 201: { description: "Created" } } },
    },
    "/api/equipment/{id}": {
      get: {
        tags: ["Equipment"],
        summary: "Equipment detail with upcoming bookings",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
      put: { tags: ["Equipment"], summary: "Update equipment (admin)", responses: { 200: { description: "OK" } } },
      delete: { tags: ["Equipment"], summary: "Soft-delete equipment (admin)", responses: { 204: { description: "Deleted" } } },
    },
    "/api/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List bookings (filterable)",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "mine", in: "query", schema: { type: "string" } },
          { name: "equipmentId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create booking — runs three-way conflict check",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["equipmentId", "startTime", "endTime", "purpose"],
                properties: {
                  equipmentId: { type: "string", format: "uuid" },
                  startTime: { type: "string", format: "date-time" },
                  endTime: { type: "string", format: "date-time" },
                  purpose: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Created" },
          409: { description: "Conflict — see response details" },
        },
      },
    },
    "/api/bookings/{id}": {
      get: {
        tags: ["Bookings"],
        summary: "Booking detail with status history",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/bookings/{id}/status": {
      patch: {
        tags: ["Bookings"],
        summary: "Drive the booking state machine",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["approved", "rejected", "in_use", "returned", "cancelled"],
                  },
                  rejectReason: { type: "string" },
                  returnedCondition: { type: "string" },
                  note: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Transitioned" },
          422: { description: "Invalid transition" },
        },
      },
    },
    "/api/availability": {
      get: { tags: ["Availability"], summary: "List supervisor availability", responses: { 200: { description: "OK" } } },
      post: {
        tags: ["Availability"],
        summary: "Set supervisor availability for a date",
        responses: { 201: { description: "Saved" } },
      },
    },
    "/api/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Admin dashboard summary in a single call",
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

module.exports = { spec };
