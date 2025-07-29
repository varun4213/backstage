import React, { useEffect, useState } from 'react';
import {
  Typography,
  Grid,
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
  Progress,
  ResponseErrorPanel,
  ItemCardGrid,
} from '@backstage/core-components';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { surveyCreatePermission } from '@internal/plugin-survey-common';
import { Survey } from '@internal/plugin-survey-common';
import { useNavigate } from 'react-router-dom';

export const SurveyCatalogPage = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const navigate = useNavigate();

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
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, [configApi]);

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  const SurveyCard = ({ survey }: { survey: Survey }) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {survey.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {survey.description}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" flexWrap="wrap" gap={1}>
            {survey.ownerGroup && (
              <Chip size="small" label={survey.ownerGroup} />
            )}
            {survey.templates && survey.templates.length > 0 && (
              survey.templates.map((template, index) => (
                <Chip 
                  key={index} 
                  size="small" 
                  label={template} 
                  variant="outlined" 
                  color="primary"
                />
              ))
            )}
          </Box>
          <Typography variant="caption" color="textSecondary">
            Created: {new Date(survey.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="primary"
          onClick={() => navigate(`/surveys/${survey.id}`)}
        >
          Take Survey
        </Button>
        <Button
          size="small"
          onClick={() => navigate(`/surveys/${survey.id}/results`)}
        >
          View Results
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Page themeId="tool">
      <Header title="Survey Center" subtitle="Share your feedback on platform components">
        <RequirePermission permission={surveyCreatePermission} errorPage={<></>}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/surveys/create')}
          >
            Create Survey
          </Button>
        </RequirePermission>
      </Header>
      <Content>
        <ContentHeader title="Available Surveys">
          <Typography variant="body1">
            Provide feedback on platform components and services to help improve the developer experience.
          </Typography>
        </ContentHeader>
        {surveys.length === 0 ? (
          <Box textAlign="center" mt={4}>
            <Typography variant="h6" color="textSecondary">
              No surveys available at the moment.
            </Typography>
            <RequirePermission permission={surveyCreatePermission} errorPage={<></>}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/surveys/create')}
                style={{ marginTop: 16 }}
              >
                Create the first survey
              </Button>
            </RequirePermission>
          </Box>
        ) : (
          <ItemCardGrid>
            {surveys.map((survey) => (
              <SurveyCard key={survey.id} survey={survey} />
            ))}
          </ItemCardGrid>
        )}
      </Content>
    </Page>
  );
};
