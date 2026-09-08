import React from 'react';
import { Signup } from './Signup';

export interface RegisterProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const Register: React.FC<RegisterProps> = (props) => {
  return <Signup {...props} />;
};

export default Register;
