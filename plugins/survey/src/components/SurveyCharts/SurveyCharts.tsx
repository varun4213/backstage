import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Question } from '@internal/plugin-survey-common';
import { Box, Typography, Card, CardContent } from '@material-ui/core';
import { motion } from 'framer-motion';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface SurveyChartsProps {
  question: Question;
  responses: any[];
}

interface AnswerCount {
  [key: string]: number;
}

export const SurveyCharts: React.FC<SurveyChartsProps> = ({ question, responses }) => {
  // Process responses to count answers
  const processResponses = (): AnswerCount => {
    const counts: AnswerCount = {};
    
    responses.forEach(response => {
      const answer = response.answers[question.id];
      if (answer !== undefined && answer !== null && answer !== '') {
        const answerKey = String(answer);
        counts[answerKey] = (counts[answerKey] || 0) + 1;
      }
    });
    
    return counts;
  };

  const answerCounts = processResponses();

  // Render MCQ Chart (Pie Chart)
  const renderMCQChart = () => {
    const labels = Object.keys(answerCounts);
    const data = Object.values(answerCounts);
    
    const chartData = {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF',
          ],
          borderColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
            '#FF6384',
            '#C9CBCF',
          ],
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: true,
          text: question.label,
        },
      },
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Pie data={chartData} options={options} />
      </motion.div>
    );
  };

  // Render Rating Chart (Bar Chart)
  const renderRatingChart = () => {
    // Create labels for ratings 1-5
    const ratingLabels = ['1', '2', '3', '4', '5'];
    const ratingCounts = ratingLabels.map(rating => answerCounts[rating] || 0);
    
    const chartData = {
      labels: ratingLabels.map(label => `Rating ${label}`),
      datasets: [
        {
          label: 'Number of Responses',
          data: ratingCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: question.label,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Bar data={chartData} options={options} />
      </motion.div>
    );
  };

  // Render Text Responses (No Chart)
  const renderTextResponses = () => {
    const textAnswers = responses
      .map(response => response.answers[question.id])
      .filter(answer => answer && answer.trim() !== '');

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h6" gutterBottom>
          {question.label}
        </Typography>
        <Box>
          {textAnswers.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No responses yet.
            </Typography>
          ) : (
            textAnswers.map((answer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card style={{ marginBottom: 8 }}>
                  <CardContent style={{ padding: '12px !important' }}>
                    <Typography variant="body2">
                      {answer}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </Box>
      </motion.div>
    );
  };

  if (Object.keys(answerCounts).length === 0 && question.type !== 'text') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {question.label}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              No responses yet for this question.
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardContent>
        {question.type === 'multiple-choice' && renderMCQChart()}
        {question.type === 'rating' && renderRatingChart()}
        {question.type === 'text' && renderTextResponses()}
      </CardContent>
    </Card>
  );
};
