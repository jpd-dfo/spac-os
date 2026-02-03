'use client';

import { useState } from 'react';
import {
  Calendar,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface CalendlyBookingProps {
  contactId?: string;
  contactEmail?: string;
  contactName?: string;
}

export function CalendlyBooking({ contactId, contactEmail, contactName }: CalendlyBookingProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);

  // Check Calendly connection
  const statusQuery = trpc.calendar.getCalendlyStatus.useQuery();

  // Get scheduling links
  const linksQuery = trpc.calendar.getCalendlyLinks.useQuery(undefined, {
    enabled: statusQuery.data?.connected,
  });

  // Create booking link mutation
  const createLinkMutation = trpc.calendar.createCalendlyLink.useMutation({
    onSuccess: (data) => {
      if (data.bookingUrl) {
        handleCopyLink(data.bookingUrl);
      }
    },
    onError: () => toast.error('Failed to create booking link'),
  });

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedLink(null), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleCreatePersonalizedLink = () => {
    if (!selectedEventType) {
      toast.error('Please select an event type');
      return;
    }
    if (!contactId) {
      toast.error('Contact is required');
      return;
    }
    createLinkMutation.mutate({
      contactId,
      eventTypeUri: selectedEventType,
    });
  };

  // Not connected state
  if (statusQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!statusQuery.data?.connected) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-medium text-slate-900 mb-1">Connect Calendly</h3>
          <p className="text-xs text-slate-500 mb-3">
            Connect Calendly to generate scheduling links for contacts.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/settings/integrations'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Setup Integration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-slate-900">Calendly Booking</h3>
          </div>
          <Badge variant="success" size="sm">Connected</Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {linksQuery.isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : linksQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-4">
            <AlertCircle className="h-6 w-6 text-red-400 mb-2" />
            <p className="text-sm text-slate-500">Failed to load event types</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Event Type Selection */}
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Select Event Type
              </span>
              <div className="space-y-2">
                {linksQuery.data?.links?.map((link) => (
                  <button
                    key={link.uri || link.schedulingUrl}
                    onClick={() => setSelectedEventType(link.uri || link.schedulingUrl)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left',
                      selectedEventType === (link.uri || link.schedulingUrl)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{link.name}</div>
                      {link.duration && (
                        <div className="text-xs text-slate-500">{link.duration} minutes</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(link.schedulingUrl);
                        }}
                      >
                        {copiedLink === link.schedulingUrl ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(link.schedulingUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Personalized Link */}
            {contactEmail && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  Create Personalized Link
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Generate a pre-filled booking link for {contactName || contactEmail}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={handleCreatePersonalizedLink}
                  disabled={!selectedEventType || createLinkMutation.isPending}
                >
                  {createLinkMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Create & Copy Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendlyBooking;
