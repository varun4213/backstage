import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { rootRouteRef, surveyCreateRouteRef, surveyViewRouteRef } from './routes';

export const surveyPlugin = createPlugin({
  id: 'survey',
  routes: {
    root: rootRouteRef,
    create: surveyCreateRouteRef,
    view: surveyViewRouteRef,
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

export const SurveyCatalogPage = surveyPlugin.provide(
  createRoutableExtension({
    name: 'SurveyCatalogPage',
    component: () =>
      import('./components/SurveyCatalogPage').then(m => m.SurveyCatalogPage),
    mountPoint: rootRouteRef,
  }),
);

export const SurveyBuilderPage = surveyPlugin.provide(
  createRoutableExtension({
    name: 'SurveyBuilderPage',
    component: () =>
      import('./components/SurveyBuilderPage').then(m => m.SurveyBuilderPage),
    mountPoint: surveyCreateRouteRef,
  }),
);

export const SurveyResponsePage = surveyPlugin.provide(
  createRoutableExtension({
    name: 'SurveyResponsePage',
    component: () =>
      import('./components/SurveyResponsePage').then(m => m.SurveyResponsePage),
    mountPoint: surveyViewRouteRef,
  }),
);
