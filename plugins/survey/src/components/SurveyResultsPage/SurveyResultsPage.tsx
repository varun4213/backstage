import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@material-ui/core';
import {
  Page,
  Header,
  Content,
  ContentHeader,
} from '@backstage/core-components';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { Survey } from '@internal/plugin-survey-common';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedProgress } from '../AnimatedProgress';
import { AnimatedError } from '../AnimatedError';
import { SurveyCharts } from '../SurveyCharts';
import { useUserRole } from '../UserRoleSelector';

interface SurveyResponse {
  id: string;
  surveyId: string;
  userRef: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export const SurveyResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canViewResults } = useUserRole();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  useEffect(() => {
    if (!canViewResults) {
      navigate('/surveys');
      return;
    }

    const fetchSurveyAndResponses = async () => {
      if (!id) return;
      
      try {
        const backendUrl = configApi.getString('backend.baseUrl');
        
        // Fetch survey details
        const surveyResponse = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${id}`);
        if (!surveyResponse.ok) {
          throw new Error(`Failed to fetch survey: ${surveyResponse.statusText}`);
        }
        const surveyData = await surveyResponse.json();
        setSurvey(surveyData);

        // Fetch survey responses
        const responsesResponse = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${id}/responses`);
        if (!responsesResponse.ok) {
          throw new Error(`Failed to fetch responses: ${responsesResponse.statusText}`);
        }
        const responsesData = await responsesResponse.json();
        setResponses(responsesData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyAndResponses();
  }, [id, configApi, fetchApi, canViewResults, navigate]);

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    const fetchSurveyAndResponses = async () => {
      if (!id) return;
      
      try {
        const backendUrl = configApi.getString('backend.baseUrl');
        
        const surveyResponse = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${id}`);
        if (!surveyResponse.ok) {
          throw new Error(`Failed to fetch survey: ${surveyResponse.statusText}`);
        }
        const surveyData = await surveyResponse.json();
        setSurvey(surveyData);

        const responsesResponse = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${id}/responses`);
        if (!responsesResponse.ok) {
          throw new Error(`Failed to fetch responses: ${responsesResponse.statusText}`);
        }
        const responsesData = await responsesResponse.json();
        setResponses(responsesData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveyAndResponses();
  };

  if (loading) {
    return <AnimatedProgress message="Loading survey results..." />;
  }

  if (error) {
    return <AnimatedError error={error} onRetry={retryFetch} />;
  }

  if (!survey) {
    return (
      <Page themeId="tool">
        <Header title="Survey Results" />
        <Content>
          <Typography variant="h6" color="textSecondary">
            Survey not found.
          </Typography>
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Header
          title={`Results: ${survey.title}`}
          subtitle={survey.description || ''}
        />
      </motion.div>
      <Content>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <ContentHeader title="Survey Analytics">
            <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
              <Typography variant="body1">
                {responses.length} response{responses.length !== 1 ? 's' : ''} collected
              </Typography>
              {survey.ownerGroup && (
                <Chip size="small" label={survey.ownerGroup} />
              )}
              <Typography variant="caption" color="textSecondary">
                Created: {new Date(survey.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </ContentHeader>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Grid container spacing={3}>
            <AnimatePresence>
              {survey.questions.map((question, index) => (
                <Grid item xs={12} md={question.type === 'text' ? 12 : 6} key={question.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1 + 0.5,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    <SurveyCharts question={question} responses={responses} />
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </motion.div>

        {responses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No responses yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Share your survey to start collecting responses.
                    </Typography>
                  </motion.div>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Content>
    </Page>
  );
};
