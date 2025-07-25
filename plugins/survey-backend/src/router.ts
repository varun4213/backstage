import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { TodoListService } from './services/TodoListService/types';
import { v4 as uuid } from 'uuid';
import knex from './knex';

export async function createRouter({
  httpAuth,
  todoListService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
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

  // Survey schemas
  const surveySchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    ownerGroup: z.string().optional(),
  });

  const responseSchema = z.object({
    userRef: z.string(),
    answers: z.record(z.any()),
  });

  // Survey routes
  router.post('/surveys', async (req, res) => {
    const parsed = surveySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const id = uuid();
    await knex('surveys').insert({ 
      id, 
      ...parsed.data, 
      createdAt: new Date().toISOString() 
    });
    res.status(201).json({ id });
  });

  router.get('/surveys', async (_req, res) => {
    const surveys = await knex('surveys').select('*');
    res.json(surveys);
  });

  router.get('/surveys/:id', async (req, res) => {
    const survey = await knex('surveys').where('id', req.params.id).first();
    if (!survey) {
      throw new InputError(`Survey with id ${req.params.id} not found`);
    }
    res.json(survey);
  });

  router.post('/surveys/:id/response', async (req, res) => {
    const parsed = responseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const id = uuid();
    await knex('responses').insert({ 
      id, 
      surveyId: req.params.id, 
      ...parsed.data, 
      submittedAt: new Date().toISOString() 
    });
    res.status(201).json({ id });
  });

  return router;
}
