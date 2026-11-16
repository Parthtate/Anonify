'use client';

import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Trash2 } from 'lucide-react';
import { Message } from '@/model/User';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ApiResponse } from '@/types/ApiResponse';

dayjs.extend(relativeTime);

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
};

export function MessageCard({ message, onMessageDelete }: MessageCardProps) {
  const { toast } = useToast();
  const received = dayjs(message.createdAt);
  const isRecent = received.isAfter(dayjs().subtract(7, 'day'));

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete<ApiResponse>(`/api/delete-message/${message._id}`);
      onMessageDelete(message._id);
      toast({ title: 'Note deleted' });
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Could not delete the note',
        description:
          axiosError.response?.data.message ?? 'Check your connection and try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <article className="flex h-full flex-col justify-between gap-5 rounded-xl border border-leaf bg-white p-5 shadow-sm">
      <p className="whitespace-pre-wrap break-words font-display text-lg leading-relaxed text-stone-800">
        {message.content}
      </p>
      <footer className="flex items-center justify-between gap-3">
        <time
          dateTime={received.toISOString()}
          title={received.format('MMM D, YYYY · h:mm A')}
          className="text-xs uppercase tracking-wide text-stone-500"
        >
          {isRecent ? received.fromNow() : received.format('MMM D, YYYY')}
        </time>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete note"
              className="-mr-2 text-stone-500 hover:bg-red-50 hover:text-red-600 focus-visible:text-red-600"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this note?</AlertDialogTitle>
              <AlertDialogDescription>
                It will be removed from your inbox permanently. The sender is not notified.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className={buttonVariants({ variant: 'destructive' })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </footer>
    </article>
  );
}
