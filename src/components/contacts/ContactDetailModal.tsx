'use client';

import { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  Linkedin,
  Building,
  MapPin,
  Calendar,
  Star,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Clock,
  Users,
  MessageSquare,
  CheckSquare,
  Briefcase,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { InteractionLog } from './InteractionLog';
import type { ExtendedContact, ContactCategory } from './mockContactsData';

interface ContactDetailModalProps {
  contact: ExtendedContact;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (contact: ExtendedContact) => void;
  onDelete?: (contact: ExtendedContact) => void;
  onToggleStar?: (contact: ExtendedContact) => void;
}

type TabType = 'overview' | 'activity' | 'deals' | 'documents' | 'notes';

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
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getRelationshipBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getRelationshipLabel(score: number): string {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Developing';
  return 'New';
}

export function ContactDetailModal({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleStar,
}: ContactDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Users className="h-4 w-4" /> },
    { id: 'activity', label: 'Activity', icon: <Clock className="h-4 w-4" /> },
    { id: 'deals', label: 'Deals', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 pb-10">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl animate-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-xl border-b border-slate-200">
          <div className="flex items-start justify-between p-6">
            <div className="flex items-start gap-4">
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
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    {contact.firstName} {contact.lastName}
                  </h2>
                  <Badge className={getCategoryColor(contact.category)}>{contact.category}</Badge>
                </div>
                <p className="text-slate-600 mt-1">{contact.title}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Building className="h-4 w-4" />
                  <span>{contact.company}</span>
                </div>

                {/* Relationship Score */}
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm text-slate-500">Relationship Strength:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', getRelationshipBgColor(contact.relationshipScore))}
                        style={{ width: `${contact.relationshipScore}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-semibold', getRelationshipColor(contact.relationshipScore))}>
                      {contact.relationshipScore} - {getRelationshipLabel(contact.relationshipScore)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleStar?.(contact)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    contact.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                  )}
                />
              </button>
              <Button variant="secondary" size="sm" onClick={() => onEdit?.(contact)}>
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-6 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-slate-100 text-slate-900 border-b-2 border-primary-500'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'activity' && contact.interactions.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded-full">
                    {contact.interactions.length}
                  </span>
                )}
                {tab.id === 'deals' && contact.linkedDeals.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded-full">
                    {contact.linkedDeals.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Mail className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Phone className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-slate-900 hover:text-primary-600"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.mobile && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Phone className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Mobile</p>
                        <a
                          href={`tel:${contact.mobile}`}
                          className="text-sm text-slate-900 hover:text-primary-600"
                        >
                          {contact.mobile}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.linkedIn && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Linkedin className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">LinkedIn</p>
                        <a
                          href={contact.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                        >
                          View Profile <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {(contact.city || contact.state || contact.country) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="text-sm text-slate-900">
                          {[contact.city, contact.state, contact.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      Make Call
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Meeting
                    </Button>
                    <Button variant="secondary" className="justify-start">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </div>

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-slate-700 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Added: {formatDate(contact.createdAt)}</span>
                      <span>Last interaction: {formatRelativeTime(contact.lastInteraction)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Preview */}
              <div className="lg:col-span-2">
                <InteractionLog
                  interactions={contact.interactions}
                  contactName={`${contact.firstName} ${contact.lastName}`}
                  maxItems={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <InteractionLog
              interactions={contact.interactions}
              contactName={`${contact.firstName} ${contact.lastName}`}
            />
          )}

          {activeTab === 'deals' && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.linkedDeals.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No deals linked to this contact</p>
                    <Button variant="secondary" size="sm" className="mt-3">
                      <LinkIcon className="h-4 w-4 mr-1.5" />
                      Link to Deal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contact.linkedDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div>
                          <h4 className="font-medium text-slate-900">{deal.name}</h4>
                          <p className="text-sm text-slate-500">Role: {deal.role}</p>
                        </div>
                        <Badge
                          variant={
                            deal.status === 'Active'
                              ? 'success'
                              : deal.status === 'Preliminary'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {deal.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle>Shared Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No documents shared with this contact</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contact.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <FileText className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">
                              Shared {formatRelativeTime(doc.sharedDate)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Button variant="secondary" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Add Note
                </Button>
              </CardHeader>
              <CardContent>
                {contact.notes.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contact.notes
                      .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1))
                      .map((note) => (
                        <div
                          key={note.id}
                          className={cn(
                            'p-4 rounded-lg border',
                            note.isPinned
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-slate-200'
                          )}
                        >
                          {note.isPinned && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 mb-2">
                              <Star className="h-3 w-3 fill-amber-500" />
                              Pinned
                            </div>
                          )}
                          <p className="text-sm text-slate-700">{note.content}</p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                            <span>By {note.createdBy}</span>
                            <span>-</span>
                            <span>{formatRelativeTime(note.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
              onClick={() => onDelete?.(contact)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Contact
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" onClick={() => onEdit?.(contact)}>
                Edit Contact
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactDetailModal;
