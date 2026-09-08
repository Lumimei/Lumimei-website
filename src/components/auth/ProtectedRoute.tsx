import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onUnauthenticated: () => void;
  onProfileIncomplete?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onUnauthenticated,
  onProfileIncomplete,
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  const onUnauthRef = useRef(onUnauthenticated);
  const onProfileIncompleteRef = useRef(onProfileIncomplete);

  useEffect(() => {
    onUnauthRef.current = onUnauthenticated;
    onProfileIncompleteRef.current = onProfileIncomplete;
  });

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        onUnauthRef.current();
      } else if (!userProfile && onProfileIncompleteRef.current) {
        onProfileIncompleteRef.current();
      }
    }
  }, [loading, currentUser, userProfile]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">កំពុងពិនិត្យគណនី...</p>
      </div>
    );
  }

  if (!currentUser || (!userProfile && onProfileIncomplete)) {
    return null;
  }

  return <>{children}</>;
};
