'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Users, X, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { trpc } from '@/lib/trpc';

interface Attendee {
  contactId?: string;
  email?: string;
  name?: string;
}

interface MeetingSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAttendees?: Attendee[];
  meeting?: {
    id: string;
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
    location?: string | null;
    meetingUrl?: string | null;
  };
  onSuccess?: () => void;
}

export function MeetingScheduler({
  isOpen,
  onClose,
  defaultAttendees = [],
  meeting,
  onSuccess,
}: MeetingSchedulerProps) {
  const [title, setTitle] = useState(meeting?.title || '');
  const [description, setDescription] = useState(meeting?.description || '');
  const [startDate, setStartDate] = useState(
    meeting?.startTime ? format(meeting.startTime, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [endDate, setEndDate] = useState(
    meeting?.endTime ? format(meeting.endTime, "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [location, setLocation] = useState(meeting?.location || '');
  const [meetingUrl, setMeetingUrl] = useState(meeting?.meetingUrl || '');
  const [attendees, setAttendees] = useState<Attendee[]>(defaultAttendees);
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [createGoogleMeet, setCreateGoogleMeet] = useState(false);

  const utils = trpc.useUtils();

  // Check Google Calendar connection
  const calendarStatus = trpc.calendar.getGoogleStatus.useQuery();

  const createMutation = trpc.calendar.create.useMutation({
    onSuccess: () => {
      toast.success('Meeting scheduled');
      utils.calendar.list.invalidate();
      onSuccess?.();
      handleClose();
    },
    onError: () => toast.error('Failed to schedule meeting'),
  });

  const updateMutation = trpc.calendar.update.useMutation({
    onSuccess: () => {
      toast.success('Meeting updated');
      utils.calendar.list.invalidate();
      utils.calendar.getById.invalidate();
      onSuccess?.();
      handleClose();
    },
    onError: () => toast.error('Failed to update meeting'),
  });

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setLocation('');
    setMeetingUrl('');
    setAttendees([]);
    setNewAttendeeEmail('');
    setCreateGoogleMeet(false);
    onClose();
  };

  const handleAddAttendee = () => {
    if (!newAttendeeEmail.trim()) { return; }
    if (attendees.some((a) => a.email === newAttendeeEmail.trim())) {
      toast.error('Attendee already added');
      return;
    }
    setAttendees([...attendees, { email: newAttendeeEmail.trim() }]);
    setNewAttendeeEmail('');
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select start and end times');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: start,
      endTime: end,
      location: location.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      attendees: attendees.map((a) => ({
        contactId: a.contactId,
        email: a.email,
      })),
      syncToGoogle: calendarStatus.data?.connected && createGoogleMeet,
    };

    if (meeting) {
      updateMutation.mutate({ id: meeting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{meeting ? 'Edit Meeting' : 'Schedule Meeting'}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="meeting-title" className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="meeting-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="Meeting title"
              />
            </div>

            <div>
              <label htmlFor="meeting-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="meeting-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Meeting description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="meeting-start" className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start <span className="text-red-500">*</span>
                </label>
                <input
                  id="meeting-start"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label htmlFor="meeting-end" className="block text-sm font-medium text-slate-700 mb-1">
                  <Clock className="h-4 w-4 inline mr-1" />
                  End <span className="text-red-500">*</span>
                </label>
                <input
                  id="meeting-end"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            <div>
              <label htmlFor="meeting-location" className="block text-sm font-medium text-slate-700 mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location
              </label>
              <input
                id="meeting-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input w-full"
                placeholder="Office, conference room, etc."
              />
            </div>

            <div>
              <label htmlFor="meeting-url" className="block text-sm font-medium text-slate-700 mb-1">
                <Video className="h-4 w-4 inline mr-1" />
                Meeting URL
              </label>
              <input
                id="meeting-url"
                type="url"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="input w-full"
                placeholder="https://meet.google.com/..."
              />
            </div>

            {calendarStatus.data?.connected && (
              <div className="flex items-center gap-2">
                <input
                  id="create-google-meet"
                  type="checkbox"
                  checked={createGoogleMeet}
                  onChange={(e) => setCreateGoogleMeet(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="create-google-meet" className="text-sm text-slate-700">
                  Create Google Meet link and sync to Google Calendar
                </label>
              </div>
            )}

            <div>
              <label htmlFor="meeting-attendee-email" className="block text-sm font-medium text-slate-700 mb-1">
                <Users className="h-4 w-4 inline mr-1" />
                Attendees
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="meeting-attendee-email"
                  type="email"
                  value={newAttendeeEmail}
                  onChange={(e) => setNewAttendeeEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                  className="input flex-1"
                  placeholder="Enter email address"
                />
                <Button type="button" variant="secondary" onClick={handleAddAttendee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {attendees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attendees.map((attendee, index) => (
                    <Badge key={index} variant="secondary">
                      {attendee.name || attendee.email}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index)}
                        className="ml-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {meeting ? 'Updating...' : 'Scheduling...'}
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                {meeting ? 'Update Meeting' : 'Schedule Meeting'}
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default MeetingScheduler;
