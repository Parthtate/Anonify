'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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
import { forgotPasswordSchema } from '@/schemas/resetPasswordSchema';
import { ApiResponse } from '@/types/ApiResponse';

export default function ForgotPassword() {
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setFormError(null);
    try {
      const { data: res } = await axios.post<ApiResponse>('/api/forgot-password', data);
      setSent(res.message);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setFormError(
        axiosError.response?.data.message ?? 'Could not send the reset link. Please try again.'
      );
    }
  };

  if (sent) {
    return (
      <>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-olive" aria-hidden="true" />
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900">Check your email</h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{sent}</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-stone-600">
          The link lasts an hour and works once. Not there?{' '}
          <button
            type="button"
            onClick={() => setSent(null)}
            className="font-medium text-olive underline-offset-4 hover:underline"
          >
            Try another address
          </button>
          .
        </p>
        <p className="mt-6 text-center text-sm text-stone-600">
          <Link href="/sign-in" className="font-medium text-olive underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-medium text-olive">Forgot your password?</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900">Reset it</h1>
        <p className="mt-2 text-sm text-stone-600">
          Tell us the email you signed up with and we&apos;ll send a link to set a new password.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            name="email"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    autoFocus
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
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Remembered it?{' '}
        <Link href="/sign-in" className="font-medium text-olive underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
