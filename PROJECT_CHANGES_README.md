# Backstage Survey Plugin Project - Complete Development Log

This document provides a comprehensive overview of all changes made to the Backstage project from the initial setup created with `npm create backstage@latest` to the current state with a custom survey plugin.

## 🏗️ Initial Project Structure

The project was initialized using:
```bash
npm create backstage@latest
```

This created the standard Backstage monorepo structure with:
- `packages/app` - Frontend application
- `packages/backend` - Backend application
- Standard Backstage plugins and configurations

## 🎯 Project Overview

The project implements a **Survey Plugin System** for Backstage with the following capabilities:
- Survey creation and management
- Question management (text, rating, multiple-choice)
- Response collection and storage
- Permission-based access control
- SQLite database integration

## 📦 Custom Plugins Created

### 1. Survey Frontend Plugin (`@internal/plugin-survey`)

**Location**: `plugins/survey/`

**Purpose**: Provides the frontend interface for the survey system

**Key Files Created/Modified**:

#### `plugins/survey/package.json`
```json
{
  "name": "@internal/plugin-survey",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "backstage": {
    "role": "frontend-plugin",
    "pluginId": "survey"
  },
  "dependencies": {
    "@backstage/core-components": "^0.17.4",
    "@backstage/core-plugin-api": "^1.10.9",
    "@backstage/theme": "^0.6.7",
    "@material-ui/core": "^4.9.13",
    "@material-ui/icons": "^4.9.1",
    "@material-ui/lab": "^4.0.0-alpha.61",
    "react-use": "^17.2.4"
  }
}
```

#### `plugins/survey/src/plugin.ts`
```typescript
import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';

export const surveyPlugin = createPlugin({
  id: 'survey',
  routes: {
    root: rootRouteRef,
  },
});

export const SurveyPage = surveyPlugin.provide(
  createRoutableExtension({
    name: 'SurveyPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
```

#### `plugins/survey/src/routes.ts`
```typescript
import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'survey',
});
```

#### `plugins/survey/src/index.ts`
```typescript
export { surveyPlugin, SurveyPage } from './plugin';
```

#### `plugins/survey/src/components/ExampleComponent/ExampleComponent.tsx`
Frontend component with Material-UI integration showing survey interface prototype.

#### `plugins/survey/src/components/ExampleFetchComponent/ExampleFetchComponent.tsx`
Demo component showing data fetching capabilities with table display.

#### `plugins/survey/dev/index.tsx`
Development setup for standalone plugin testing:
```tsx
import { createDevApp } from '@backstage/dev-utils';
import { surveyPlugin, SurveyPage } from '../src/plugin';

createDevApp()
  .registerPlugin(surveyPlugin)
  .addPage({
    element: <SurveyPage />,
    title: 'Root Page',
    path: '/survey',
  })
  .render();
```

### 2. Survey Backend Plugin (`@internal/plugin-survey-backend`)

**Location**: `plugins/survey-backend/`

**Purpose**: Provides backend API and database integration for surveys

**Key Files Created/Modified**:

#### `plugins/survey-backend/package.json`
```json
{
  "name": "@internal/plugin-survey-backend",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "backstage": {
    "role": "backend-plugin",
    "pluginId": "survey"
  },
  "dependencies": {
    "@backstage/backend-common": "^0.25.0",
    "@backstage/backend-defaults": "^0.11.1",
    "@backstage/backend-plugin-api": "^1.4.1",
    "@backstage/catalog-client": "^1.9.1",
    "@backstage/errors": "^1.2.7",
    "@backstage/plugin-catalog-node": "^1.17.2",
    "@internal/plugin-survey-common": "^0.1.0",
    "express": "^4.17.1",
    "express-promise-router": "^4.1.0",
    "knex": "^3.1.0",
    "sqlite3": "^5.1.7",
    "zod": "^3.22.4"
  }
}
```

#### `plugins/survey-backend/src/plugin.ts`
Main plugin registration with Backstage backend system:
```typescript
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createTodoListService } from './services/TodoListService';

export const surveyPlugin = createBackendPlugin({
  pluginId: 'survey',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
      },
      async init({ logger, httpAuth, httpRouter, catalog }) {
        const todoListService = await createTodoListService({
          logger,
          catalog,
        });

        httpRouter.use(
          await createRouter({
            httpAuth,
            todoListService,
          }),
        );
      },
    });
  },
});
```

#### `plugins/survey-backend/src/router.ts`
Express router with API endpoints:
```typescript
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { TodoListService } from './services/TodoListService/types';

export async function createRouter({
  httpAuth,
  todoListService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoListService.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await todoListService.listTodos());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoListService.getTodo({ id: req.params.id }));
  });

  return router;
}
```

#### `plugins/survey-backend/src/models.ts`
TypeScript interfaces for survey data models:
```typescript
export interface Survey {
  id: string;
  title: string;
  description: string;
  ownerGroup?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  surveyId: string;
  type: 'text' | 'rating' | 'multiple-choice';
  label: string;
  options?: string[];
}

export interface Response {
  id: string;
  surveyId: string;
  userRef: string;
  answers: Record<string, any>;
  submittedAt: string;
}
```

#### `plugins/survey-backend/src/knex.ts`
Database configuration:
```typescript
import Knex from 'knex';
import path from 'path';

const config = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, '../../../survey.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, '../migrations')
  }
};

const knex = Knex(config);
export default knex;
```

#### `plugins/survey-backend/knexfile.js`
Knex migration configuration:
```javascript
const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, '../../survey.db')
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations')
    },
    useNullAsDefault: true
  }
};
```

#### `plugins/survey-backend/migrations/001_initial_survey_tables.js`
Database schema migration:
```javascript
exports.up = function(knex) {
  return knex.schema
    .createTable('surveys', function(table) {
      table.uuid('id').primary();
      table.string('title').notNullable();
      table.text('description');
      table.string('ownerGroup');
      table.timestamp('createdAt').defaultTo(knex.fn.now());
    })
    .createTable('questions', function(table) {
      table.uuid('id').primary();
      table.uuid('surveyId').references('id').inTable('surveys').onDelete('CASCADE');
      table.string('type').notNullable();
      table.string('label').notNullable();
      table.json('options');
    })
    .createTable('responses', function(table) {
      table.uuid('id').primary();
      table.uuid('surveyId').references('id').inTable('surveys').onDelete('CASCADE');
      table.string('userRef').notNullable();
      table.json('answers').notNullable();
      table.timestamp('submittedAt').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('responses')
    .dropTableIfExists('questions')
    .dropTableIfExists('surveys');
};
```

#### Service Layer
**`plugins/survey-backend/src/services/TodoListService/types.ts`**:
```typescript
import {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';

export interface TodoItem {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
}

export interface TodoListService {
  createTodo(
    input: { title: string; entityRef?: string },
    options: { credentials: BackstageCredentials<BackstageUserPrincipal> }
  ): Promise<TodoItem>;
  listTodos(): Promise<{ items: TodoItem[] }>;
  getTodo(request: { id: string }): Promise<TodoItem>;
}
```

**`plugins/survey-backend/src/services/TodoListService/createTodoListService.ts`**:
In-memory service implementation with catalog integration.

#### Testing
**`plugins/survey-backend/src/plugin.test.ts`**:
Integration tests for the backend plugin with mock services.

#### Development Setup
**`plugins/survey-backend/dev/index.ts`**:
Standalone development server with mocked dependencies.

### 3. Survey Common Plugin (`@internal/plugin-survey-common`)

**Location**: `plugins/survey-common/`

**Purpose**: Shared types and permissions between frontend and backend

#### `plugins/survey-common/package.json`
```json
{
  "name": "@internal/plugin-survey-common",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

#### `plugins/survey-common/src/permissions.ts`
```typescript
import { createPermission } from '@backstage/plugin-permission-common';

export const surveyCreatePermission = createPermission({
  name: 'survey.create',
  attributes: {},
});

export const surveyRespondPermission = createPermission({
  name: 'survey.respond',
  attributes: {},
});
```

#### `plugins/survey-common/src/index.ts`
```typescript
export type CommonType = {
  field: string;
};

export const COMMON_CONSTANT = 1;

export * from './permissions';
```

## 🔧 Core Application Changes

### Frontend App Changes

#### `packages/app/package.json` - Dependencies Added
```json
{
  "dependencies": {
    "@internal/plugin-survey": "workspace:^",
    // ... other existing dependencies
  }
}
```

#### `packages/app/src/App.tsx` - Plugin Integration
```tsx
import { SurveyPage } from '@internal/plugin-survey';

// Added to routes:
<Route path="/survey" element={<SurveyPage />} />
```

### Backend App Changes

#### `packages/backend/package.json` - Dependencies Added
```json
{
  "dependencies": {
    "@internal/plugin-survey-backend": "workspace:^",
    "better-sqlite3": "^9.0.0",
    "sqlite3": "^5.1.7",
    // ... other existing dependencies
  }
}
```

#### `packages/backend/src/index.ts` - Plugin Registration
```typescript
// Added at the end before backend.start():
backend.add(import('@internal/plugin-survey-backend'));
```

### Root Package Configuration

#### `package.json` - Workspace Configuration
```json
{
  "workspaces": {
    "packages": [
      "packages/*",
      "plugins/*",
      "plugins/survey-common"
    ]
  }
}
```

## 🗄️ Database Setup

### SQLite Database
- **File**: `survey.db` (in project root)
- **Tables**: `surveys`, `questions`, `responses`
- **Migration system**: Using Knex.js migrations

### Schema Overview
```sql
-- surveys table
CREATE TABLE surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ownerGroup TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- questions table  
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  surveyId TEXT REFERENCES surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'text', 'rating', 'multiple-choice'
  label TEXT NOT NULL,
  options JSON -- For multiple choice options
);

-- responses table
CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  surveyId TEXT REFERENCES surveys(id) ON DELETE CASCADE,
  userRef TEXT NOT NULL,
  answers JSON NOT NULL,
  submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🛠️ Development Commands

### Initial Setup Commands (after cloning)
```bash
# Install dependencies
yarn install

# Run database migrations
cd plugins/survey-backend
yarn knex migrate:latest
cd ../..

# Start the development server
yarn start
```

### Plugin Development Commands
```bash
# Start frontend plugin in isolation
cd plugins/survey
yarn start

# Start backend plugin in isolation  
cd plugins/survey-backend
yarn start

# Run tests
yarn test

# Build all packages
yarn build:all

# Lint code
yarn lint:all
```

### Database Commands
```bash
# Run migrations
cd plugins/survey-backend
yarn knex migrate:latest

# Rollback migrations
yarn knex migrate:rollback

# Create new migration
yarn knex migrate:make migration_name
```

## 🔐 Permission System

The project implements Backstage's permission framework with custom permissions:

- `survey.create` - Permission to create surveys
- `survey.respond` - Permission to respond to surveys

These are defined in the `survey-common` plugin for shared access.

## 🧪 Testing Strategy

### Backend Testing
- Integration tests using `@backstage/backend-test-utils`
- Mock services for catalog and auth
- Supertest for API endpoint testing

### Frontend Testing  
- Component testing with React Testing Library
- Mock service worker (MSW) for API mocking

## 📁 File Structure Summary

```
backstage/
├── package.json (modified - added workspaces)
├── app-config.yaml (standard Backstage config)
├── survey.db (SQLite database file)
├── packages/
│   ├── app/
│   │   ├── package.json (modified - added survey plugin)
│   │   └── src/
│   │       └── App.tsx (modified - added survey route)
│   └── backend/
│       ├── package.json (modified - added survey backend)
│       └── src/
│           └── index.ts (modified - added survey plugin)
└── plugins/
    ├── survey/ (NEW - Frontend plugin)
    │   ├── package.json
    │   ├── dev/index.tsx
    │   └── src/
    │       ├── index.ts
    │       ├── plugin.ts
    │       ├── routes.ts
    │       └── components/
    ├── survey-backend/ (NEW - Backend plugin)
    │   ├── package.json
    │   ├── knexfile.js
    │   ├── dev/index.ts
    │   ├── migrations/001_initial_survey_tables.js
    │   └── src/
    │       ├── index.ts
    │       ├── plugin.ts
    │       ├── router.ts
    │       ├── models.ts
    │       ├── knex.ts
    │       └── services/TodoListService/
    └── survey-common/ (NEW - Shared plugin)
        ├── package.json
        └── src/
            ├── index.ts
            └── permissions.ts
```

## 🚀 Next Steps / TODOs

1. **Replace TodoListService** with proper SurveyService
2. **Implement Survey Management UI** components
3. **Add Question Builder** interface
4. **Implement Response Collection** system
5. **Add Survey Analytics** and reporting
6. **Integrate with Backstage Catalog** entities
7. **Add proper error handling** and validation
8. **Implement real database service** (replace in-memory storage)
9. **Add permission policy** implementation
10. **Write comprehensive tests**

## 🔗 API Endpoints (Current)

Base URL: `http://localhost:7007/api/survey`

- `POST /todos` - Create a new todo item
- `GET /todos` - List all todo items  
- `GET /todos/:id` - Get specific todo item

## 📚 Key Technologies Used

- **Backstage Framework** - Core platform
- **TypeScript** - Language
- **React** - Frontend framework
- **Material-UI** - Component library
- **Express.js** - Backend framework
- **Knex.js** - SQL query builder
- **SQLite** - Database
- **Zod** - Schema validation
- **Jest** - Testing framework

This README serves as a complete reference for anyone taking over the project development or needing to understand the current implementation state.
