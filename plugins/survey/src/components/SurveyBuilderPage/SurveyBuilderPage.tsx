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
import { useApi, configApiRef, fetchApiRef, alertApiRef } from '@backstage/core-plugin-api';
import { CreateSurveyRequest, Question } from '@internal/plugin-survey-common';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../UserRoleSelector';

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
    <motion.div
      layout
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ 
        layout: { duration: 0.3 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.3 }
      }}
      whileHover={{ scale: 1.02 }}
    >
      <Card style={{ marginBottom: 16 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={11}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TextField
                  fullWidth
                  label="Question"
                  value={question.label || ''}
                  onChange={handleLabelChange}
                  margin="normal"
                />
              </motion.div>
            </Grid>
            <Grid item xs={1}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <IconButton onClick={handleRemoveQuestion}>
                  <DeleteIcon />
                </IconButton>
              </motion.div>
            </Grid>
            <Grid item xs={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
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
              </motion.div>
            </Grid>
            <AnimatePresence>
              {question.type === 'multiple-choice' && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                >
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Options:
                    </Typography>
                    <AnimatePresence>
                      {question.options?.map((option, index) => (
                        <motion.div
                          key={index}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Box display="flex" alignItems="center" mb={1}>
                            <TextField
                              fullWidth
                              size="small"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                            />
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveOption(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </motion.div>
                          </Box>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        startIcon={<AddIcon />} 
                        onClick={handleAddOption}
                        size="small"
                      >
                        Add Option
                      </Button>
                    </motion.div>
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
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
  const { canCreateSurveys } = useUserRole();

  // Redirect if user doesn't have permission to create surveys
  useEffect(() => {
    if (!canCreateSurveys) {
      navigate('/surveys');
    }
  }, [canCreateSurveys, navigate]);

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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Header title="Create Survey" subtitle="Build a feedback form for the developer community" />
      </motion.div>
      <Content>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Box mt={3}>
              <ContentHeader title="Questions">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addQuestion}
                  >
                    Add Question
                  </Button>
                </motion.div>
              </ContentHeader>
              <AnimatePresence>
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
              </AnimatePresence>
              {questions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card>
                    <CardContent>
                      <motion.div
                        animate={{ 
                          y: [0, -5, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Typography variant="body1" color="textSecondary" align="center">
                          No questions added yet. Click "Add Question" to get started.
                        </Typography>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Box>

            <Box mt={3} display="flex">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ marginRight: 16 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Survey'}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => navigate('/surveys')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </motion.div>
            </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <InfoCard title="Preview">
              <Box style={{ background: '#23272f', borderRadius: 12, padding: 16 }}>
                <Typography variant="h6" style={{ fontWeight: 600, marginBottom: 8, color: '#fff' }}>
                  Survey
                </Typography>
                <Typography variant="body2" paragraph style={{ color: '#fff' }}>
                  Title: {title || 'Untitled Survey'}
                </Typography>
                <Typography variant="body2" paragraph style={{ color: '#fff' }}>
                  Description: {description || 'No description'}
                </Typography>
                {ownerGroup && (
                  <Box mb={2}>
                    <Chip size="small" label={ownerGroup} style={{ background: '#333', color: '#fff' }} />
                  </Box>
                )}
                {selectedTemplates.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="body2" style={{ fontWeight: 500, color: '#fff' }} gutterBottom>
                      Related Templates Preview:
                    </Typography>
                    <Card variant="outlined" style={{ padding: '12px', backgroundColor: '#181a20', borderColor: '#444' }}>
                      <Typography variant="caption" style={{ color: '#bbb' }} gutterBottom>
                        These templates are related to the Survey Center and will be linked to your survey
                      </Typography>
                      <Box display="flex" flexWrap="wrap" mt={1} style={{ gap: '8px' }}>
                        {selectedTemplates.map((template, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <Chip
                              size="small"
                              label={template?.metadata?.title || template?.metadata?.name}
                              color="primary"
                              variant="outlined"
                              style={{ backgroundColor: '#23272f', color: '#fff', borderColor: '#1976d2' }}
                            />
                          </motion.div>
                        ))}
                      </Box>
                      {selectedTemplates.length > 0 && (
                        <Typography variant="caption" style={{ marginTop: '8px', display: 'block', color: '#90caf9' }}>
                          ✓ Survey will appear in Survey Center with these template associations
                        </Typography>
                      )}
                    </Card>
                  </Box>
                )}
                <Typography variant="body2" style={{ color: '#fff' }}>
                  Questions: {questions.length}
                </Typography>
              </Box>
            </InfoCard>
            </motion.div>
          </Grid>
        </Grid>
        </motion.div>
      </Content>
    </Page>
  );
};
