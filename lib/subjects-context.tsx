import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubjectsContextType {
  selectedTopics: Set<string>;
  setSelectedTopics: (topics: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

const SubjectsContext = createContext<SubjectsContextType | undefined>(undefined);

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  return (
    <SubjectsContext.Provider value={{ selectedTopics, setSelectedTopics }}>
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  const context = useContext(SubjectsContext);
  if (context === undefined) {
    throw new Error('useSubjects must be used within a SubjectsProvider');
  }
  return context;
}
