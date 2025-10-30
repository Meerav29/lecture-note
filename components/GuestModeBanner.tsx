'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnonymous } from '../contexts/AnonymousContext';
import { AuthModal } from './auth/AuthModal';

export function GuestModeBanner() {
  const { user } = useAuth();
  const { isAnonymous } = useAnonymous();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Don't show banner if user is logged in or not in anonymous mode
  if (user || !isAnonymous) {
    return null;
  }

  return (
    <>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div className="guest-banner">
        <div className="guest-banner-content">
          <div className="guest-banner-icon">👤</div>
          <div className="guest-banner-text">
            <strong>Guest Mode</strong>
            <span>Your work will not be saved. Sign up to keep your lectures and transcripts.</span>
          </div>
        </div>
        <button
          className="guest-banner-button"
          onClick={() => setShowAuthModal(true)}
        >
          Sign Up Free
        </button>
      </div>
    </>
  );
}
