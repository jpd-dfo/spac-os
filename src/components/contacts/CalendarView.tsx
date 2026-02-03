'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  AlertCircle,
  List,
  Grid3X3,
  Video,
  MapPin,
  Clock,
  Users,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

type ViewType = 'month' | 'list';

interface CalendarViewProps {
  contactId?: string;
  onScheduleMeeting?: () => void;
  onSelectMeeting?: (meetingId: string) => void;
}

export function CalendarView({ contactId, onScheduleMeeting, onSelectMeeting }: CalendarViewProps) {
  const [view, setView] = useState<ViewType>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Check Google Calendar connection
  const calendarStatus = trpc.calendar.getGoogleStatus.useQuery();

  // Fetch meetings
  const meetingsQuery = trpc.calendar.list.useQuery({
    contactId,
    dateRange: {
      from: startOfMonth(subMonths(currentDate, 1)),
      to: endOfMonth(addMonths(currentDate, 1)),
    },
    pageSize: 100,
  });

  const meetings = useMemo(() => meetingsQuery.data?.items ?? [], [meetingsQuery.data]);

  // Get upcoming meetings for list view
  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => new Date(m.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 20);
  }, [meetings]);

  // Get meetings for a specific day
  const getMeetingsForDay = (date: Date) => {
    return meetings.filter((m) => isSameDay(new Date(m.startTime), date));
  };

  // Month view calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="secondary" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-md overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1 text-sm',
                view === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-3 py-1 text-sm',
                view === 'month' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
          {calendarStatus.data?.connected && (
            <Badge variant="success" size="sm">
              <Calendar className="h-3 w-3 mr-1" />
              Google Connected
            </Badge>
          )}
          {onScheduleMeeting && (
            <Button variant="primary" size="sm" onClick={onScheduleMeeting}>
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Button>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {meetingsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : meetingsQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm text-slate-500">Failed to load meetings</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => meetingsQuery.refetch()}>
              Try Again
            </Button>
          </div>
        ) : view === 'list' ? (
          // List View
          <div className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-sm text-slate-500">No upcoming meetings</p>
              </div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => onSelectMeeting?.(meeting.id)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-2xl font-bold text-slate-900">
                      {format(new Date(meeting.startTime), 'd')}
                    </div>
                    <div className="text-xs text-slate-500 uppercase">
                      {format(new Date(meeting.startTime), 'MMM')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{meeting.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(meeting.startTime), 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                      </span>
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {meeting.location}
                        </span>
                      )}
                      {meeting.meetingUrl && (
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Video Call
                        </span>
                      )}
                    </div>
                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <Users className="h-3 w-3" />
                        {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Month View
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-l border-t border-slate-200">
              {calendarDays.map((day) => {
                const dayMeetings = getMeetingsForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-[100px] p-2 border-r border-b border-slate-200',
                      !isSameMonth(day, currentDate) && 'bg-slate-50',
                      isToday(day) && 'bg-blue-50'
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm font-medium mb-1',
                        !isSameMonth(day, currentDate) && 'text-slate-400',
                        isToday(day) && 'text-blue-600'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayMeetings.slice(0, 3).map((meeting) => (
                        <div
                          key={meeting.id}
                          onClick={() => onSelectMeeting?.(meeting.id)}
                          className="text-xs p-1 rounded bg-blue-100 text-blue-700 truncate cursor-pointer hover:bg-blue-200"
                        >
                          {format(new Date(meeting.startTime), 'h:mm')} {meeting.title}
                        </div>
                      ))}
                      {dayMeetings.length > 3 && (
                        <div className="text-xs text-slate-500">
                          +{dayMeetings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarView;
