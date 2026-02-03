'use client';

import { useState, useMemo } from 'react';
import {
  Mail,
  Star,
  StarOff,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
  Send,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface EmailInboxProps {
  contactId?: string;
  onSelectThread?: (threadId: string) => void;
  onCompose?: () => void;
}

type FilterType = 'all' | 'unread' | 'starred' | 'inbound' | 'outbound';

export function EmailInbox({ contactId, onSelectThread, onCompose }: EmailInboxProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const utils = trpc.useUtils();

  // Check Gmail connection status
  const statusQuery = trpc.email.getStatus.useQuery();

  // Fetch emails
  const emailsQuery = trpc.email.list.useQuery(
    {
      contactId,
      isRead: filter === 'unread' ? false : undefined,
      isStarred: filter === 'starred' ? true : undefined,
      direction: filter === 'inbound' ? 'INBOUND' : filter === 'outbound' ? 'OUTBOUND' : undefined,
      pageSize: 50,
    },
    { enabled: statusQuery.data?.isConnected }
  );

  // Mutations
  const syncMutation = trpc.email.sync.useMutation({
    onSuccess: () => {
      toast.success('Inbox synced');
      utils.email.list.invalidate();
    },
    onError: () => toast.error('Failed to sync inbox'),
  });

  const toggleStarMutation = trpc.email.toggleStar.useMutation({
    onSuccess: () => utils.email.list.invalidate(),
  });

  const markReadMutation = trpc.email.markRead.useMutation({
    onSuccess: () => utils.email.list.invalidate(),
  });

  const emails = useMemo(() => emailsQuery.data?.items ?? [], [emailsQuery.data]);

  const handleEmailClick = (email: typeof emails[0]) => {
    if (!email.isRead) {
      markReadMutation.mutate({ id: email.id, isRead: true });
    }
    onSelectThread?.(email.threadId);
  };

  // Not connected state
  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!statusQuery.data?.isConnected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Mail className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Connect Gmail</h3>
          <p className="text-sm text-slate-500 mb-4">
            Connect your Gmail account to sync emails with contacts.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/api/auth/google?service=gmail'}
          >
            <Mail className="h-4 w-4 mr-2" />
            Connect Gmail
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <div className="flex gap-1">
            {(['all', 'unread', 'starred', 'inbound', 'outbound'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors',
                  filter === f
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => syncMutation.mutate({})}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={cn('h-4 w-4', syncMutation.isPending && 'animate-spin')} />
          </Button>
          {onCompose && (
            <Button variant="primary" size="sm" onClick={onCompose}>
              <Send className="h-4 w-4 mr-2" />
              Compose
            </Button>
          )}
        </div>
      </div>

      {/* Email List */}
      <CardContent className="p-0">
        {emailsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : emailsQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm text-slate-500">Failed to load emails</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => emailsQuery.refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">No emails found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {emails.map((email) => (
              <div
                key={email.id}
                onClick={() => handleEmailClick(email)}
                className={cn(
                  'flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors',
                  !email.isRead && 'bg-blue-50/50'
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStarMutation.mutate({ id: email.id });
                  }}
                  className="mt-1 text-slate-400 hover:text-yellow-500"
                >
                  {email.isStarred ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-sm truncate', !email.isRead && 'font-semibold')}>
                      {email.direction === 'INBOUND' ? email.fromEmail : email.toEmails[0]}
                    </span>
                    <Badge variant={email.direction === 'INBOUND' ? 'secondary' : 'primary'} size="sm">
                      {email.direction === 'INBOUND' ? 'Received' : 'Sent'}
                    </Badge>
                  </div>
                  <p className={cn('text-sm truncate', !email.isRead ? 'text-slate-900' : 'text-slate-600')}>
                    {email.subject || '(No subject)'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-1">{email.snippet}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmailInbox;
