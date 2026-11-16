'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
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
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/components/ui/use-toast';
import { resetPasswordSchema } from '@/schemas/resetPasswordSchema';
import { ApiResponse } from '@/types/ApiResponse';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setFormError(null);
    try {
      await axios.post<ApiResponse>('/api/reset-password', { ...data, token });
      toast({ title: 'Password updated', description: 'Sign in with your new password.' });
      router.replace('/sign-in');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setFormError(
        axiosError.response?.data.message ?? 'Could not reset the password. Please try again.'
      );
    }
  };

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-medium text-olive">Almost done</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Pick something you&apos;ll remember. This link stops working once you&apos;re done.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">New password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    autoFocus
                    className="border-leaf focus-visible:ring-olive"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-stone-500">At least 6 characters.</p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="confirmPassword"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
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
                Updating…
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Link expired?{' '}
        <Link
          href="/forgot-password"
          className="font-medium text-olive underline-offset-4 hover:underline"
        >
          Request a new one
        </Link>
      </p>
    </>
  );
}
