import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SORE-V2 API',
      version: '1.0.0',
      description: 'API documentation for the SORE-V2 application.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
        },
        RegisterUserInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
            },
          },
          required: ['name', 'email', 'password'],
        },
        LoginUserInput: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
            },
          },
          required: ['email', 'password'],
        },
        Couple: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'cuid',
            },
            name: {
              type: 'string',
            },
            inviteCode: {
              type: 'string',
            },
            anniversary: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateCoupleInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'The Smiths',
            },
            anniversary: {
              type: 'string',
              format: 'date-time',
              example: '2020-01-15T00:00:00.000Z',
            },
          },
          required: ['name'],
        },
        JoinCoupleInput: {
          type: 'object',
          properties: {
            inviteCode: {
              type: 'string',
              example: 'uniqueinvitecode123',
            },
          },
          required: ['inviteCode'],
        },
        Memory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            category: { type: 'string' },
            mood: { type: 'string' },
            author: { $ref: '#/components/schemas/User' },
            couple: { $ref: '#/components/schemas/Couple' },
            // Note: `images` and `moments` are included based on query params
          },
        },
        CreateMemoryInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            latitude: { type: 'string' },
            longitude: { type: 'string' },
            category: { type: 'string' },
            mood: { type: 'string' },
            imageIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'cuid',
              },
            },
          },
          required: ['title', 'date'],
        },
        UpdateMemoryInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            latitude: { type: 'string' },
            longitude: { type: 'string' },
            category: { type: 'string' },
            mood: { type: 'string' },
            imageIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'cuid',
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'A high-level error message.',
            },
            details: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Optional additional details about the error (e.g., validation errors).',
            },
          },
          required: ['error'],
        },
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/app/api/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions); 