'use client';

import { useState } from 'react';

import {
  Mail,
  Phone,
  Linkedin,
  Building,
  Calendar,
  Star,
  MoreHorizontal,
  MessageSquare,
  Video,
  ExternalLink,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatRelativeTime } from '@/lib/utils';

import type { ExtendedContact, ContactCategory } from './mockContactsData';

interface ContactCardProps {
  contact: ExtendedContact;
  onView?: (contact: ExtendedContact) => void;
  onEmail?: (contact: ExtendedContact) => void;
  onCall?: (contact: ExtendedContact) => void;
  onToggleStar?: (contact: ExtendedContact) => void;
  isCompact?: boolean;
}

function getCategoryColor(category: ContactCategory): string {
  const colors: Record<ContactCategory, string> = {
    Founders: 'bg-purple-100 text-purple-700',
    Executives: 'bg-blue-100 text-blue-700',
    Advisors: 'bg-teal-100 text-teal-700',
    Bankers: 'bg-amber-100 text-amber-700',
    Lawyers: 'bg-slate-100 text-slate-700',
    Investors: 'bg-green-100 text-green-700',
    Accountants: 'bg-orange-100 text-orange-700',
    Board: 'bg-indigo-100 text-indigo-700',
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
}

function getRelationshipColor(score: number): string {
  if (score >= 80) {return 'text-green-600';}
  if (score >= 60) {return 'text-amber-600';}
  if (score >= 40) {return 'text-orange-600';}
  return 'text-red-600';
}

function getRelationshipBgColor(score: number): string {
  if (score >= 80) {return 'bg-green-500';}
  if (score >= 60) {return 'bg-amber-500';}
  if (score >= 40) {return 'bg-orange-500';}
  return 'bg-red-500';
}

function RelationshipScoreIndicator({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getRelationshipBgColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('text-sm font-semibold min-w-[2.5rem]', getRelationshipColor(score))}>
        {score}
      </span>
    </div>
  );
}

export function ContactCard({
  contact,
  onView,
  onEmail,
  onCall,
  onToggleStar,
  isCompact = false,
}: ContactCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isCompact) {
    return (
      <Card
        className={cn(
          'p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary-200',
          contact.isStarred && 'ring-1 ring-amber-200'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onView?.(contact)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              name={`${contact.firstName} ${contact.lastName}`}
              src={contact.avatar}
              size="md"
            />
            {contact.isStarred && (
              <Star className="absolute -top-1 -right-1 h-4 w-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 truncate">
                {contact.firstName} {contact.lastName}
              </p>
            </div>
            <p className="text-sm text-slate-500 truncate">{contact.title}</p>
            <p className="text-sm text-slate-400 truncate">{contact.company}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge size="sm" className={getCategoryColor(contact.category)}>
              {contact.category}
            </Badge>
            <div className="w-20">
              <RelationshipScoreIndicator score={contact.relationshipScore} />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-lg',
        contact.isStarred && 'ring-2 ring-amber-200'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with gradient based on category */}
      <div className={cn('h-2', getCategoryColor(contact.category).replace('text-', 'bg-').replace('-700', '-500'))} />

      <div className="p-5">
        {/* Top section with avatar and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={`${contact.firstName} ${contact.lastName}`}
                src={contact.avatar}
                size="xl"
              />
              {contact.isStarred && (
                <Star className="absolute -top-1 -right-1 h-5 w-5 text-amber-500 fill-amber-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {contact.firstName} {contact.lastName}
              </h3>
              <p className="text-sm text-slate-600">{contact.title}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
                <Building className="h-3.5 w-3.5" />
                <span>{contact.company}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar?.(contact);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Star
                className={cn(
                  'h-5 w-5',
                  contact.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                )}
              />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <MoreHorizontal className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Category and relationship score */}
        <div className="flex items-center justify-between mb-4">
          <Badge className={getCategoryColor(contact.category)}>{contact.category}</Badge>
          <div className="w-32">
            <RelationshipScoreIndicator score={contact.relationshipScore} />
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2 mb-4">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{contact.phone}</span>
            </a>
          )}
          {contact.linkedIn && (
            <a
              href={contact.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="h-4 w-4 text-slate-400" />
              <span>LinkedIn Profile</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {contact.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 4 && (
              <span className="px-2 py-0.5 text-slate-400 text-xs">
                +{contact.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Last interaction */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
          <Calendar className="h-3.5 w-3.5" />
          <span>Last interaction: {formatRelativeTime(contact.lastInteraction)}</span>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEmail?.(contact);
            }}
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Email
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onCall?.(contact);
            }}
          >
            <Phone className="h-4 w-4 mr-1.5" />
            Call
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onView?.(contact);
            }}
          >
            View
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ContactCard;
