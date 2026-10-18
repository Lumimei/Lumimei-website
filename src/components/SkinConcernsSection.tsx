import React from 'react';
import { Language } from '../types';

interface SkinConcernsSectionProps {
  language?: Language;
  onOpenAiAdvisor?: () => void;
  onOpenFreeAnalysis?: () => void;
  onNavigateToProducts?: () => void;
  onSelectConcern?: (concernId: string) => void;
}

export const SkinConcernsSection: React.FC<SkinConcernsSectionProps> = () => {
  return null;
};
