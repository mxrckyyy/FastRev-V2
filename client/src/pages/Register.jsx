import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, LoaderCircle, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      nextFieldErrors.password = 'Enter a password.';
    } else if (password.length < 8) {
      nextFieldErrors.password = 'Use at least 8 characters.';
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      (nextFieldErrors.email ? emailInput : e.currentTarget.querySelector('input[type="password"]')).focus();
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password);
      toast({ title: 'Account created', description: 'Welcome to FastRev!', variant: 'success' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Save your reviewed flashcards and come back to study."
      asideTitle="Make your notes easier to remember."
      asideDescription="Turn the material you already have into a study deck, one reviewed card at a time."
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate aria-busy={loading}>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="auth-field">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
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
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            required
          />
          {fieldErrors.email && <p className="auth-field-error" id="register-email-error"><AlertCircle aria-hidden="true" />{fieldErrors.email}</p>}
        </div>
        <div className="auth-field">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                setFieldErrors((current) => ({ ...current, password: '' }));
              }}
              className="auth-input pr-10"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'register-password-error' : 'register-password-help'}
              required
            />
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password
            ? <p className="auth-field-error" id="register-password-error"><AlertCircle aria-hidden="true" />{fieldErrors.password}</p>
            : <p className="auth-field-help" id="register-password-help">Use at least 8 characters.</p>}
        </div>
        <Button type="submit" size="lg" className="auth-submit" disabled={loading}>
          {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating account' : 'Create account'}
        </Button>
        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
