import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'guest1' | 'guest2' | 'guest3';

interface UserRoleContextType {
  currentUser: UserRole;
  setCurrentUser: (user: UserRole) => void;
  canCreateSurveys: boolean;
  canViewResults: boolean;
  canSubmitResponses: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

interface UserRoleProviderProps {
  children: ReactNode;
}

export const UserRoleProvider: React.FC<UserRoleProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserRole>(() => {
    // Try to get from localStorage first, default to guest1
    const stored = localStorage.getItem('survey-user-role');
    return (stored as UserRole) || 'guest1';
  });

  useEffect(() => {
    // Save to localStorage whenever the user changes
    localStorage.setItem('survey-user-role', currentUser);
  }, [currentUser]);

  const canCreateSurveys = currentUser === 'guest1';
  const canViewResults = currentUser === 'guest1';
  const canSubmitResponses = currentUser !== 'guest1'; // guest2 and guest3 only

  const value: UserRoleContextType = {
    currentUser,
    setCurrentUser,
    canCreateSurveys,
    canViewResults,
    canSubmitResponses,
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
