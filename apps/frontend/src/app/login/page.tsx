'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignInPage, { SignInPageProps } from '@/components/ui/sign-in';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3030/graphql';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'success') {
      router.push('/');
    }
  }, [status, router]);

  const description = useMemo(() => {
    if (status === 'error') {
      return message ?? 'Unable to sign you in. Please try again.';
    }

    if (status === 'success') {
      return 'Signed in successfully. Redirecting you shortly.';
    }

    if (status === 'loading') {
      return 'Validating your credentials...';
    }

    return 'Access your account and continue your journey with us';
  }, [status, message]);

  const handleSignIn: SignInPageProps['onSignIn'] = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get('email') ?? '').toString().trim();
    const password = (formData.get('password') ?? '').toString();
    const rememberMe = formData.get('rememberMe') === 'on';

    if (!email || !password) {
      setStatus('error');
      setMessage('Email and password are required.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: /* GraphQL */ `
            mutation Login($email: String!, $password: String!) {
              login(email: $email, password: $password)
            }
          `,
          variables: { email, password },
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload.errors) {
        const errorMessage =
          payload?.errors?.[0]?.message ?? 'We could not verify your credentials. Please try again.';
        setStatus('error');
        setMessage(errorMessage);
        return;
      }

      const token = payload?.data?.login;
      if (!token) {
        setStatus('error');
        setMessage('No token returned from the server.');
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
        if (rememberMe) {
          localStorage.setItem('authTokenPersistedAt', Date.now().toString());
        }
      }

      setStatus('success');
      setMessage('Signed in successfully!');
      form.reset();
    } catch (error) {
      console.error('Login error', error);
      setStatus('error');
      setMessage('Unexpected error while contacting the server.');
    }
  };

  return (
    <div className="bg-background text-foreground">
      <SignInPage
        title={
          <span className="text-balance text-foreground">
            Welcome back{' '}
          </span>
        }
        description={description}
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        onSignIn={handleSignIn}
        onResetPassword={() => alert('Reset password flow coming soon.')}
        onCreateAccount={() => router.push('/signup')}
      />
    </div>
  );
}
