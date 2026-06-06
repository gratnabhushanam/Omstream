import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Registration is now part of the unified Login flow (JioHotstar-style OTP).
// New users are auto-detected and onboarded from /login.
export default function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}
