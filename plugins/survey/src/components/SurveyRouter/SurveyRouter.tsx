import { Routes, Route } from 'react-router-dom';
import { SurveyCatalogPage } from '../SurveyCatalogPage';
import { SurveyBuilderPage } from '../SurveyBuilderPage';
import { SurveyResponsePage } from '../SurveyResponsePage';
import { SurveyResultsPage } from '../SurveyResultsPage';
import { UserRoleProvider } from '../UserRoleSelector';

export const SurveyRouter = () => {
  return (
    <UserRoleProvider>
      <Routes>
        <Route path="/" element={<SurveyCatalogPage />} />
        <Route path="/create" element={<SurveyBuilderPage />} />
        <Route path="/:id" element={<SurveyResponsePage />} />
        <Route path="/:id/results" element={<SurveyResultsPage />} />
      </Routes>
    </UserRoleProvider>
  );
};
