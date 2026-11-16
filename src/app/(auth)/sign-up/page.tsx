'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from 'usehooks-ts';
import * as z from 'zod';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { signUpSchema } from '@/schemas/signUpSchema';
import { ApiResponse } from '@/types/ApiResponse';

export default function SignUpForm() {
  const [username, setUsername] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');
  const debouncedUsername = useDebounce(username, 300);

  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', email: '', password: '' },
  });

  useEffect(() => {
    setOrigin(window.location.host);
    // Read the name straight off the URL rather than via useSearchParams, which would
    // force this page out of static rendering. Set by the landing page's "claim" field.
    const requested = new URLSearchParams(window.location.search).get('username');
    const cleaned = requested?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
    if (cleaned) {
      form.setValue('username', cleaned);
      setUsername(cleaned);
    }
  }, [form]);

  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (!debouncedUsername) return;
      setIsCheckingUsername(true);
      setUsernameMessage('');
      try {
        const response = await axios.get<ApiResponse>(
          `/api/check-username-unique?username=${encodeURIComponent(debouncedUsername)}`
        );
        setUsernameMessage(response.data.message);
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        setUsernameMessage(axiosError.response?.data.message ?? 'Could not check that username');
      } finally {
        setIsCheckingUsername(false);
      }
    };
    checkUsernameUnique();
  }, [debouncedUsername]);

  const isAvailable = usernameMessage === 'Username is unique';

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const response = await axios.post<ApiResponse>('/api/sign-up', data);
      toast({ title: 'Check your email', description: response.data.message });
      router.replace(`/verify/${encodeURIComponent(data.username)}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      setFormError(
        axiosError.response?.data.message ??
          'Something went wrong while creating your inbox. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-center">
        <p className="text-sm font-medium text-olive">Create your inbox</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-stone-900">Pick your link</h1>
        <p className="mt-2 text-sm text-stone-600">
          Your username becomes the link people use to write to you.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <FormField
            name="username"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">Username</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="border-leaf focus-visible:ring-olive"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      setUsername(e.target.value);
                    }}
                  />
                </FormControl>
                {/* One line of help at rest, like Email and Password below — reserving
                    space for the link preview here left a visible hole under the field. */}
                <div className="space-y-0.5 text-xs leading-4">
                  {username ? (
                    <>
                      <p className="truncate font-mono text-stone-500">
                        {origin}/u/{username}
                      </p>
                      {isCheckingUsername ? (
                        <p className="flex items-center gap-1.5 text-stone-500">
                          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          Checking availability…
                        </p>
                      ) : (
                        usernameMessage && (
                          <p
                            className={`flex items-center gap-1.5 ${
                              isAvailable ? 'text-olive' : 'text-red-600'
                            }`}
                          >
                            {isAvailable && <Check className="h-3 w-3" aria-hidden="true" />}
                            {isAvailable ? `@${username} is available` : usernameMessage}
                          </p>
                        )
                      )}
                    </>
                  ) : (
                    <p className="text-stone-500">Letters, numbers and underscores.</p>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className="border-leaf focus-visible:ring-olive"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-stone-500">
                  We&apos;ll send a 6-digit code here to confirm it.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-stone-900">Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    className="border-leaf focus-visible:ring-olive"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-stone-500">At least 6 characters.</p>
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
                Creating your inbox…
              </>
            ) : (
              'Create inbox'
            )}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Already have an inbox?{' '}
        <Link href="/sign-in" className="font-medium text-olive underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
