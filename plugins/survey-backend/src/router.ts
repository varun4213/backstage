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

  // Survey schemas
  const surveySchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    ownerGroup: z.string().optional(),
    templates: z.array(z.string()).optional(),
    questions: z.array(z.object({
      type: z.enum(['text', 'rating', 'multiple-choice']),
      label: z.string(),
      options: z.array(z.string()).optional(),
    })),
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

    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });

    const surveyId = uuid();
    const surveyData = {
      id: surveyId,
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };

    // Insert survey
    await knex('surveys').insert({
      id: surveyData.id,
      title: surveyData.title,
      description: surveyData.description || '',
      ownerGroup: surveyData.ownerGroup,
      templates: surveyData.templates ? JSON.stringify(surveyData.templates) : null,
      createdAt: surveyData.createdAt,
    });

    // Insert questions
    const questions = parsed.data.questions.map(question => ({
      id: uuid(),
      surveyId: surveyId,
      type: question.type,
      label: question.label,
      options: question.options ? JSON.stringify(question.options) : null,
    }));

    if (questions.length > 0) {
      await knex('questions').insert(questions);
    }

    res.status(201).json({ id: surveyId });
  });

  router.get('/surveys', async (req, res) => {
    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });
    const surveys = await knex('surveys').select('*').orderBy('createdAt', 'desc');
    
    // Get questions for each survey
    const surveysWithQuestions = await Promise.all(
      surveys.map(async (survey) => {
        const questions = await knex('questions')
          .where('surveyId', survey.id)
          .select('*');
        
        return {
          ...survey,
          templates: survey.templates ? JSON.parse(survey.templates) : [],
          questions: questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : undefined,
          })),
        };
      })
    );

    res.json(surveysWithQuestions);
  });

  router.get('/surveys/:id', async (req, res) => {
    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });
    
    const survey = await knex('surveys').where('id', req.params.id).first();
    if (!survey) {
      throw new InputError(`Survey with id ${req.params.id} not found`);
    }

    const questions = await knex('questions')
      .where('surveyId', req.params.id)
      .select('*');

    const surveyWithQuestions = {
      ...survey,
      templates: survey.templates ? JSON.parse(survey.templates) : [],
      questions: questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : undefined,
      })),
    };

    res.json(surveyWithQuestions);
  });

  router.post('/surveys/:id/response', async (req, res) => {
    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });
    
    const parsed = responseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    // Check if survey exists
    const survey = await knex('surveys').where('id', req.params.id).first();
    if (!survey) {
      throw new InputError(`Survey with id ${req.params.id} not found`);
    }

    const responseId = uuid();
    await knex('responses').insert({ 
      id: responseId, 
      surveyId: req.params.id, 
      userRef: parsed.data.userRef,
      answers: JSON.stringify(parsed.data.answers),
      submittedAt: new Date().toISOString() 
    });
    
    res.status(201).json({ id: responseId });
  });

  router.get('/surveys/:id/responses', async (req, res) => {
    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });
    
    const survey = await knex('surveys').where('id', req.params.id).first();
    if (!survey) {
      throw new InputError(`Survey with id ${req.params.id} not found`);
    }

    const responses = await knex('responses')
      .where('surveyId', req.params.id)
      .select('*');

    const mappedResponses = responses.map(r => ({
      ...r,
      answers: JSON.parse(r.answers),
    }));

    res.json(mappedResponses);
  });

  router.get('/surveys/:id/results', async (req, res) => {
    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });
    
    const survey = await knex('surveys').where('id', req.params.id).first();
    if (!survey) {
      throw new InputError(`Survey with id ${req.params.id} not found`);
    }

    const responses = await knex('responses')
      .where('surveyId', req.params.id)
      .select('*');

    const results = {
      survey,
      totalResponses: responses.length,
      responses: responses.map(r => ({
        ...r,
        answers: JSON.parse(r.answers),
      })),
    };

    res.json(results);
  });

  // Delete survey endpoint
  router.delete('/surveys/:id', async (req, res) => {
    // Get user credentials for authentication
    await httpAuth.credentials(req, { allow: ['user'] });
    
    const surveyId = req.params.id;
    
    // Check if survey exists
    const survey = await knex('surveys').where('id', surveyId).first();
    if (!survey) {
      throw new InputError(`Survey with id ${surveyId} not found`);
    }

    // Delete in transaction to ensure data consistency
    await knex.transaction(async (trx) => {
      // Delete responses first (foreign key constraint)
      await trx('responses').where('surveyId', surveyId).del();
      
      // Delete questions
      await trx('questions').where('surveyId', surveyId).del();
      
      // Delete survey
      await trx('surveys').where('id', surveyId).del();
    });

    res.status(200).json({ message: `Survey ${surveyId} deleted successfully` });
  });

  return router;
}
