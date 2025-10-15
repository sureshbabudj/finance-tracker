'use client';

import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Separator } from './ui/separator';

const GoogleIcon = () => (
  <svg className='size-4' viewBox='0 0 24 24'>
    <path
      fill='currentColor'
      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
    />
    <path
      fill='currentColor'
      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
    />
    <path
      fill='currentColor'
      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
    />
    <path
      fill='currentColor'
      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
    />
  </svg>
);

const LoginScreen = () => {
  const { signInWithGoogle, loading, error } = useAuth();

  const handleLogin = async (useRedirect = false) => {
    try {
      await signInWithGoogle(useRedirect);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* App Header */}
        <div className='text-center mb-8 flex items-center justify-center gap-2'>
          <div className='bg-primary rounded-lg p-2'>
            <CreditCard className='w-4 h-4 text-primary-foreground' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Kanini Financial Analyzer
          </h1>
        </div>

        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-xl'>Welcome!</CardTitle>
            <CardDescription>
              Sign in to access your bank statement analysis
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <div className='flex items-start gap-3 p-3 text-sm border border-destructive/20 bg-destructive/5 rounded-lg'>
                <AlertCircle className='size-4 text-destructive mt-0.5 shrink-0' />
                <div className='space-y-1'>
                  <div className='font-medium text-destructive'>
                    Authentication Error
                  </div>
                  <div className='text-muted-foreground'>{error}</div>
                </div>
              </div>
            )}

            <div className='space-y-3'>
              <Button
                onClick={() => handleLogin(false)}
                disabled={loading}
                className='w-full'
                size='lg'
              >
                {loading ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <GoogleIcon />
                )}
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Button>

              <Button
                onClick={() => handleLogin(true)}
                disabled={loading}
                variant='outline'
                className='w-full hidden'
                size='lg'
              >
                <GoogleIcon />
                Continue with Google (Redirect)
              </Button>
            </div>

            <div className='relative'>
              <Separator />
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='bg-background px-2 text-xs text-muted-foreground'>
                  Secure authentication via Firebase
                </span>
              </div>
            </div>

            <div className='text-center'>
              <p className='text-xs text-muted-foreground leading-relaxed'>
                Your financial data stays private and secure. We use Firebase
                authentication to protect your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;
