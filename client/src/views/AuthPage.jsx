import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import './AuthPage.css';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    // Format username securely to act as an invisible email for the database uniqueness
    const formattedUsername = username.trim();
    if (formattedUsername.length < 3) {
      setErrorMsg("Username must be at least 3 characters.");
      setIsLoading(false);
      return;
    }

    const systemEmail = `${formattedUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@tunetailor.local`;

    if (isLogin) {
      // Handle Login via NextAuth CredentialsProvider
      const res = await signIn('credentials', {
        redirect: false,
        email: systemEmail,
        password
      });

      if (res?.error) {
        setErrorMsg("Invalid username or password. Please try again.");
      } else {
        router.push('/dashboard');
      }
    } else {
      // Handle Registration via Custom API
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: systemEmail, password, username: formattedUsername })
        });
        
        const data = await res.json();
        if (res.ok) {
          // Immediately log them in after a successful register
          await signIn('credentials', { redirect: false, email: systemEmail, password });
          router.push('/dashboard');
        } else {
          setErrorMsg(data.message || "Registration failed.");
        }
      } catch(err) {
        setErrorMsg("Something went wrong. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to view your mood history.' : 'Start tracking your daily moods.'}
        </p>

        {errorMsg && <div style={{color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem'}}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '15px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>OR</div>

        <button type="button" onClick={handleGoogleSignIn} className="auth-submit-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
          <svg style={{width: 18, height: 18}} viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </span>
        </p>
      </div>
    </div>
  );
}
