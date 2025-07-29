import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApi as useBackstageApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
} from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import {
  Page,
  Header,
  Content,
  ContentHeader,
  InfoCard,
} from '@backstage/core-components';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { CreateSurveyRequest, Question } from '@internal/plugin-survey-common';
import { useNavigate } from 'react-router-dom';
import { alertApiRef } from '@backstage/core-plugin-api';

type QuestionType = 'text' | 'rating' | 'multiple-choice';

interface QuestionForm extends Omit<Question, 'id' | 'surveyId'> {
  tempId: string;
}

interface QuestionBuilderProps {
  question: QuestionForm;
  updateQuestion: (tempId: string, updates: Partial<QuestionForm>) => void;
  removeQuestion: (tempId: string) => void;
  addOption: (tempId: string) => void;
  updateOption: (tempId: string, optionIndex: number, value: string) => void;
  removeOption: (tempId: string, optionIndex: number) => void;
}

const QuestionBuilder = React.memo(({ 
  question, 
  updateQuestion, 
  removeQuestion, 
  addOption, 
  updateOption, 
  removeOption 
}: QuestionBuilderProps) => {
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateQuestion(question.tempId, { label: e.target.value });
  }, [question.tempId, updateQuestion]);

  const handleTypeChange = useCallback((e: any) => {
    const value = e.target.value as QuestionType;
    updateQuestion(question.tempId, { 
      type: value,
      options: value === 'multiple-choice' ? [''] : []
    });
  }, [question.tempId, updateQuestion]);

  const handleOptionChange = useCallback((index: number, value: string) => {
    updateOption(question.tempId, index, value);
  }, [question.tempId, updateOption]);

  const handleRemoveQuestion = useCallback(() => {
    removeQuestion(question.tempId);
  }, [question.tempId, removeQuestion]);

  const handleAddOption = useCallback(() => {
    addOption(question.tempId);
  }, [question.tempId, addOption]);

  const handleRemoveOption = useCallback((index: number) => {
    removeOption(question.tempId, index);
  }, [question.tempId, removeOption]);

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={11}>
            <TextField
              fullWidth
              label="Question"
              value={question.label || ''}
              onChange={handleLabelChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={1}>
            <IconButton onClick={handleRemoveQuestion}>
              <DeleteIcon />
            </IconButton>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Question Type</InputLabel>
              <Select
                value={question.type}
                onChange={handleTypeChange}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="rating">Rating (1-5)</MenuItem>
                <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {question.type === 'multiple-choice' && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Options:
              </Typography>
              {question.options?.map((option, index) => (
                <Box key={index} display="flex" alignItems="center" mb={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveOption(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button 
                startIcon={<AddIcon />} 
                onClick={handleAddOption}
                size="small"
              >
                Add Option
              </Button>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
});

export const SurveyBuilderPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ownerGroup, setOwnerGroup] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<any[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<any[]>([]);

  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const navigate = useNavigate();
  const catalogApi = useBackstageApi(catalogApiRef);

  // Fetch templates from the catalog on mount
  useEffect(() => {
    let mounted = true;
    async function fetchTemplates() {
      try {
        const result = await catalogApi.getEntities({
          filter: { kind: 'Template' },
        });
        if (mounted) {
          setTemplateOptions(result.items || []);
        }
      } catch (e) {
        // fallback: do nothing
      }
    }
    fetchTemplates();
    return () => { mounted = false; };
  }, [catalogApi]);

  const addQuestion = useCallback(() => {
    const newQuestion: QuestionForm = {
      tempId: uuidv4(),
      type: 'text',
      label: '',
      options: [],
    };
    setQuestions(prev => [...prev, newQuestion]);
  }, []);

  const updateQuestion = useCallback((tempId: string, updates: Partial<QuestionForm>) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.tempId === tempId ? { ...q, ...updates } : q
      )
    );
  }, []);

  const removeQuestion = useCallback((tempId: string) => {
    setQuestions(prev => prev.filter(q => q.tempId !== tempId));
  }, []);

  const addOption = useCallback((tempId: string) => {
    setQuestions(prev => {
      const question = prev.find(q => q.tempId === tempId);
      if (question) {
        const newOptions = [...(question.options || []), ''];
        return prev.map(q => 
          q.tempId === tempId ? { ...q, options: newOptions } : q
        );
      }
      return prev;
    });
  }, []);

  const updateOption = useCallback((tempId: string, optionIndex: number, value: string) => {
    setQuestions(prev => {
      const question = prev.find(q => q.tempId === tempId);
      if (question && question.options) {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        return prev.map(q => 
          q.tempId === tempId ? { ...q, options: newOptions } : q
        );
      }
      return prev;
    });
  }, []);

  const removeOption = useCallback((tempId: string, optionIndex: number) => {
    setQuestions(prev => {
      const question = prev.find(q => q.tempId === tempId);
      if (question && question.options) {
        const newOptions = question.options.filter((_, index) => index !== optionIndex);
        return prev.map(q => 
          q.tempId === tempId ? { ...q, options: newOptions } : q
        );
      }
      return prev;
    });
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alertApi.post({ message: 'Survey title is required', severity: 'error' });
      return;
    }

    if (questions.length === 0) {
      alertApi.post({ message: 'At least one question is required', severity: 'error' });
      return;
    }

    const invalidQuestions = questions.filter(q => !q.label.trim());
    if (invalidQuestions.length > 0) {
      alertApi.post({ message: 'All questions must have a label', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const backendUrl = configApi.getString('backend.baseUrl');

      const surveyData: CreateSurveyRequest & { templates?: string[] } = {
        title: title.trim(),
        description: description.trim(),
        ownerGroup: ownerGroup.trim() || undefined,
        questions: questions.map(({ tempId, ...question }) => question),
        templates: selectedTemplates.map(t => t.metadata?.name),
      };

      const response = await fetchApi.fetch(`${backendUrl}/api/survey/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create survey: ${response.statusText}`);
      }

      const result = await response.json();
      alertApi.post({ 
        message: 'Survey created successfully!', 
        severity: 'success' 
      });
      navigate(`/surveys/${result.id}`);
    } catch (error) {
      alertApi.post({ 
        message: `Failed to create survey: ${error}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page themeId="tool">
      <Header title="Create Survey" subtitle="Build a feedback form for the developer community" />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <InfoCard title="Survey Details">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Survey Title"
                    value={title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTitle(value);
                    }}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={description}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDescription(value);
                    }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Owner Group (Optional)"
                    value={ownerGroup}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOwnerGroup(value);
                    }}
                    margin="normal"
                    helperText="e.g., Platform Engineering, Frontend Team"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={templateOptions}
                    getOptionLabel={option => option?.metadata?.title || option?.metadata?.name || ''}
                    value={selectedTemplates}
                    onChange={(_, value) => setSelectedTemplates(value)}
                    renderInput={params => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Related Templates (Optional)"
                        placeholder="Select one or more templates"
                        margin="normal"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </InfoCard>

            <Box mt={3}>
              <ContentHeader title="Questions">
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addQuestion}
                >
                  Add Question
                </Button>
              </ContentHeader>
              {questions.map((question) => (
                <QuestionBuilder 
                  key={question.tempId} 
                  question={question}
                  updateQuestion={updateQuestion}
                  removeQuestion={removeQuestion}
                  addOption={addOption}
                  updateOption={updateOption}
                  removeOption={removeOption}
                />
              ))}
              {questions.length === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="body1" color="textSecondary" align="center">
                      No questions added yet. Click "Add Question" to get started.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>

            <Box mt={3} display="flex">
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ marginRight: 16 }}
              >
                {loading ? 'Creating...' : 'Create Survey'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/surveys')}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <InfoCard title="Preview">
              <Typography variant="body2" paragraph>
                Title: {title || 'Untitled Survey'}
              </Typography>
              <Typography variant="body2" paragraph>
                Description: {description || 'No description'}
              </Typography>
              {ownerGroup && (
                <Box mb={2}>
                  <Chip size="small" label={ownerGroup} />
                </Box>
              )}
              {selectedTemplates.length > 0 && (
                <Box mb={2}>
                  <Typography variant="body2" style={{ fontWeight: 500 }}>
                    Selected Templates:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {selectedTemplates.map((template, idx) => (
                      <Chip
                        key={idx}
                        size="small"
                        label={template?.metadata?.title || template?.metadata?.name}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              <Typography variant="body2">
                Questions: {questions.length}
              </Typography>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
