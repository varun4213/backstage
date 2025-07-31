import { Typography, Button } from '@material-ui/core';
import { motion } from 'framer-motion';
import { ErrorOutline } from '@material-ui/icons';

interface AnimatedErrorProps {
  error: Error;
  onRetry?: () => void;
}

export const AnimatedError = ({ error, onRetry }: AnimatedErrorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '2rem',
      }}
    >
      <motion.div
        animate={{ 
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 0.5, repeat: 2 },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <ErrorOutline style={{ fontSize: 60, color: '#f44336' }} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ textAlign: 'center', marginTop: 16 }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Oops! Something went wrong
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {error.message || 'An unexpected error occurred'}
        </Typography>
      </motion.div>

      {onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={onRetry}
            style={{ marginTop: 16 }}
          >
            Try Again
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};
