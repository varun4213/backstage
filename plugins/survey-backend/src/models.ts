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
