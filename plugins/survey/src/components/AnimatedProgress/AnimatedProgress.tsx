import React from 'react';
import { Box, CircularProgress, Typography } from '@material-ui/core';
import { motion } from 'framer-motion';

export const AnimatedProgress = ({ message = 'Loading...' }: { message?: string }) => {
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
        minHeight: '200px',
      }}
    >
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Typography variant="h6" style={{ marginTop: 16 }} color="textSecondary">
          {message}
        </Typography>
      </motion.div>

      <motion.div
        animate={{ 
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ marginTop: 8 }}
      >
        <Typography variant="body2" color="textSecondary">
          Please wait...
        </Typography>
      </motion.div>
    </motion.div>
  );
};
