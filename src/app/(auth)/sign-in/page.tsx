'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { signInSchema } from '@/schemas/signInSchema';

export default function SignInForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setFormError(null);
    const result = await signIn('credentials', {
      redirect: false,
      identifier: data.identifier,
      password: data.password,
    });

    if (result?.error) {
      setFormError(
        result.error === 'CredentialsSignin'
          ? 'That username or password is not right. Check both and try again.'
          : result.error.replace(/^Error:\s*/, '')
      );
      return;
    }
    if (result?.url) router.replace('/dashboard');
  };

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-medium text-olive">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900">Sign in</h1>
        <p className="mt-2 text-sm text-stone-600">Your inbox is waiting.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            name="identifier"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">Email or username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" className="border-leaf focus-visible:ring-olive" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel className="text-stone-900">Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-olive underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    className="border-leaf focus-visible:ring-olive"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <p>{formError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-clay text-white hover:bg-clay-dark"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-stone-600">
        New here?{' '}
        <Link href="/sign-up" className="font-medium text-olive underline-offset-4 hover:underline">
          Create your inbox
        </Link>
      </p>
    </>
  );
}
