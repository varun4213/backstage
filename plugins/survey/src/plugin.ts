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
