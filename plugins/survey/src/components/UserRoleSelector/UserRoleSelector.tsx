import React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
} from '@material-ui/core';
import { useUserRole, UserRole } from './UserRoleProvider';
import { motion } from 'framer-motion';

const USER_ROLES: { value: UserRole; label: string; description: string; color: 'primary' | 'secondary' | 'default' }[] = [
  {
    value: 'guest1',
    label: 'Guest 1',
    description: 'Can create surveys and view results only',
    color: 'primary',
  },
  {
    value: 'guest2',
    label: 'Guest 2',
    description: 'Can only submit survey responses',
    color: 'secondary',
  },
  {
    value: 'guest3',
    label: 'Guest 3',
    description: 'Can only submit survey responses',
    color: 'default',
  },
];

export const UserRoleSelector: React.FC = () => {
  const { currentUser, setCurrentUser, canCreateSurveys, canViewResults, canSubmitResponses } = useUserRole();

  const currentUserInfo = USER_ROLES.find(role => role.value === currentUser);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box display="flex" alignItems="center" style={{ gap: '16px' }}>
        <FormControl variant="outlined" size="small" style={{ minWidth: 150 }}>
          <InputLabel>Current User</InputLabel>
          <Select
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value as UserRole)}
            label="Current User"
          >
            {USER_ROLES.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                <Box>
                  <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                    {role.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {role.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {currentUserInfo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Chip
              label={currentUserInfo.label}
              color={currentUserInfo.color}
              size="small"
            />
          </motion.div>
        )}

        <Box display="flex" style={{ gap: '8px' }}>
          {canCreateSurveys && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Chip
                label="Create"
                size="small"
                variant="outlined"
                color="primary"
              />
            </motion.div>
          )}
          {canViewResults && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Chip
                label="View Results"
                size="small"
                variant="outlined"
                color="primary"
              />
            </motion.div>
          )}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Chip
              label="Submit"
              size="small"
              variant="outlined"
              color={canSubmitResponses ? "secondary" : "default"}
              style={{ opacity: canSubmitResponses ? 1 : 0.5 }}
            />
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
};
