import { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Box,
  Chip,
} from '@material-ui/core';
import { Rating } from '@material-ui/lab';
import {
  Page,
  Header,
  Content,
  Progress,
  ResponseErrorPanel,
  InfoCard,
} from '@backstage/core-components';
import { useApi, configApiRef, identityApiRef, alertApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { Survey, CreateResponseRequest } from '@internal/plugin-survey-common';
import { useParams, useNavigate } from 'react-router-dom';

export const SurveyResponsePage = () => {
  const { id } = useParams<{ id: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const alertApi = useApi(alertApiRef);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!id) return;
      
      try {
        const backendUrl = configApi.getString('backend.baseUrl');
        const response = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch survey: ${response.statusText}`);
        }
        const surveyData = await response.json();
        setSurvey(surveyData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [id, configApi]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!survey || !id) return;

    // Validate required questions
    const unansweredQuestions = survey.questions.filter(q => 
      answers[q.id] === undefined || answers[q.id] === '' || answers[q.id] === null
    );

    if (unansweredQuestions.length > 0) {
      alertApi.post({ 
        message: 'Please answer all questions before submitting', 
        severity: 'warning' 
      });
      return;
    }

    setSubmitting(true);
    try {
      const identity = await identityApi.getBackstageIdentity();
      const backendUrl = configApi.getString('backend.baseUrl');
      
      const responseData: CreateResponseRequest = {
        userRef: identity.userEntityRef,
        answers,
      };

      const response = await fetchApi.fetch(`${backendUrl}/api/survey/surveys/${id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit response: ${response.statusText}`);
      }

      alertApi.post({ 
        message: 'Thank you! Your response has been submitted successfully.', 
        severity: 'success' 
      });
      navigate('/surveys');
    } catch (error) {
      alertApi.post({ 
        message: `Failed to submit response: ${error}`, 
        severity: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (!survey) {
    return (
      <Page themeId="tool">
        <Header title="Survey Not Found" />
        <Content>
          <Typography variant="h6">
            The requested survey could not be found.
          </Typography>
          <Button onClick={() => navigate('/surveys')} style={{ marginTop: 16 }}>
            Back to Surveys
          </Button>
        </Content>
      </Page>
    );
  }

  const renderQuestion = (question: any) => {
    const questionId = question.id;
    const value = answers[questionId];

    switch (question.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            value={value || ''}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Enter your response..."
          />
        );

      case 'rating':
        return (
          <Box>
            <Rating
              value={value || 0}
              onChange={(_, newValue) => handleAnswerChange(questionId, newValue)}
              size="large"
            />
            <Typography variant="caption" display="block" style={{ marginTop: 8 }}>
              Rate from 1 to 5 stars
            </Typography>
          </Box>
        );

      case 'multiple-choice':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            >
              {question.options?.map((option: string, index: number) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      default:
        return <Typography color="error">Unknown question type</Typography>;
    }
  };

  return (
    <Page themeId="tool">
      <Header 
        title={survey.title} 
        subtitle="Share your feedback to help improve the platform"
      />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <InfoCard>
              <Typography variant="body1" paragraph>
                {survey.description}
              </Typography>
              {survey.ownerGroup && (
                <Box mb={2}>
                  <Chip size="small" label={`By: ${survey.ownerGroup}`} />
                </Box>
              )}
            </InfoCard>

            <Box mt={3}>
              {survey.questions.map((question, index) => (
                <Card key={question.id} style={{ marginBottom: 16 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {index + 1}. {question.label}
                    </Typography>
                    {renderQuestion(question)}
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box mt={3} display="flex" style={{ gap: 16 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting}
                size="large"
              >
                {submitting ? 'Submitting...' : 'Submit Response'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/surveys')}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <InfoCard title="Survey Info">
              <Typography variant="body2" gutterBottom>
                <strong>Created:</strong> {new Date(survey.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Questions:</strong> {survey.questions.length}
              </Typography>
              {survey.ownerGroup && (
                <Typography variant="body2">
                  <strong>Owner:</strong> {survey.ownerGroup}
                </Typography>
              )}
              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">
                  Your responses will be used to improve platform services and developer experience.
                </Typography>
              </Box>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
