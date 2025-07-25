import { createPermission } from '@backstage/plugin-permission-common';

export const surveyCreatePermission = createPermission({
  name: 'survey.create',
  attributes: {},
});

export const surveyRespondPermission = createPermission({
  name: 'survey.respond',
  attributes: {},
});
