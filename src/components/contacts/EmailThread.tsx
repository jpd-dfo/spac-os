'use client';

import { useEffect } from 'react';
import {
  ArrowLeft,
  Reply,
  Star,
  StarOff,
  Loader2,
  AlertCircle,
  User,
} from 'lucide-react';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface EmailThreadProps {
  threadId: string;
  onClose: () => void;
  onReply?: (thread: { threadId: string; subject: string; to: string }) => void;
}

export function EmailThread({ threadId, onClose, onReply }: EmailThreadProps) {
  const utils = trpc.useUtils();

  // Fetch thread
  const threadQuery = trpc.email.getThread.useQuery({ threadId });

  // Mutations
  const toggleStarMutation = trpc.email.toggleStar.useMutation({
    onSuccess: () => {
      utils.email.getThread.invalidate({ threadId });
      utils.email.list.invalidate();
    },
  });

  const markReadMutation = trpc.email.markRead.useMutation({
    onSuccess: () => {
      utils.email.list.invalidate();
    },
  });

  // Mark all messages in thread as read on open
  useEffect(() => {
    if (threadQuery.data?.emails) {
      const unreadMessages = threadQuery.data.emails.filter((m) => !m.isRead);
      unreadMessages.forEach((msg) => {
        markReadMutation.mutate({ id: msg.id, isRead: true });
      });
    }
  }, [threadQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = () => {
    if (!threadQuery.data?.emails.length) { return; }
    const lastMessage = threadQuery.data.emails[threadQuery.data.emails.length - 1];
    if (!lastMessage) { return; }
    onReply?.({
      threadId,
      subject: lastMessage.subject || '',
      to: lastMessage.direction === 'INBOUND' ? lastMessage.fromEmail : lastMessage.toEmails[0] || '',
    });
  };

  if (threadQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (threadQuery.isError || !threadQuery.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm text-slate-500">Failed to load email thread</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={onClose}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { emails } = threadQuery.data;
  const firstMessage = emails[0];
  const subject = firstMessage?.subject || '(No subject)';

  return (
    <Card>
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="secondary" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => firstMessage && toggleStarMutation.mutate({ id: firstMessage.id })}
            >
              {firstMessage?.isStarred ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </Button>
            {onReply && (
              <Button variant="primary" size="sm" onClick={handleReply}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
            )}
          </div>
        </div>
        <h1 className="text-xl font-semibold text-slate-900">{subject}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {emails.length} message{emails.length !== 1 ? 's' : ''} in this thread
        </p>
      </div>

      {/* Messages */}
      <CardContent className="p-0 divide-y divide-slate-100">
        {emails.map((message, index) => (
          <div key={message.id} className="p-4">
            {/* Message Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 truncate">
                    {message.direction === 'INBOUND' ? message.fromEmail : 'Me'}
                  </span>
                  <Badge variant={message.direction === 'INBOUND' ? 'secondary' : 'primary'} size="sm">
                    {message.direction === 'INBOUND' ? 'Received' : 'Sent'}
                  </Badge>
                </div>
                <div className="text-sm text-slate-500">
                  {message.direction === 'OUTBOUND' && (
                    <span>to {message.toEmails.join(', ')}</span>
                  )}
                  {message.ccEmails && message.ccEmails.length > 0 && (
                    <span className="ml-2">cc: {message.ccEmails.join(', ')}</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {format(new Date(message.date), 'PPpp')}
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div
              className={cn(
                'prose prose-sm max-w-none',
                'prose-p:my-2 prose-headings:my-2',
                'text-slate-700'
              )}
            >
              {message.body ? (
                // Render HTML safely - in production, use DOMPurify
                <div
                  dangerouslySetInnerHTML={{ __html: message.body }}
                  className="overflow-x-auto"
                />
              ) : (
                <p className="text-slate-500 italic">{message.snippet || '(Empty message)'}</p>
              )}
            </div>

            {/* Expand/collapse for long threads */}
            {index < emails.length - 1 && emails.length > 3 && index !== 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Show quoted text
                </button>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      {/* Reply Footer */}
      {onReply && (
        <div className="border-t border-slate-200 p-4">
          <Button variant="primary" className="w-full" onClick={handleReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply to this thread
          </Button>
        </div>
      )}
    </Card>
  );
}

export default EmailThread;
