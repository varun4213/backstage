import { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import {
  Page,
  Header,
  Content,
  ContentHeader,
} from '@backstage/core-components';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { useTheme } from '@material-ui/core/styles';
import { Survey } from '@internal/plugin-survey-common';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedProgress } from '../AnimatedProgress';
import { AnimatedError } from '../AnimatedError';
import { UserRoleSelector, useUserRole } from '../UserRoleSelector';
import { DeleteSurveyModal } from '../DeleteSurveyModal';

export const SurveyCatalogPage = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submittedSurveys, setSubmittedSurveys] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const navigate = useNavigate();
  const { canCreateSurveys, canViewResults, canSubmitResponses, canDeleteSurveys, currentUser } = useUserRole();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const backendUrl = configApi.getString('backend.baseUrl');
        const response = await fetchApi.fetch(`${backendUrl}/api/survey/surveys`);
        if (!response.ok) {
          throw new Error(`Failed to fetch surveys: ${response.statusText}`);
        }
        const data = await response.json();
        setSurveys(data);
        
        // Load submitted surveys from localStorage
        const submitted = localStorage.getItem(`submitted-surveys-${currentUser}`);
        if (submitted) {
          setSubmittedSurveys(new Set(JSON.parse(submitted)));
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [configApi, currentUser]);

  const retryFetch = () => {
    setLoading(true);
    setError(null);
    const fetchSurveys = async () => {
      try {
        const backendUrl = configApi.getString('backend.baseUrl');
        const response = await fetchApi.fetch(`${backendUrl}/api/survey/surveys`);
        if (!response.ok) {
          throw new Error(`Failed to fetch surveys: ${response.statusText}`);
        }
        const data = await response.json();
        setSurveys(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  };

  const handleDeleteSurvey = (survey: Survey) => {
    setSurveyToDelete(survey);
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
      
      // Remove survey from local state
      setSurveys(prevSurveys => prevSurveys.filter(s => s.id !== surveyId));
      setDeleteModalOpen(false);
      setSurveyToDelete(null);
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
      setSurveyToDelete(null);
    }
  };

  if (loading) {
    return <AnimatedProgress message="Loading surveys..." />;
  }

  if (error) {
    return <AnimatedError error={error} onRetry={retryFetch} />;
  }

  const SurveyCard = ({ survey, index }: { survey: Survey; index: number }) => {
    const hasSubmitted = submittedSurveys.has(survey.id);
    
    // Use Backstage/Material-UI theme for true dark/light detection
    const theme = useTheme();
    const isDark = theme.palette.type === 'dark';
    const cardBg = isDark ? theme.palette.background.paper || '#23272f' : '#fff';
    const cardText = isDark ? theme.palette.text.primary || '#fff' : '#23272f';
    const descText = isDark ? theme.palette.text.secondary || '#b0b0b0' : '#444';
    const chipBg = isDark ? theme.palette.background.default || '#181a20' : '#f5f5f5';
    const chipText = isDark ? theme.palette.text.primary || '#fff' : '#23272f';

    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.1,
          type: "spring",
          stiffness: 100
        }}
        whileHover={{ 
          y: -8,
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.98 }}
        style={{
          height: '100%', // Ensure motion.div takes full height
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Card
          style={{
            height: '100%', // Make card take full available height
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: cardBg,
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
            transition: 'box-shadow 0.2s ease-in-out',
          }}
        >
          <CardContent 
            style={{ 
              flexGrow: 1, 
              padding: '20px', 
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0 // Allow flex shrinking
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%' 
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom 
                style={{ 
                  fontWeight: 600, 
                  marginBottom: '8px', 
                  fontSize: '1.1rem', 
                  color: cardText,
                  lineHeight: 1.3
                }}
              >
                {survey.title}
              </Typography>
              
              <Typography 
                variant="body2" 
                color="textSecondary" 
                style={{ 
                  marginBottom: '16px',
                  lineHeight: 1.5, 
                  color: descText, 
                  fontSize: '0.875rem',
                  flexGrow: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {survey.description}
              </Typography>

              {/* Related Templates Chips */}
              {survey.templates && survey.templates.length > 0 && (
                <Box 
                  mb={2} 
                  display="flex" 
                  flexWrap="wrap" 
                  style={{ gap: '6px' }}
                >
                  {survey.templates.map((template, idx) => (
                    <Chip
                      key={idx}
                      size="small"
                      label={template}
                      color="secondary"
                      variant="outlined"
                      style={{ 
                        backgroundColor: chipBg, 
                        color: chipText, 
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)', 
                        fontSize: '0.75rem',
                        height: '24px'
                      }}
                    />
                  ))}
                </Box>
              )}

              <Box 
                display="flex" 
                justifyContent="space-between" 
                alignItems="center" 
                style={{ marginTop: 'auto' }}
              >
                {survey.ownerGroup && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <Chip 
                      size="small" 
                      label={survey.ownerGroup} 
                      color="primary" 
                      variant="outlined" 
                      style={{ 
                        backgroundColor: isDark ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)', 
                        color: '#1976d2', 
                        borderColor: '#1976d2', 
                        fontSize: '0.75rem',
                        height: '24px'
                      }} 
                    />
                  </motion.div>
                )}
                <Typography 
                  variant="caption" 
                  color="textSecondary" 
                  style={{ 
                    fontSize: '0.75rem', 
                    color: descText 
                  }}
                >
                  Created: {new Date(survey.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </motion.div>
          </CardContent>

          <CardActions 
            style={{ 
              padding: '16px 20px 20px', 
              justifyContent: 'flex-start', 
              gap: '8px',
              marginTop: 'auto'
            }}
          >
            {canSubmitResponses && !hasSubmitted && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => navigate(`/surveys/${survey.id}`)}
                  style={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '6px'
                  }}
                >
                  Take Survey
                </Button>
              </motion.div>
            )}
            
            {hasSubmitted && canSubmitResponses && (
              <Chip
                label="✓ Completed"
                color="primary"
                size="small"
                style={{ 
                  backgroundColor: '#4caf50',
                  color: 'white',
                  fontWeight: 600,
                  height: '28px'
                }}
              />
            )}
            
            {canViewResults && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/surveys/${survey.id}/results`)}
                  disabled={!canViewResults}
                  style={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '6px'
                  }}
                >
                  View Results
                </Button>
              </motion.div>
            )}
            
            {canDeleteSurveys && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{ marginLeft: 'auto' }}
              >
                <Tooltip title="Delete Survey" arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteSurvey(survey)}
                    style={{ 
                      color: '#f44336',
                      backgroundColor: isDark ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                      border: `1px solid ${isDark ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)'}`,
                      borderRadius: '8px',
                      padding: '8px',
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </motion.div>
            )}
          </CardActions>
        </Card>
      </motion.div>
    );
  };

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
            title="Survey Center"
            subtitle="Share your feedback on platform components"
            style={{ padding: '16px 32px' }}
          >
            <Box display="flex" alignItems="center" justifyContent="flex-end" style={{ gap: '16px' }}>
              <UserRoleSelector />
              {canCreateSurveys && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/surveys/create')}
                    style={{ 
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      fontWeight: 'bold',
                      padding: '8px 24px',
                      fontSize: '0.875rem'
                    }}
                  >
                    CREATE SURVEY
                  </Button>
                </motion.div>
              )}
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
          {/* Constrain width of grid */}
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
              <ContentHeader title="Available Surveys">
                <Typography variant="body1" paragraph style={{ marginBottom: '24px' }}>
                  Provide feedback on platform components and services to help improve the developer experience.
                </Typography>
              </ContentHeader>
            </motion.div>

            {/* Surveys grid */}
            <AnimatePresence>
              {surveys.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box textAlign="center" mt={4}>
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
                      <Typography variant="h6" color="textSecondary">
                        No surveys available at the moment.
                      </Typography>
                    </motion.div>
                    {canCreateSurveys && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => navigate('/surveys/create')}
                          style={{ marginTop: 16 }}
                        >
                          Create the first survey
                        </Button>
                      </motion.div>
                    )}
                  </Box>
                </motion.div>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                  marginTop="32px"
                  style={{
                    gridGap: '48px', // Fallback for older browsers
                    margin: '32px 0',
                  }}
                >
                  {surveys.map((survey, index) => (
                    <SurveyCard key={survey.id} survey={survey} index={index} />
                  ))}
                </Box>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </Content>
      
      <DeleteSurveyModal
        open={deleteModalOpen}
        survey={surveyToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </Page>
  );
};
