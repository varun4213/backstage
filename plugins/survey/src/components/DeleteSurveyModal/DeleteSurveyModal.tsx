import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@material-ui/core';
import { Close as CloseIcon, Warning as WarningIcon } from '@material-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@material-ui/core/styles';
import { Survey } from '@internal/plugin-survey-common';

interface DeleteSurveyModalProps {
  open: boolean;
  survey: Survey | null;
  onClose: () => void;
  onConfirm: (surveyId: string) => void;
  loading?: boolean;
}

export const DeleteSurveyModal: React.FC<DeleteSurveyModalProps> = ({
  open,
  survey,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  
  // Theme-aware colors
  const dialogBg = isDark ? theme.palette.background.paper || '#2a2a2a' : '#ffffff';
  const textPrimary = isDark ? theme.palette.text.primary || '#ffffff' : '#000000';
  const textSecondary = isDark ? theme.palette.text.secondary || '#b0b0b0' : '#666666';
  const cardBg = isDark ? theme.palette.background.default || '#1e1e1e' : '#f5f5f5';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const handleConfirm = () => {
    if (survey) {
      onConfirm(survey.id);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            style: {
              borderRadius: '12px',
              padding: '8px',
              backgroundColor: dialogBg,
              color: textPrimary,
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <DialogTitle style={{ padding: '24px 24px 16px' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" style={{ gap: '12px' }}>
                  <WarningIcon style={{ color: '#f44336' }} />
                  <Typography variant="h6" style={{ fontWeight: 600, color: textPrimary }}>
                    Delete Survey
                  </Typography>
                </Box>
                <IconButton
                  edge="end"
                  onClick={onClose}
                  disabled={loading}
                  style={{ 
                    marginTop: '-8px', 
                    marginRight: '-8px',
                    color: textSecondary,
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent style={{ padding: '0 24px 16px' }}>
              <Typography variant="body1" style={{ marginBottom: '16px', color: textPrimary }}>
                Are you sure you want to delete this survey? This action cannot be undone.
              </Typography>
              
              {survey && (
                <Box
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: '8px',
                    padding: '16px',
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: '4px', color: textPrimary }}>
                    {survey.title}
                  </Typography>
                  <Typography variant="body2" style={{ color: textSecondary }}>
                    {survey.description}
                  </Typography>
                  <Typography variant="caption" style={{ marginTop: '8px', display: 'block', color: textSecondary }}>
                    Created: {new Date(survey.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions style={{ padding: '16px 24px 24px', gap: '12px' }}>
              <Button
                onClick={onClose}
                variant="outlined"
                disabled={loading}
                style={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  padding: '8px 24px',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  color: textPrimary,
                }}
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                <Button
                  onClick={handleConfirm}
                  variant="contained"
                  disabled={loading}
                  style={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '8px 24px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Deleting...' : 'Delete Survey'}
                </Button>
              </motion.div>
            </DialogActions>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};
