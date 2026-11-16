'use client';

import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { verifySchema } from '@/schemas/verifySchema';
import { ApiResponse } from '@/types/ApiResponse';

export default function VerifyAccount() {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' },
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    // Prefill from the email's one-tap link. Read off the URL rather than with
    // useSearchParams, which would force this page out of static rendering.
    const code = new URLSearchParams(window.location.search).get('code');
    if (code && /^\d{6}$/.test(code)) form.setValue('code', code, { shouldValidate: true });
  }, [form]);

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setFormError(null);
    try {
      await axios.post<ApiResponse>('/api/verify-code', {
        username: params.username,
        code: data.code,
      });
      toast({ title: 'Email verified', description: 'Sign in to open your inbox.' });
      router.replace('/sign-in');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setFormError(
        axiosError.response?.data.message ?? 'Could not verify the code. Please try again.'
      );
    }
  };

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-medium text-olive">Almost there</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900">Check your email</h1>
        <p className="mt-2 text-sm text-stone-600">
          We sent a 6-digit code to the address you signed up with. It expires in an hour.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            name="code"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">Verification code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    className="h-12 border-leaf text-center font-mono text-2xl tracking-[0.5em] focus-visible:ring-olive"
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
                Verifying…
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Didn&apos;t get it? Check your spam folder, or{' '}
        <Link href="/sign-up" className="font-medium text-olive underline-offset-4 hover:underline">
          sign up again
        </Link>{' '}
        to receive a new code.
      </p>
    </>
  );
}
