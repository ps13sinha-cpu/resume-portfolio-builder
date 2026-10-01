import React from 'react';
import { CinematicChromeLogin } from './CinematicChromeLogin';

export const AuthScreen = ({ onComplete }) => {
  return <CinematicChromeLogin onComplete={onComplete} />;
};
