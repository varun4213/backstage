import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
} from '@material-ui/core';
import { Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@material-ui/icons';
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
import { DeleteSurveyModal } from '../DeleteSurveyModal';

interface SurveyResponse {
  id: string;
  surveyId: string;
  userRef: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export const SurveyResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canViewResults, canDeleteSurveys } = useUserRole();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteSurvey = () => {
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (surveyId: string) => {
    setDeleteLoading(true);
    try {
      const backendUrl = configApi.getString('backend.baseUrl');
      const response = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${surveyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete survey: ${response.statusText}`);
      }
      
      // Navigate back to surveys list after successful deletion
      navigate('/surveys');
    } catch (err) {
      console.error('Error deleting survey:', err);
      // You might want to show an error message to the user here
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!deleteLoading) {
      setDeleteModalOpen(false);
    }
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
      {/* Full-width header wrapper */}
      <Box
        component="header"
        width="100vw"
        position="relative"
        left="50%"
        right="50%"
        marginLeft="-50vw"
        marginRight="-50vw"
        bgcolor="primary.main"
        zIndex={1}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Header
            title={`Results: ${survey.title}`}
            subtitle={survey.description || ''}
            style={{ padding: '16px 32px' }}
          >
            <Box 
              display="flex" 
              alignItems="center" 
              justifyContent="space-between" 
              width="100%" 
              style={{ 
                gap: '16px',
                minWidth: '100%',
                flex: 1
              }}
            >
              <Box display="flex" alignItems="center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/surveys')}
                    style={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  >
                    Back to Surveys
                  </Button>
                </motion.div>
              </Box>
              
              <Box display="flex" alignItems="center" justifyContent="flex-end" style={{ flex: 1 }}>
                {canDeleteSurveys && survey && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSurvey}
                      style={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderColor: '#f44336',
                        color: '#f44336',
                        fontWeight: 500,
                      }}
                    >
                      Delete Survey
                    </Button>
                  </motion.div>
                )}
              </Box>
            </Box>
          </Header>
        </motion.div>
      </Box>

      {/* Main content */}
      <Content>
        <Box
          display="flex"
          justifyContent="center"
          padding="32px 0"
        >
          {/* Constrain width of content */}
          <Box
            maxWidth="1200px"
            width="100%"
            padding="0 24px"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              style={{ textAlign: 'center', marginBottom: '32px' }}
            >
              <ContentHeader title="Survey Analytics">
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                  flexWrap="wrap"
                  style={{ gap: '16px', marginTop: '16px' }}
                >
                  <Typography variant="h6" style={{ fontWeight: 600 }}>
                    {responses.length} response{responses.length !== 1 ? 's' : ''} collected
                  </Typography>
                  {survey.ownerGroup && (
                    <Chip 
                      size="small" 
                      label={survey.ownerGroup} 
                      color="primary"
                      style={{ 
                        backgroundColor: '#1976d2',
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  )}
                  <Typography variant="body2" color="textSecondary">
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
              <Grid container spacing={4}>
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
                style={{ marginTop: '32px' }}
              >
                <Card style={{ borderRadius: '12px', textAlign: 'center' }}>
                  <CardContent style={{ padding: '48px 24px' }}>
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
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Box>
        </Box>
      </Content>
      
      <DeleteSurveyModal
        open={deleteModalOpen}
        survey={survey}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </Page>
  );
};
