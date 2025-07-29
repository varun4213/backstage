/**
 * Common functionalities for the survey plugin.
 *
 * @packageDocumentation
 */

// Survey data types
export interface Survey {
  id: string;
  title: string;
  description: string;
  ownerGroup?: string;
  templates?: string[];
  questions: Question[];
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

// API response types
export interface SurveyListResponse {
  surveys: Survey[];
}

export interface CreateSurveyRequest {
  title: string;
  description: string;
  ownerGroup?: string;
  questions: Omit<Question, 'id' | 'surveyId'>[];
}

export interface CreateResponseRequest {
  userRef: string;
  answers: Record<string, any>;
}

export * from './permissions';
