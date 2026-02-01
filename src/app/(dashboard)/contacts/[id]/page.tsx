'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
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
  MoreHorizontal,
  Clock,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  CheckSquare,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import {
  InteractionLog,
  RelationshipGraph,
  getContactById,
  mockContacts,
  type ExtendedContact,
  type ContactCategory,
} from '@/components/contacts';

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

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<ExtendedContact | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [activeSection, setActiveSection] = useState<'activity' | 'deals' | 'documents' | 'notes' | 'network'>('activity');

  useEffect(() => {
    const id = params.id as string;
    const foundContact = getContactById(id);
    if (foundContact) {
      setContact(foundContact);
      setIsStarred(foundContact.isStarred || false);
    }
  }, [params.id]);

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">Contact not found</p>
          <Button variant="link" onClick={() => router.push('/contacts')} className="mt-2">
            Return to contacts
          </Button>
        </div>
      </div>
    );
  }

  // Get related contacts for network visualization
  const relatedContacts = mockContacts.filter(
    (c) =>
      c.id !== contact.id &&
      (c.company === contact.company ||
        c.linkedDeals.some((d) => contact.linkedDeals.some((cd) => cd.id === d.id)))
  );

  const networkContacts = [contact, ...relatedContacts.slice(0, 15)];

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        onClick={() => router.push('/contacts')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contacts
      </button>

      {/* Contact Header */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Cover gradient */}
        <div
          className={cn(
            'h-24',
            contact.category === 'Founders'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
              : contact.category === 'Executives'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : contact.category === 'Bankers'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600'
              : contact.category === 'Lawyers'
              ? 'bg-gradient-to-r from-slate-500 to-slate-600'
              : contact.category === 'Investors'
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : 'bg-gradient-to-r from-primary-500 to-primary-600'
          )}
        />

        <div className="px-6 pb-6">
          {/* Avatar and basic info */}
          <div className="flex items-end justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
                  <Avatar
                    name={`${contact.firstName} ${contact.lastName}`}
                    src={contact.avatar}
                    size="xl"
                    className="w-full h-full"
                  />
                </div>
                {isStarred && (
                  <Star className="absolute -top-1 -right-1 h-6 w-6 text-amber-500 fill-amber-500" />
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {contact.firstName} {contact.lastName}
                  </h1>
                  <Badge className={getCategoryColor(contact.category)}>{contact.category}</Badge>
                </div>
                <p className="text-slate-600">{contact.title}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Building className="h-4 w-4" />
                  <span>{contact.company}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                  )}
                />
              </button>
              <Button variant="secondary" size="sm">
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              <Button variant="secondary" size="sm">
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button variant="secondary" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Relationship Score and Quick Stats */}
          <div className="mt-6 grid grid-cols-4 gap-6">
            <div className="col-span-2">
              <p className="text-sm font-medium text-slate-500 mb-2">Relationship Strength</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', getRelationshipBgColor(contact.relationshipScore))}
                    style={{ width: `${contact.relationshipScore}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className={cn('text-2xl font-bold', getRelationshipColor(contact.relationshipScore))}>
                    {contact.relationshipScore}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">/ 100</span>
                </div>
              </div>
              <p className={cn('text-sm mt-1', getRelationshipColor(contact.relationshipScore))}>
                {getRelationshipLabel(contact.relationshipScore)} Relationship
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Interactions</p>
              <p className="text-2xl font-bold text-slate-900">{contact.interactions.length}</p>
              <p className="text-sm text-slate-500">Total logged</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Last Contact</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatRelativeTime(contact.lastInteraction)}
              </p>
              <p className="text-sm text-slate-500">{formatDate(contact.lastInteraction)}</p>
            </div>
          </div>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-primary-600 truncate">{contact.email}</p>
                  </div>
                </a>
              )}

              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-900">{contact.phone}</p>
                  </div>
                </a>
              )}

              {contact.mobile && (
                <a
                  href={`tel:${contact.mobile}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Phone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Mobile</p>
                    <p className="text-sm font-medium text-slate-900">{contact.mobile}</p>
                  </div>
                </a>
              )}

              {contact.linkedIn && (
                <a
                  href={contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Linkedin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">LinkedIn</p>
                    <p className="text-sm font-medium text-primary-600 flex items-center gap-1">
                      View Profile <ExternalLink className="h-3 w-3" />
                    </p>
                  </div>
                </a>
              )}

              {(contact.city || contact.state || contact.country) && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MapPin className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm font-medium text-slate-900">
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
            <CardContent className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-3" />
                Send Email
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-3" />
                Make Call
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-3" />
                Schedule Meeting
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <CheckSquare className="h-4 w-4 mr-3" />
                Create Task
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-3" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Linked Deals */}
          {contact.linkedDeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.linkedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{deal.name}</p>
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
                        size="sm"
                      >
                        {deal.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Activity & Content */}
        <div className="col-span-2 space-y-6">
          {/* Section Tabs */}
          <div className="flex gap-1 border-b border-slate-200">
            {[
              { id: 'activity', label: 'Activity', icon: <Clock className="h-4 w-4" /> },
              { id: 'deals', label: 'Deals', icon: <Briefcase className="h-4 w-4" /> },
              { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              { id: 'notes', label: 'Notes', icon: <MessageSquare className="h-4 w-4" /> },
              { id: 'network', label: 'Network', icon: <TrendingUp className="h-4 w-4" /> },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as typeof activeSection)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeSection === section.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>

          {/* Section Content */}
          {activeSection === 'activity' && (
            <InteractionLog
              interactions={contact.interactions}
              contactName={`${contact.firstName} ${contact.lastName}`}
            />
          )}

          {activeSection === 'deals' && (
            <Card>
              <CardHeader>
                <CardTitle>Deal Involvement</CardTitle>
              </CardHeader>
              <CardContent>
                {contact.linkedDeals.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No deals linked to this contact</p>
                    <Button variant="secondary" size="sm" className="mt-3">
                      Link to Deal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contact.linkedDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900">{deal.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">Role: {deal.role}</p>
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'documents' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Shared Documents</CardTitle>
                <Button variant="secondary" size="sm">
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                {contact.documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No documents shared</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contact.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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

          {activeSection === 'notes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Button variant="secondary" size="sm">
                  Add Note
                </Button>
              </CardHeader>
              <CardContent>
                {contact.notes.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No notes yet</p>
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

          {activeSection === 'network' && (
            <RelationshipGraph
              contacts={networkContacts}
              selectedContactId={contact.id}
              highlightPath={[contact.id]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
