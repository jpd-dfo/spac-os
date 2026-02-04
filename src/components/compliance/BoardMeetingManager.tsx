'use client';

import { useState } from 'react';

import {
  Calendar,
  Clock,
  Users,
  FileText,
  Plus,
  ChevronRight,
  CheckCircle2,
  Edit2,
  Video,
  MapPin,
  Download,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import '@/components/ui/Input';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { cn, formatDate } from '@/lib/utils';

// Types
type MeetingType = 'Board' | 'Audit Committee' | 'Compensation Committee' | 'Nominating Committee' | 'Special';
type MeetingStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
type AttendanceStatus = 'Present' | 'Absent' | 'Excused' | 'Pending';
type ResolutionStatus = 'Passed' | 'Failed' | 'Tabled' | 'Pending';

interface BoardMember {
  id: string;
  name: string;
  title: string;
  isIndependent: boolean;
  committees: string[];
}

interface AgendaItem {
  id: string;
  order: number;
  title: string;
  presenter: string;
  duration: number; // minutes
  description?: string;
  documents?: string[];
}

interface Resolution {
  id: string;
  number: string;
  title: string;
  description: string;
  status: ResolutionStatus;
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
}

interface Attendance {
  memberId: string;
  memberName: string;
  status: AttendanceStatus;
  joinTime?: Date;
  leaveTime?: Date;
}

interface BoardMeeting {
  id: string;
  type: MeetingType;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  status: MeetingStatus;
  agenda: AgendaItem[];
  attendance: Attendance[];
  resolutions: Resolution[];
  minutesApproved: boolean;
  minutesUrl?: string;
  notes?: string;
}

// Mock board members
const boardMembers: BoardMember[] = [
  { id: '1', name: 'John Smith', title: 'Chairman & CEO', isIndependent: false, committees: [] },
  { id: '2', name: 'Sarah Chen', title: 'Lead Independent Director', isIndependent: true, committees: ['Audit', 'Nominating'] },
  { id: '3', name: 'Michael Torres', title: 'Director', isIndependent: true, committees: ['Audit', 'Compensation'] },
  { id: '4', name: 'Jennifer Walsh', title: 'Director', isIndependent: true, committees: ['Compensation', 'Nominating'] },
  { id: '5', name: 'Robert Kim', title: 'CFO', isIndependent: false, committees: [] },
  { id: '6', name: 'David Park', title: 'Director', isIndependent: true, committees: ['Audit'] },
];

// Mock meetings
const mockMeetings: BoardMeeting[] = [
  {
    id: '1',
    type: 'Board',
    title: 'Q1 2025 Board Meeting',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    startTime: '09:00',
    endTime: '12:00',
    location: 'Conference Room A, NYC Office',
    isVirtual: true,
    virtualLink: 'https://zoom.us/j/123456789',
    status: 'Scheduled',
    agenda: [
      { id: '1', order: 1, title: 'Call to Order & Approval of Previous Minutes', presenter: 'John Smith', duration: 10 },
      { id: '2', order: 2, title: 'CEO Report', presenter: 'John Smith', duration: 30 },
      { id: '3', order: 3, title: 'Financial Review', presenter: 'Robert Kim', duration: 45 },
      { id: '4', order: 4, title: 'Business Combination Update', presenter: 'John Smith', duration: 30 },
      { id: '5', order: 5, title: 'Committee Reports', presenter: 'Committee Chairs', duration: 30 },
      { id: '6', order: 6, title: 'New Business & Executive Session', presenter: 'Sarah Chen', duration: 30 },
    ],
    attendance: boardMembers.map((m) => ({ memberId: m.id, memberName: m.name, status: 'Pending' as AttendanceStatus })),
    resolutions: [],
    minutesApproved: false,
  },
  {
    id: '2',
    type: 'Audit Committee',
    title: 'Audit Committee Meeting - Q1 Review',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    startTime: '14:00',
    endTime: '16:00',
    location: 'Virtual Meeting',
    isVirtual: true,
    virtualLink: 'https://zoom.us/j/987654321',
    status: 'Scheduled',
    agenda: [
      { id: '1', order: 1, title: 'Approval of Previous Minutes', presenter: 'Sarah Chen', duration: 5 },
      { id: '2', order: 2, title: 'External Auditor Report', presenter: 'External Auditor', duration: 30 },
      { id: '3', order: 3, title: 'Internal Audit Update', presenter: 'Internal Audit', duration: 20 },
      { id: '4', order: 4, title: 'SOX 404 Compliance Review', presenter: 'Robert Kim', duration: 25 },
      { id: '5', order: 5, title: 'Related Party Transactions', presenter: 'Legal', duration: 15 },
    ],
    attendance: boardMembers
      .filter((m) => m.committees.includes('Audit'))
      .map((m) => ({ memberId: m.id, memberName: m.name, status: 'Pending' as AttendanceStatus })),
    resolutions: [],
    minutesApproved: false,
  },
  {
    id: '3',
    type: 'Board',
    title: 'Q4 2024 Board Meeting',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    startTime: '09:00',
    endTime: '12:30',
    location: 'Conference Room A, NYC Office',
    isVirtual: true,
    virtualLink: 'https://zoom.us/j/111222333',
    status: 'Completed',
    agenda: [
      { id: '1', order: 1, title: 'Call to Order & Approval of Previous Minutes', presenter: 'John Smith', duration: 10 },
      { id: '2', order: 2, title: 'CEO Report', presenter: 'John Smith', duration: 30 },
      { id: '3', order: 3, title: 'Financial Review', presenter: 'Robert Kim', duration: 45 },
      { id: '4', order: 4, title: 'Target Company Due Diligence Update', presenter: 'John Smith', duration: 45 },
      { id: '5', order: 5, title: 'Committee Reports', presenter: 'Committee Chairs', duration: 30 },
      { id: '6', order: 6, title: 'Executive Session', presenter: 'Sarah Chen', duration: 20 },
    ],
    attendance: [
      { memberId: '1', memberName: 'John Smith', status: 'Present' },
      { memberId: '2', memberName: 'Sarah Chen', status: 'Present' },
      { memberId: '3', memberName: 'Michael Torres', status: 'Present' },
      { memberId: '4', memberName: 'Jennifer Walsh', status: 'Present' },
      { memberId: '5', memberName: 'Robert Kim', status: 'Present' },
      { memberId: '6', memberName: 'David Park', status: 'Excused' },
    ],
    resolutions: [
      {
        id: '1',
        number: 'RES-2024-Q4-001',
        title: 'Approval of Q3 Financial Statements',
        description: 'Resolved that the Board approves the Q3 2024 unaudited financial statements.',
        status: 'Passed',
        votesFor: 5,
        votesAgainst: 0,
        abstentions: 0,
      },
      {
        id: '2',
        number: 'RES-2024-Q4-002',
        title: 'Authorization to Continue Target Negotiations',
        description: 'Resolved that management is authorized to continue negotiations with Target Company.',
        status: 'Passed',
        votesFor: 5,
        votesAgainst: 0,
        abstentions: 0,
      },
      {
        id: '3',
        number: 'RES-2024-Q4-003',
        title: 'Approval of Extension Filing',
        description: 'Resolved that the Company file for a 3-month extension with stockholder approval.',
        status: 'Passed',
        votesFor: 4,
        votesAgainst: 1,
        abstentions: 0,
      },
    ],
    minutesApproved: true,
    minutesUrl: '/documents/board-minutes-q4-2024.pdf',
    notes: 'Executive session held to discuss CEO compensation review.',
  },
  {
    id: '4',
    type: 'Compensation Committee',
    title: 'Compensation Committee - Annual Review',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    startTime: '10:00',
    endTime: '11:30',
    location: 'Virtual Meeting',
    isVirtual: true,
    status: 'Scheduled',
    agenda: [
      { id: '1', order: 1, title: 'Approval of Previous Minutes', presenter: 'Jennifer Walsh', duration: 5 },
      { id: '2', order: 2, title: 'Executive Compensation Review', presenter: 'HR Director', duration: 30 },
      { id: '3', order: 3, title: 'Peer Benchmarking Analysis', presenter: 'Compensation Consultant', duration: 25 },
      { id: '4', order: 4, title: 'Equity Incentive Plan Review', presenter: 'Legal', duration: 20 },
    ],
    attendance: boardMembers
      .filter((m) => m.committees.includes('Compensation'))
      .map((m) => ({ memberId: m.id, memberName: m.name, status: 'Pending' as AttendanceStatus })),
    resolutions: [],
    minutesApproved: false,
  },
];

const _meetingTypeOptions = [
  { value: 'Board', label: 'Board Meeting' },
  { value: 'Audit Committee', label: 'Audit Committee' },
  { value: 'Compensation Committee', label: 'Compensation Committee' },
  { value: 'Nominating Committee', label: 'Nominating Committee' },
  { value: 'Special', label: 'Special Meeting' },
];

function getMeetingTypeBadge(type: MeetingType) {
  const variants: Record<MeetingType, 'primary' | 'secondary' | 'success' | 'warning'> = {
    Board: 'primary',
    'Audit Committee': 'secondary',
    'Compensation Committee': 'success',
    'Nominating Committee': 'warning',
    Special: 'warning',
  };
  return <Badge variant={variants[type]}>{type}</Badge>;
}

function getStatusBadge(status: MeetingStatus) {
  const variants: Record<MeetingStatus, 'primary' | 'warning' | 'success' | 'secondary'> = {
    Scheduled: 'primary',
    'In Progress': 'warning',
    Completed: 'success',
    Cancelled: 'secondary',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getAttendanceStatusBadge(status: AttendanceStatus) {
  const variants: Record<AttendanceStatus, 'success' | 'secondary' | 'warning'> = {
    Present: 'success',
    Absent: 'secondary',
    Excused: 'warning',
    Pending: 'secondary',
  };
  return <Badge variant={variants[status]} size="sm">{status}</Badge>;
}

function getResolutionStatusBadge(status: ResolutionStatus) {
  const variants: Record<ResolutionStatus, 'success' | 'danger' | 'warning' | 'secondary'> = {
    Passed: 'success',
    Failed: 'danger',
    Tabled: 'warning',
    Pending: 'secondary',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

export function BoardMeetingManager() {
  const [meetings, _setMeetings] = useState<BoardMeeting[]>(mockMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<BoardMeeting | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'attendance' | 'resolutions' | 'minutes'>('agenda');
  const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const upcomingMeetings = meetings.filter((m) => m.date >= new Date() && m.status !== 'Cancelled');
  const pastMeetings = meetings.filter((m) => m.date < new Date() || m.status === 'Completed');

  const displayedMeetings = viewMode === 'upcoming' ? upcomingMeetings : viewMode === 'past' ? pastMeetings : meetings;

  const openMeetingDetail = (meeting: BoardMeeting) => {
    setSelectedMeeting(meeting);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Board Meeting Manager</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Schedule, track, and manage board and committee meetings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-slate-200 p-1">
                {(['upcoming', 'past', 'all'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      viewMode === mode ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <Button variant="primary" size="md">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Upcoming Meetings Calendar View */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Meetings List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === 'upcoming' ? 'Upcoming Meetings' : viewMode === 'past' ? 'Past Meetings' : 'All Meetings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayedMeetings.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No meetings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="cursor-pointer rounded-lg border border-slate-200 p-4 transition-all hover:border-primary-300 hover:shadow-sm"
                      onClick={() => openMeetingDetail(meeting)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                            <span className="text-xs font-medium">{formatDate(meeting.date, 'MMM')}</span>
                            <span className="text-lg font-bold">{formatDate(meeting.date, 'd')}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-slate-900">{meeting.title}</h3>
                              {getMeetingTypeBadge(meeting.type)}
                            </div>
                            <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {meeting.startTime} - {meeting.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                {meeting.isVirtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                {meeting.isVirtual ? 'Virtual' : meeting.location}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-slate-500">
                                <FileText className="h-4 w-4" />
                                {meeting.agenda.length} agenda items
                              </span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <Users className="h-4 w-4" />
                                {meeting.attendance.length} attendees
                              </span>
                              {meeting.resolutions.length > 0 && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {meeting.resolutions.length} resolutions
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(meeting.status)}
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & Board Members */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Meeting Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-primary-50 p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">{upcomingMeetings.length}</p>
                  <p className="text-sm text-primary-700">Upcoming</p>
                </div>
                <div className="rounded-lg bg-success-50 p-4 text-center">
                  <p className="text-2xl font-bold text-success-600">{pastMeetings.length}</p>
                  <p className="text-sm text-success-700">Completed</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-600">
                    {pastMeetings.reduce((acc, m) => acc + m.resolutions.length, 0)}
                  </p>
                  <p className="text-sm text-slate-700">Resolutions</p>
                </div>
                <div className="rounded-lg bg-warning-50 p-4 text-center">
                  <p className="text-2xl font-bold text-warning-600">
                    {pastMeetings.filter((m) => !m.minutesApproved).length}
                  </p>
                  <p className="text-sm text-warning-700">Pending Minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Board Members */}
          <Card>
            <CardHeader>
              <CardTitle>Board Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {boardMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.isIndependent && (
                        <Badge variant="success" size="sm">Independent</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Meeting Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="full"
      >
        <ModalHeader>
          <ModalTitle>{selectedMeeting?.title || 'Meeting Details'}</ModalTitle>
        </ModalHeader>
        {selectedMeeting && (
          <div>
            {/* Meeting Info */}
            <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">{formatDate(selectedMeeting.date, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">
                  {selectedMeeting.startTime} - {selectedMeeting.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedMeeting.isVirtual ? (
                  <Video className="h-4 w-4 text-slate-500" />
                ) : (
                  <MapPin className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-sm text-slate-700">{selectedMeeting.location}</span>
              </div>
              {getMeetingTypeBadge(selectedMeeting.type)}
              {getStatusBadge(selectedMeeting.status)}
            </div>

            {/* Tabs */}
            <div className="mb-4 border-b border-slate-200">
              <div className="flex gap-4">
                {(['agenda', 'attendance', 'resolutions', 'minutes'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'border-b-2 pb-3 text-sm font-medium transition-colors',
                      activeTab === tab
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-96 overflow-y-auto">
              {/* Agenda Tab */}
              {activeTab === 'agenda' && (
                <div className="space-y-3">
                  {selectedMeeting.agenda.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{item.title}</h4>
                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {item.presenter}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {item.duration} min
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div className="space-y-2">
                  {selectedMeeting.attendance.map((attendee) => (
                    <div
                      key={attendee.memberId}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {attendee.memberName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-900">{attendee.memberName}</span>
                      </div>
                      {getAttendanceStatusBadge(attendee.status)}
                    </div>
                  ))}
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                      Quorum Status:{' '}
                      <span className="font-medium text-success-600">
                        {selectedMeeting.attendance.filter((a) => a.status === 'Present').length >=
                        Math.ceil(selectedMeeting.attendance.length / 2)
                          ? 'Met'
                          : 'Not Met'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Resolutions Tab */}
              {activeTab === 'resolutions' && (
                <div>
                  {selectedMeeting.resolutions.length === 0 ? (
                    <div className="py-8 text-center">
                      <FileText className="mx-auto h-12 w-12 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">No resolutions recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedMeeting.resolutions.map((resolution) => (
                        <div key={resolution.id} className="rounded-lg border border-slate-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-500">{resolution.number}</span>
                                {getResolutionStatusBadge(resolution.status)}
                              </div>
                              <h4 className="mt-1 font-medium text-slate-900">{resolution.title}</h4>
                              <p className="mt-2 text-sm text-slate-600">{resolution.description}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-4 text-sm">
                            <span className="text-success-600">For: {resolution.votesFor}</span>
                            <span className="text-danger-600">Against: {resolution.votesAgainst}</span>
                            <span className="text-slate-500">Abstentions: {resolution.abstentions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Minutes Tab */}
              {activeTab === 'minutes' && (
                <div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">Meeting Minutes</p>
                          <p className="text-sm text-slate-500">
                            Status: {selectedMeeting.minutesApproved ? 'Approved' : 'Pending Approval'}
                          </p>
                        </div>
                      </div>
                      {selectedMeeting.minutesApproved ? (
                        <Button variant="secondary" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm">
                          <Edit2 className="mr-2 h-4 w-4" />
                          Record Minutes
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedMeeting.notes && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-700">Notes</p>
                      <p className="mt-1 text-sm text-slate-600">{selectedMeeting.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
          <Button variant="primary">Edit Meeting</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
