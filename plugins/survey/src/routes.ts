import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'survey',
});

export const surveyCreateRouteRef = createRouteRef({
  id: 'survey-create',
});

export const surveyViewRouteRef = createRouteRef({
  id: 'survey-view',
});
