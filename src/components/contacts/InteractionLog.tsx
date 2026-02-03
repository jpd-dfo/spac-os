'use client';

import { useState } from 'react';

import {
  Mail,
  Phone,
  Video,
  Calendar,
  FileText,
  CheckSquare,
  Plus,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

import type { ContactInteraction, InteractionType } from './mockContactsData';

interface InteractionLogProps {
  interactions: ContactInteraction[];
  contactName: string;
  onAddInteraction?: () => void;
  maxItems?: number;
  showAddButton?: boolean;
}

interface AddInteractionFormProps {
  onSubmit: (interaction: Omit<ContactInteraction, 'id'>) => void;
  onCancel: () => void;
  contactName: string;
}

function getInteractionIcon(type: InteractionType) {
  const icons: Record<InteractionType, React.ReactNode> = {
    email: <Mail className="h-4 w-4" />,
    call: <Phone className="h-4 w-4" />,
    meeting: <Video className="h-4 w-4" />,
    note: <FileText className="h-4 w-4" />,
    task: <CheckSquare className="h-4 w-4" />,
  };
  return icons[type];
}

function getInteractionColor(type: InteractionType) {
  const colors: Record<InteractionType, string> = {
    email: 'bg-blue-100 text-blue-600',
    call: 'bg-green-100 text-green-600',
    meeting: 'bg-purple-100 text-purple-600',
    note: 'bg-amber-100 text-amber-600',
    task: 'bg-teal-100 text-teal-600',
  };
  return colors[type];
}

function getInteractionBorderColor(type: InteractionType) {
  const colors: Record<InteractionType, string> = {
    email: 'border-blue-200',
    call: 'border-green-200',
    meeting: 'border-purple-200',
    note: 'border-amber-200',
    task: 'border-teal-200',
  };
  return colors[type];
}

function InteractionItem({ interaction }: { interaction: ContactInteraction }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'relative pl-8 pb-6 border-l-2 border-slate-200 last:pb-0',
        'before:absolute before:left-[-9px] before:top-0 before:h-4 before:w-4 before:rounded-full before:border-2 before:border-white before:bg-slate-200'
      )}
    >
      {/* Timeline dot with icon */}
      <div
        className={cn(
          'absolute left-[-18px] top-0 h-8 w-8 rounded-full flex items-center justify-center',
          getInteractionColor(interaction.type)
        )}
      >
        {getInteractionIcon(interaction.type)}
      </div>

      {/* Content */}
      <div className={cn('ml-2 rounded-lg border bg-white p-4', getInteractionBorderColor(interaction.type))}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge size="sm" className={getInteractionColor(interaction.type)}>
                {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(interaction.date)}
              </span>
            </div>
            <h4 className="font-medium text-slate-900">{interaction.subject}</h4>
          </div>
          {interaction.description && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {isExpanded && interaction.description && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-sm text-slate-600">{interaction.description}</p>

            {interaction.participants && interaction.participants.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                <span>Participants: {interaction.participants.join(', ')}</span>
              </div>
            )}

            {interaction.linkedDealId && (
              <div className="mt-2 flex items-center gap-2 text-xs text-primary-600">
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Linked to Deal #{interaction.linkedDealId}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 text-xs text-slate-400">{formatDate(interaction.date)}</div>
      </div>
    </div>
  );
}

function AddInteractionForm({ onSubmit, onCancel, contactName }: AddInteractionFormProps) {
  const [type, setType] = useState<InteractionType>('note');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      subject,
      description,
      date: new Date().toISOString(),
      participants: participants
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    });
    setSubject('');
    setDescription('');
    setParticipants('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <h4 className="font-medium text-slate-900">Log Interaction with {contactName}</h4>

      <div>
        <span className="block text-sm font-medium text-slate-700 mb-1.5">Type</span>
        <div className="flex flex-wrap gap-2">
          {(['email', 'call', 'meeting', 'note', 'task'] as InteractionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                type === t
                  ? getInteractionColor(t)
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {getInteractionIcon(t)}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject..."
          className="input"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this interaction..."
          rows={3}
          className="input resize-none"
        />
      </div>

      {(type === 'meeting' || type === 'call') && (
        <div>
          <label htmlFor="participants" className="block text-sm font-medium text-slate-700 mb-1.5">
            Participants (comma-separated)
          </label>
          <input
            id="participants"
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="John Doe, Jane Smith..."
            className="input"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm">
          Log Interaction
        </Button>
      </div>
    </form>
  );
}

export function InteractionLog({
  interactions,
  contactName,
  onAddInteraction,
  maxItems,
  showAddButton = true,
}: InteractionLogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [localInteractions, setLocalInteractions] = useState(interactions);

  const sortedInteractions = [...localInteractions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedInteractions = maxItems
    ? sortedInteractions.slice(0, maxItems)
    : sortedInteractions;

  const handleAddInteraction = (newInteraction: Omit<ContactInteraction, 'id'>) => {
    const interactionWithId: ContactInteraction = {
      ...newInteraction,
      id: `int-${Date.now()}`,
    };
    setLocalInteractions([interactionWithId, ...localInteractions]);
    setShowAddForm(false);
    onAddInteraction?.();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Timeline</CardTitle>
        {showAddButton && !showAddForm && (
          <Button variant="secondary" size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Log Activity
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-6">
            <AddInteractionForm
              onSubmit={handleAddInteraction}
              onCancel={() => setShowAddForm(false)}
              contactName={contactName}
            />
          </div>
        )}

        {displayedInteractions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No interactions recorded yet</p>
            {showAddButton && !showAddForm && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Log First Interaction
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            {displayedInteractions.map((interaction) => (
              <InteractionItem key={interaction.id} interaction={interaction} />
            ))}

            {maxItems && sortedInteractions.length > maxItems && (
              <div className="text-center pt-4">
                <Button variant="link" size="sm">
                  View all {sortedInteractions.length} interactions
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InteractionLog;
