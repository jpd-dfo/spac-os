'use client';

import { useState, useCallback } from 'react';

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
  Plus,
  Video,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { type ContactCategory } from '@/components/contacts';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { trpc } from '@/lib/trpc/client';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type InteractionType = 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE' | 'TASK' | 'LINKEDIN' | 'OTHER';

// Map database Contact type to UI category
function mapTypeToCategory(type: string | null): ContactCategory {
  const typeMap: Record<string, ContactCategory> = {
    'INVESTOR': 'Investors',
    'ADVISOR': 'Advisors',
    'LEGAL': 'Lawyers',
    'BANKER': 'Bankers',
    'TARGET_EXEC': 'Executives',
    'BOARD_MEMBER': 'Board',
    'SPONSOR': 'Founders',
    'UNDERWRITER': 'Bankers',
    'AUDITOR': 'Accountants',
    'OTHER': 'Advisors',
  };
  return typeMap[type ?? 'OTHER'] || 'Advisors';
}

// ============================================================================
// Helper Functions
// ============================================================================

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
  if (score >= 80) { return 'text-green-600'; }
  if (score >= 60) { return 'text-amber-600'; }
  if (score >= 40) { return 'text-orange-600'; }
  return 'text-red-600';
}

function getRelationshipBgColor(score: number): string {
  if (score >= 80) { return 'bg-green-500'; }
  if (score >= 60) { return 'bg-amber-500'; }
  if (score >= 40) { return 'bg-orange-500'; }
  return 'bg-red-500';
}

function getRelationshipLabel(score: number): string {
  if (score >= 80) { return 'Strong'; }
  if (score >= 60) { return 'Good'; }
  if (score >= 40) { return 'Developing'; }
  return 'New';
}

function getCategoryGradient(category: ContactCategory): string {
  const gradients: Record<ContactCategory, string> = {
    Founders: 'bg-gradient-to-r from-purple-500 to-purple-600',
    Executives: 'bg-gradient-to-r from-blue-500 to-blue-600',
    Advisors: 'bg-gradient-to-r from-teal-500 to-teal-600',
    Bankers: 'bg-gradient-to-r from-amber-500 to-amber-600',
    Lawyers: 'bg-gradient-to-r from-slate-500 to-slate-600',
    Investors: 'bg-gradient-to-r from-green-500 to-green-600',
    Accountants: 'bg-gradient-to-r from-orange-500 to-orange-600',
    Board: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  };
  return gradients[category] || 'bg-gradient-to-r from-primary-500 to-primary-600';
}

function getInteractionIcon(type: InteractionType) {
  const icons: Record<InteractionType, React.ReactNode> = {
    EMAIL: <Mail className="h-4 w-4" />,
    CALL: <Phone className="h-4 w-4" />,
    MEETING: <Video className="h-4 w-4" />,
    NOTE: <FileText className="h-4 w-4" />,
    TASK: <CheckSquare className="h-4 w-4" />,
    LINKEDIN: <Linkedin className="h-4 w-4" />,
    OTHER: <MessageSquare className="h-4 w-4" />,
  };
  return icons[type];
}

function getInteractionColor(type: InteractionType) {
  const colors: Record<InteractionType, string> = {
    EMAIL: 'bg-blue-100 text-blue-600',
    CALL: 'bg-green-100 text-green-600',
    MEETING: 'bg-purple-100 text-purple-600',
    NOTE: 'bg-amber-100 text-amber-600',
    TASK: 'bg-teal-100 text-teal-600',
    LINKEDIN: 'bg-sky-100 text-sky-600',
    OTHER: 'bg-slate-100 text-slate-600',
  };
  return colors[type];
}

function getInteractionBorderColor(type: InteractionType) {
  const colors: Record<InteractionType, string> = {
    EMAIL: 'border-blue-200',
    CALL: 'border-green-200',
    MEETING: 'border-purple-200',
    NOTE: 'border-amber-200',
    TASK: 'border-teal-200',
    LINKEDIN: 'border-sky-200',
    OTHER: 'border-slate-200',
  };
  return colors[type];
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function ContactDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-32 bg-slate-200 rounded" />

      {/* Header skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="h-24 bg-slate-200" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-xl bg-slate-300 border-4 border-white" />
              <div className="mb-1 space-y-2">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-8 w-16 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-48 bg-slate-200 rounded-xl" />
        </div>
        <div className="col-span-2">
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Interaction Item Component
// ============================================================================

interface InteractionItemProps {
  interaction: {
    id: string;
    type: string;
    subject: string | null;
    description: string | null;
    date: Date | string;
    duration: number | null;
    outcome: string | null;
    createdBy?: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
  };
}

function InteractionItem({ interaction }: InteractionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const type = interaction.type as InteractionType;

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
          getInteractionColor(type)
        )}
      >
        {getInteractionIcon(type)}
      </div>

      {/* Content */}
      <div className={cn('ml-2 rounded-lg border bg-white p-4', getInteractionBorderColor(type))}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge size="sm" className={getInteractionColor(type)}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(new Date(interaction.date))}
              </span>
            </div>
            <h4 className="font-medium text-slate-900">{interaction.subject || 'No subject'}</h4>
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

            {interaction.duration && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>Duration: {interaction.duration} minutes</span>
              </div>
            )}

            {interaction.outcome && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Outcome: {interaction.outcome}</span>
              </div>
            )}

            {interaction.createdBy && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                <span>Logged by {interaction.createdBy.name || 'Unknown'}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 text-xs text-slate-400">{formatDate(new Date(interaction.date))}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Add Interaction Modal Component
// ============================================================================

interface AddInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  onSuccess: () => void;
}

function AddInteractionModal({ isOpen, onClose, contactId, contactName, onSuccess }: AddInteractionModalProps) {
  const [type, setType] = useState<InteractionType>('NOTE');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');

  const addInteractionMutation = trpc.contact.addInteraction.useMutation({
    onSuccess: () => {
      toast.success('Interaction logged successfully');
      onSuccess();
      onClose();
      setType('NOTE');
      setSubject('');
      setDescription('');
      setDuration('');
    },
    onError: (error) => {
      toast.error(`Failed to log interaction: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    addInteractionMutation.mutate({
      contactId,
      type,
      subject: subject.trim(),
      description: description.trim() || undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle>Log Interaction with {contactName}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div role="group" aria-labelledby="interaction-type-label">
            <span id="interaction-type-label" className="block text-sm font-medium text-slate-700 mb-1.5">Type</span>
            <div className="flex flex-wrap gap-2">
              {(['EMAIL', 'CALL', 'MEETING', 'NOTE', 'TASK', 'LINKEDIN'] as InteractionType[]).map((t) => (
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
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject..."
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this interaction..."
            rows={3}
          />

          {(type === 'MEETING' || type === 'CALL') && (
            <Input
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              min={0}
            />
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={addInteractionMutation.isPending}
        >
          {addInteractionMutation.isPending ? 'Logging...' : 'Log Interaction'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Add Note Modal Component
// ============================================================================

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  onSuccess: () => void;
}

function AddNoteModal({ isOpen, onClose, contactId, contactName, onSuccess }: AddNoteModalProps) {
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const addNoteMutation = trpc.contact.addNote.useMutation({
    onSuccess: () => {
      toast.success('Note added successfully');
      onSuccess();
      onClose();
      setContent('');
      setIsPinned(false);
    },
    onError: (error) => {
      toast.error(`Failed to add note: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('Please enter note content');
      return;
    }

    addNoteMutation.mutate({
      contactId,
      content: content.trim(),
      isPinned,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <ModalTitle>Add Note for {contactName}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <Textarea
            label="Note Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your note..."
            rows={5}
            required
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">Pin this note</span>
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={addNoteMutation.isPending}
        >
          {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Edit Contact Modal Component
// ============================================================================

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    company: string | null;
    title: string | null;
    linkedIn: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    notes: string | null;
    tags: string[];
  };
  onSuccess: () => void;
}

function EditContactModal({ isOpen, onClose, contact, onSuccess }: EditContactModalProps) {
  const [formData, setFormData] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email || '',
    phone: contact.phone || '',
    mobile: contact.mobile || '',
    company: contact.company || '',
    title: contact.title || '',
    linkedinUrl: contact.linkedIn || '',
    city: contact.city || '',
    state: contact.state || '',
    country: contact.country || '',
    notes: contact.notes || '',
    tags: contact.tags,
  });

  const updateContactMutation = trpc.contact.update.useMutation({
    onSuccess: () => {
      toast.success('Contact updated successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }

    updateContactMutation.mutate({
      id: contact.id,
      data: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        mobile: formData.mobile.trim() || undefined,
        company: formData.company.trim() || undefined,
        title: formData.title.trim() || undefined,
        linkedinUrl: formData.linkedinUrl.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <ModalTitle>Edit Contact</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
            />
            <Input
              label="LinkedIn URL"
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={updateContactMutation.isPending}
        >
          {updateContactMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params['id'] as string;

  const [activeSection, setActiveSection] = useState<'activity' | 'deals' | 'documents' | 'notes' | 'network'>('activity');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddInteractionModalOpen, setIsAddInteractionModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);

  // tRPC Query - fetch contact with all relations
  const {
    data: contact,
    isLoading,
    error,
    refetch,
  } = trpc.contact.getById.useQuery(
    { id: contactId },
    { enabled: !!contactId }
  );

  // tRPC Mutations
  const utils = trpc.useUtils();

  const toggleStarMutation = trpc.contact.toggleStar.useMutation({
    onSuccess: (data) => {
      utils.contact.getById.invalidate({ id: contactId });
      toast.success(data.isStarred ? 'Contact starred' : 'Contact unstarred');
    },
    onError: (error) => {
      toast.error(`Failed to toggle star: ${error.message}`);
    },
  });

  const handleToggleStar = useCallback(() => {
    toggleStarMutation.mutate({ id: contactId });
  }, [contactId, toggleStarMutation]);

  const handleMutationSuccess = useCallback(() => {
    utils.contact.getById.invalidate({ id: contactId });
  }, [contactId, utils]);

  // Loading state
  if (isLoading) {
    return <ContactDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 mb-2">Error loading contact</p>
          <p className="text-slate-500 text-sm mb-4">{error.message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => router.push('/contacts')}>
              Return to contacts
            </Button>
            <Button variant="primary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
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

  // Derived values
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const category = mapTypeToCategory(contact.type);
  const relationshipScore = contact.relationshipScore ?? 0;
  const lastInteraction = contact.lastInteractionAt ? new Date(contact.lastInteractionAt) : null;
  const interactions = contact.interactions || [];
  const notes = contact.contactNotes || [];
  const linkedTargets = contact.targets || [];

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
        <div className={cn('h-24', getCategoryGradient(category))} />

        <div className="px-6 pb-6">
          {/* Avatar and basic info */}
          <div className="flex items-end justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl border-4 border-white bg-white shadow-lg overflow-hidden">
                  <Avatar
                    name={fullName}
                    src={contact.avatarUrl ?? undefined}
                    size="xl"
                    className="w-full h-full"
                  />
                </div>
                {contact.isStarred && (
                  <Star className="absolute -top-1 -right-1 h-6 w-6 text-amber-500 fill-amber-500" />
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
                  <Badge className={getCategoryColor(category)}>{category}</Badge>
                </div>
                <p className="text-slate-600">{contact.title || 'No title'}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Building className="h-4 w-4" />
                  <span>{contact.company || contact.companyRef?.name || 'No company'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={handleToggleStar}
                disabled={toggleStarMutation.isPending}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    contact.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                  )}
                />
              </button>
              <Button variant="secondary" size="sm">
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
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
                    className={cn('h-full rounded-full transition-all', getRelationshipBgColor(relationshipScore))}
                    style={{ width: `${relationshipScore}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className={cn('text-2xl font-bold', getRelationshipColor(relationshipScore))}>
                    {relationshipScore}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">/ 100</span>
                </div>
              </div>
              <p className={cn('text-sm mt-1', getRelationshipColor(relationshipScore))}>
                {getRelationshipLabel(relationshipScore)} Relationship
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Interactions</p>
              <p className="text-2xl font-bold text-slate-900">{contact._count?.interactions ?? 0}</p>
              <p className="text-sm text-slate-500">Total logged</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Last Contact</p>
              <p className="text-lg font-semibold text-slate-900">
                {lastInteraction ? formatRelativeTime(lastInteraction) : 'Never'}
              </p>
              <p className="text-sm text-slate-500">
                {lastInteraction ? formatDate(lastInteraction) : 'No interactions yet'}
              </p>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
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
              {contact.email && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => window.location.href = `mailto:${contact.email}`}
                >
                  <Mail className="h-4 w-4 mr-3" />
                  Send Email
                </Button>
              )}
              {contact.phone && (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => window.location.href = `tel:${contact.phone}`}
                >
                  <Phone className="h-4 w-4 mr-3" />
                  Make Call
                </Button>
              )}
              <Button variant="secondary" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-3" />
                Schedule Meeting
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <CheckSquare className="h-4 w-4 mr-3" />
                Create Task
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setIsAddNoteModalOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-3" />
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Linked Targets/Deals */}
          {linkedTargets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Deals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkedTargets.map((link) => (
                  <div
                    key={link.target.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    onClick={() => router.push(`/pipeline/${link.target.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{link.target.name}</p>
                        <p className="text-sm text-slate-500">
                          {link.target.industry} - {link.target.stage || link.target.status}
                        </p>
                      </div>
                      <Badge
                        variant={
                          link.target.status === 'DUE_DILIGENCE' || link.target.status === 'LOI'
                            ? 'success'
                            : link.target.status === 'IDENTIFIED' || link.target.status === 'PRELIMINARY'
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {link.target.status}
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Activity Timeline</CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddInteractionModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Log Activity
                </Button>
              </CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No interactions recorded yet</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsAddInteractionModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Log First Interaction
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    {interactions.map((interaction) => (
                      <InteractionItem key={interaction.id} interaction={interaction} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'deals' && (
            <Card>
              <CardHeader>
                <CardTitle>Deal Involvement</CardTitle>
              </CardHeader>
              <CardContent>
                {linkedTargets.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No deals linked to this contact</p>
                    <Button variant="secondary" size="sm" className="mt-3">
                      Link to Deal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {linkedTargets.map((link) => (
                      <div
                        key={link.target.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/pipeline/${link.target.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-900">{link.target.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {link.target.industry} - {link.target.stage || link.target.status}
                            </p>
                          </div>
                          <Badge
                            variant={
                              link.target.status === 'DUE_DILIGENCE' || link.target.status === 'LOI'
                                ? 'success'
                                : link.target.status === 'IDENTIFIED' || link.target.status === 'PRELIMINARY'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {link.target.status}
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
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">No documents shared</p>
                  <p className="text-sm text-slate-400 mt-1">Document sharing coming soon</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddNoteModalOpen(true)}
                >
                  Add Note
                </Button>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">No notes yet</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => setIsAddNoteModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add First Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes
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
                            <span>By {note.createdBy?.name || 'Unknown'}</span>
                            <span>-</span>
                            <span>{formatRelativeTime(new Date(note.createdAt))}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === 'network' && (
            <Card>
              <CardHeader>
                <CardTitle>Network Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">Network visualization coming soon</p>
                  <p className="text-sm text-slate-400 mt-1">
                    See connections between contacts and companies
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Contact Modal */}
      {isEditModalOpen && contact && (
        <EditContactModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          contact={contact}
          onSuccess={handleMutationSuccess}
        />
      )}

      {/* Add Interaction Modal */}
      <AddInteractionModal
        isOpen={isAddInteractionModalOpen}
        onClose={() => setIsAddInteractionModalOpen(false)}
        contactId={contactId}
        contactName={fullName}
        onSuccess={handleMutationSuccess}
      />

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        contactId={contactId}
        contactName={fullName}
        onSuccess={handleMutationSuccess}
      />
    </div>
  );
}
