import { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
} from '@material-ui/core';
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

export const SurveyCatalogPage = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submittedSurveys, setSubmittedSurveys] = useState<Set<string>>(new Set());
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const navigate = useNavigate();
  const { canCreateSurveys, canViewResults, canSubmitResponses, currentUser } = useUserRole();

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
      >
        <Card
          style={{
            aspectRatio: '16/9',
            minHeight: 0,
            minWidth: 0,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 0.125rem 0.5rem rgba(0,0,0,0.1)',
            borderRadius: '1rem',
            overflow: 'hidden',
            background: cardBg,
            margin: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <CardContent style={{ flexGrow: 1, padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem) 0 clamp(1rem, 3vw, 1.5rem)', minHeight: 0 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Typography variant="h6" gutterBottom style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: cardText }}>
                {survey.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph style={{ minHeight: '2.5rem', lineHeight: 1.4, color: descText, fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                {survey.description}
              </Typography>
              {/* Related Templates Chips */}
              {survey.templates && survey.templates.length > 0 && (
                <Box mb={1} display="flex" flexWrap="wrap" style={{ gap: '0.5rem' }}>
                  {survey.templates.map((template, idx) => (
                    <Chip
                      key={idx}
                      size="small"
                      label={template}
                      color="secondary"
                      variant="outlined"
                      style={{ backgroundColor: chipBg, color: chipText, borderColor: isDark ? '#fff3' : '#ccc', fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }}
                    />
                  ))}
                </Box>
              )}
              <Box display="flex" justifyContent="space-between" alignItems="center" style={{ marginTop: 'auto' }}>
                {survey.ownerGroup && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <Chip size="small" label={survey.ownerGroup} color="primary" variant="outlined" style={{ backgroundColor: chipBg, color: chipText, borderColor: isDark ? '#1976d2' : '#1976d2', fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)' }} />
                  </motion.div>
                )}
                <Typography variant="caption" color="textSecondary" style={{ fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)', color: descText }}>
                  Created: {new Date(survey.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </motion.div>
          </CardContent>
          <CardActions style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem)', justifyContent: 'flex-start', gap: '0.5rem', marginTop: 'auto' }}>
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
                style={{ textTransform: 'none' }}
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
                fontWeight: 'bold'
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
                style={{ textTransform: 'none' }}
              >
                View Results
              </Button>
            </motion.div>
          )}
        </CardActions>
      </Card>
    </motion.div>
  );
  };

  return (
    <Page themeId="tool">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Header title="Survey Center" subtitle="Share your feedback on platform components">
          <Box display="flex" alignItems="center" justifyContent="space-between" style={{ gap: '16px', width: '100%' }}>
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
                >
                  Create Survey
                </Button>
              </motion.div>
            )}
          </Box>
        </Header>
      </motion.div>
      <Content noPadding>
        <Box style={{ padding: 'clamp(1rem, 3vw, 2rem)', width: '100%', boxSizing: 'border-box' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <ContentHeader title="Available Surveys">
              <Typography variant="body1">
                Provide feedback on platform components and services to help improve the developer experience.
              </Typography>
            </ContentHeader>
          </motion.div>
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
                  gap: 'clamp(1rem, 3vw, 2rem)',
                  padding: '1rem 0',
                  width: '100%',
                  maxWidth: '100%',
                  justifyItems: 'stretch',
                  alignItems: 'stretch',
                  margin: 0,
                  boxSizing: 'border-box',
                }}
              >
                {surveys.map((survey, index) => (
                  <SurveyCard key={survey.id} survey={survey} index={index} />
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
        </Box>
      </Content>
    </Page>
  );
};
