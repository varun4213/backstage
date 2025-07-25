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
