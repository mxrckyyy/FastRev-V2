import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const nextFieldErrors = {};
    const emailInput = e.currentTarget.querySelector('input[type="email"]');
    if (!email.trim() || !emailInput.validity.valid) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextFieldErrors.password = 'Enter your password.';
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      (nextFieldErrors.email ? emailInput : e.currentTarget.querySelector('input[type="password"]')).focus();
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to pick up where your studying left off."
      asideTitle="Your next study session is close."
      asideDescription="Return to your saved decks, keep reviewing, and make progress at your own pace."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate aria-busy={loading}>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="auth-field">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              setFieldErrors((current) => ({ ...current, email: '' }));
            }}
            className="auth-input"
            autoComplete="email"
            autoCapitalize="none"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            required
          />
          {fieldErrors.email && <p className="auth-field-error" id="login-email-error"><AlertCircle aria-hidden="true" />{fieldErrors.email}</p>}
        </div>
        <div className="auth-field">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
              setFieldErrors((current) => ({ ...current, password: '' }));
            }}
            className="auth-input"
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            required
          />
          {fieldErrors.password && <p className="auth-field-error" id="login-password-error"><AlertCircle aria-hidden="true" />{fieldErrors.password}</p>}
        </div>
        <Button type="submit" size="lg" className="auth-submit" disabled={loading}>
          {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {loading ? 'Logging in' : 'Log in'}
        </Button>
        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
