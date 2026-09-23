import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Radio, 
  Copy, 
  Check, 
  Play, 
  Trash2, 
  Crown, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Sliders, 
  X,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  PhoneOff,
  UserPlus,
  UserCheck,
  Search,
  MailCheck,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  meetingService, 
  CreateMeetingPayload, 
  SuperMeetingSettingsResponse, 
  MeetingResponsesResponse 
} from '../services/meetingService';
import { Meeting, MeetingParticipant, MeetingAudienceType, DirectoryMember, MemberResponse } from '../types';

export const AdminMeetings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  // States
  const [activeTab, setActiveTab] = useState<'live' | 'scheduled' | 'past' | 'super'>('live');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Directory Members (Students & Admins)
  const [directory, setDirectory] = useState<{ students: DirectoryMember[]; admins: DirectoryMember[] }>({ students: [], admins: [] });

  // Super Admin Settings State
  const [superSettings, setSuperSettings] = useState<SuperMeetingSettingsResponse | null>(null);
  const [canCreateMeetings, setCanCreateMeetings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Create Meeting Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateMeetingPayload>({
    title: '',
    description: '',
    meeting_type: 'VIDEO_VOICE',
    audience_type: 'ALL_STUDENTS',
    target_department: '',
    target_year: undefined,
    status: 'ACTIVE',
    scheduled_start_time: '',
    scheduled_end_time: '',
    allow_screen_share: true,
    allow_student_chat: true,
    mute_on_entry: false,
    external_link: '',
    invited_members: []
  });
  const [createMemberSearch, setCreateMemberSearch] = useState('');
  const [createMemberTab, setCreateMemberTab] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');
  const [submitting, setSubmitting] = useState(false);

  // Attendance Modal State
  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<Meeting | null>(null);
  const [attendanceList, setAttendanceList] = useState<MeetingParticipant[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Instant Add Member Modal State (Live & Scheduled)
  const [inviteModalMeeting, setInviteModalMeeting] = useState<Meeting | null>(null);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteMemberTab, setInviteMemberTab] = useState<'ALL' | 'STUDENT' | 'ADMIN'>('ALL');
  const [invitingMemberIds, setInvitingMemberIds] = useState<string[]>([]);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Member Responses Modal State
  const [responsesModalMeeting, setResponsesModalMeeting] = useState<Meeting | null>(null);
  const [responsesData, setResponsesData] = useState<MeetingResponsesResponse | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [responseSearch, setResponseSearch] = useState('');

  // Copy feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Meetings
  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await meetingService.getMeetings();
      setMeetings(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  // Load Super Admin Settings & Directory
  const fetchSuperSettings = async () => {
    try {
      const data = await meetingService.getSuperMeetingSettings();
      setSuperSettings(data);
      if (!isSuperAdmin) {
        const myPermission = data.admins.find(a => a.id === user?.id);
        setCanCreateMeetings(Boolean(myPermission?.can_create_meetings));
      }
    } catch (err) {
      console.warn('Super admin settings fetch error:', err);
    }
  };

  const fetchDirectory = async () => {
    try {
      const data = await meetingService.getDirectoryMembers();
      setDirectory(data);
    } catch (err) {
      console.warn('Directory fetch warning:', err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchDirectory();
    if (isSuperAdmin) {
      fetchSuperSettings();
    }
  }, [isSuperAdmin]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Create Meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a meeting title.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateMeetingPayload = {
        ...formData,
        scheduled_start_time: formData.status === 'SCHEDULED' 
          ? (formData.scheduled_start_time || new Date().toISOString()) 
          : new Date().toISOString()
      };

      const created = await meetingService.createMeeting(payload);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        meeting_type: 'VIDEO_VOICE',
        audience_type: 'ALL_STUDENTS',
        target_department: '',
        target_year: undefined,
        status: 'ACTIVE',
        scheduled_start_time: '',
        scheduled_end_time: '',
        allow_screen_share: true,
        allow_student_chat: true,
        mute_on_entry: false,
        external_link: '',
        invited_members: []
      });

      await fetchMeetings();

      if (created.status === 'ACTIVE') {
        navigate(`/meetings/room/${created.id}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle member selection in create modal
  const handleToggleCreateInviteMember = (member: DirectoryMember) => {
    const current = formData.invited_members || [];
    const exists = current.some(m => m.id === member.id);
    if (exists) {
      setFormData({
        ...formData,
        invited_members: current.filter(m => m.id !== member.id)
      });
    } else {
      setFormData({
        ...formData,
        invited_members: [...current, {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          department: member.department
        }]
      });
    }
  };

  // Instant Add Member to Existing Meeting
  const handleInstantInviteMember = async (member: DirectoryMember) => {
    if (!inviteModalMeeting) return;
    try {
      await meetingService.inviteMembers(inviteModalMeeting.id, [member]);
      setInvitingMemberIds(prev => [...prev, member.id]);
      setInviteSuccessMsg(`Invited ${member.name} to "${inviteModalMeeting.title}"!`);
      setTimeout(() => setInviteSuccessMsg(null), 3000);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to invite member.');
    }
  };

  // Load Member Responses
  const handleOpenResponses = async (meeting: Meeting) => {
    setResponsesModalMeeting(meeting);
    setLoadingResponses(true);
    try {
      const res = await meetingService.getMeetingResponses(meeting.id);
      setResponsesData(res);
    } catch (err) {
      alert('Failed to load member responses.');
    } finally {
      setLoadingResponses(false);
    }
  };

  // Live polling for member responses when modal is open
  useEffect(() => {
    if (!responsesModalMeeting) return;
    const interval = setInterval(async () => {
      try {
        const res = await meetingService.getMeetingResponses(responsesModalMeeting.id);
        setResponsesData(res);
      } catch (err) {
        // silent background polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [responsesModalMeeting]);

  const handleEndMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to end this meeting for all participants?')) return;
    try {
      await meetingService.endMeeting(id);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to end meeting.');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm('Delete this meeting record permanently?')) return;
    try {
      await meetingService.deleteMeeting(id);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete meeting.');
    }
  };

  const handleOpenAttendance = async (meeting: Meeting) => {
    setAttendanceModalMeeting(meeting);
    setLoadingAttendance(true);
    try {
      const res = await meetingService.getMeetingAttendance(meeting.id);
      setAttendanceList(res.participants || []);
    } catch (err) {
      alert('Failed to load attendance records.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Super Admin updates
  const handleToggleAdminPermission = async (adminId: string, currentPermitted: boolean) => {
    if (!superSettings) return;
    const currentList = superSettings.settings.permitted_admin_ids || [];
    let updatedList: string[];
    if (currentPermitted) {
      updatedList = currentList.filter(id => id !== adminId);
    } else {
      updatedList = [...currentList, adminId];
    }

    try {
      setSavingSettings(true);
      await meetingService.updateSuperMeetingSettings({
        permitted_admin_ids: updatedList,
        allow_all_admins: false
      });
      await fetchSuperSettings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update admin permission.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleGlobalMeetingEnabled = async () => {
    if (!superSettings) return;
    const next = !superSettings.settings.is_enabled;
    try {
      setSavingSettings(true);
      await meetingService.updateSuperMeetingSettings({ is_enabled: next });
      await fetchSuperSettings();
    } catch (err: any) {
      alert('Failed to update global meeting status.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleAllowAllAdmins = async () => {
    if (!superSettings) return;
    const next = !superSettings.settings.allow_all_admins;
    try {
      setSavingSettings(true);
      await meetingService.updateSuperMeetingSettings({ allow_all_admins: next });
      await fetchSuperSettings();
    } catch (err: any) {
      alert('Failed to update policy.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleAudienceType = async (type: MeetingAudienceType) => {
    if (!superSettings) return;
    const current = superSettings.settings.allowed_audience_types || [];
    let next: MeetingAudienceType[];
    if (current.includes(type)) {
      if (current.length === 1) {
        alert('At least one audience type must remain enabled.');
        return;
      }
      next = current.filter(t => t !== type);
    } else {
      next = [...current, type];
    }

    try {
      setSavingSettings(true);
      await meetingService.updateSuperMeetingSettings({ allowed_audience_types: next });
      await fetchSuperSettings();
    } catch (err: any) {
      alert('Failed to update audience permissions.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filter lists
  const liveMeetings = meetings.filter(m => m.status === 'ACTIVE');
  const scheduledMeetings = meetings.filter(m => m.status === 'SCHEDULED');
  const pastMeetings = meetings.filter(m => m.status === 'ENDED');

  const allDirectoryMembers = [...directory.admins, ...directory.students];

  const filteredInstantMembers = allDirectoryMembers.filter(m => {
    if (inviteMemberTab === 'STUDENT' && m.role !== 'STUDENT') return false;
    if (inviteMemberTab === 'ADMIN' && m.role !== 'ADMIN') return false;
    const q = inviteSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      (m.student_id && m.student_id.toLowerCase().includes(q))
    );
  });

  const filteredCreateMembers = allDirectoryMembers.filter(m => {
    if (createMemberTab === 'STUDENT' && m.role !== 'STUDENT') return false;
    if (createMemberTab === 'ADMIN' && m.role !== 'ADMIN') return false;
    const q = createMemberSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      (m.student_id && m.student_id.toLowerCase().includes(q))
    );
  });

  // Open Instant Invite from Header
  const handleOpenHeaderInstantInvite = () => {
    const target = liveMeetings[0] || scheduledMeetings[0];
    if (target) {
      setInviteModalMeeting(target);
      setInvitingMemberIds([]);
      setInviteSearch('');
    } else {
      setFormData(prev => ({ ...prev, status: 'ACTIVE' }));
      setShowCreateModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 rounded-3xl border border-purple-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-900/50 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Virtual Classroom & Video Meetings</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Live Meetings Management
          </h1>
          <p className="text-xs text-slate-400">
            Host high-definition Google Meet-style video calls, voice sessions, and instant member-targeted conferences.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, status: 'ACTIVE' }));
              setShowCreateModal(true);
            }}
            disabled={!canCreateMeetings && !isSuperAdmin}
            className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-lg ${
              (!canCreateMeetings && !isSuperAdmin)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/50 hover:scale-105 active:scale-95'
            }`}
          >
            <Video className="w-4 h-4 text-amber-300" />
            <span>Start Instant Meeting</span>
          </button>

          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, status: 'SCHEDULED' }));
              setShowCreateModal(true);
            }}
            disabled={!canCreateMeetings && !isSuperAdmin}
            className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all border ${
              (!canCreateMeetings && !isSuperAdmin)
                ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Schedule</span>
          </button>

          <button
            onClick={handleOpenHeaderInstantInvite}
            className="px-4 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 shadow-md hover:scale-105 active:scale-95"
            title="Instant Add or Invite Members to a Meeting"
          >
            <UserPlus className="w-4 h-4 text-purple-400" />
            <span>+ Add Member</span>
          </button>
        </div>
      </div>

      {/* Permission Warning Notice if revoked by Super Admin */}
      {!canCreateMeetings && !isSuperAdmin && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center space-x-3 text-amber-300 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <span>
            Meeting creation privilege is currently controlled and restricted by the Super Admin. You can still view and join existing authorized meetings.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'live'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Live Now ({liveMeetings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'scheduled'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Scheduled ({scheduledMeetings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'past'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Meeting History & Attendance ({pastMeetings.length})</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('super')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'super'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/50'
                : 'text-amber-400 hover:bg-amber-950/40 border border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>Super Admin Control Center</span>
          </button>
        )}
      </div>

      {/* TAB 1: LIVE MEETINGS */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {liveMeetings.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
              <Video className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Meetings Currently Live</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start an instant meeting or invite members to join an active video call.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  className="p-5 bg-slate-900/90 border border-purple-500/30 rounded-3xl space-y-4 shadow-xl hover:border-purple-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>LIVE NOW</span>
                      </span>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/40">
                        {meeting.audience_type}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white line-clamp-1">{meeting.title}</h3>
                      {meeting.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{meeting.description}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span>Host:</span>
                        <span className="font-semibold text-slate-200">{meeting.host_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Meeting Code:</span>
                        <button
                          onClick={() => handleCopyCode(meeting.code)}
                          className="font-mono text-xs font-bold text-indigo-300 hover:text-white flex items-center space-x-1"
                        >
                          <span>{meeting.code}</span>
                          {copiedId === meeting.code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex justify-between">
                        <span>Participants Inside:</span>
                        <span className="font-bold text-purple-300">{meeting.active_participants_count || 1}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar with Instant Add Member & Response Tracking */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/meetings/room/${meeting.id}`)}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg transition-transform hover:scale-[1.02]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Join Room</span>
                      </button>

                      <button
                        onClick={() => {
                          setInviteModalMeeting(meeting);
                          setInvitingMemberIds([]);
                          setInviteSearch('');
                        }}
                        className="py-2.5 px-3 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                        title="Instant Add Member"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Add Member</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => handleOpenResponses(meeting)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Member Responses</span>
                      </button>

                      {(meeting.host_id === user?.id || isSuperAdmin) && (
                        <button
                          onClick={() => handleEndMeeting(meeting.id)}
                          className="text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1"
                          title="End for All"
                        >
                          <PhoneOff className="w-3 h-3" />
                          <span>End Call</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULED MEETINGS */}
      {activeTab === 'scheduled' && (
        <div className="space-y-4">
          {scheduledMeetings.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Upcoming Meetings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a meeting for an upcoming workshop, lecture, or faculty sync.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledMeetings.map(meeting => (
                <div
                  key={meeting.id}
                  className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        SCHEDULED
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {meeting.audience_type}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white line-clamp-1">{meeting.title}</h3>
                      {meeting.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{meeting.description}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span className="font-semibold text-slate-200">
                          {new Date(meeting.scheduled_start_time).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Host:</span>
                        <span className="font-semibold text-slate-200">{meeting.host_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Code:</span>
                        <span className="font-mono font-bold text-indigo-300">{meeting.code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/meetings/room/${meeting.id}`)}
                        className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Now</span>
                      </button>

                      <button
                        onClick={() => {
                          setInviteModalMeeting(meeting);
                          setInvitingMemberIds([]);
                          setInviteSearch('');
                        }}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1"
                        title="Add Member to Session"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Member</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => handleOpenResponses(meeting)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Member Responses</span>
                      </button>

                      {(meeting.host_id === user?.id || isSuperAdmin) && (
                        <button
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          className="text-slate-400 hover:text-rose-400 font-semibold"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAST MEETINGS & ATTENDANCE */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastMeetings.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
              <Clock className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Past Meetings</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Completed meetings and their attendance rosters will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Host</th>
                    <th className="py-3.5 px-4">Audience</th>
                    <th className="py-3.5 px-4">Conducted Date</th>
                    <th className="py-3.5 px-4">Attendance</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {pastMeetings.map(meeting => (
                    <tr key={meeting.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {meeting.title}
                        <span className="block font-mono text-[10px] text-indigo-400 mt-0.5">{meeting.code}</span>
                      </td>
                      <td className="py-3.5 px-4">{meeting.host_name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                          {meeting.audience_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {new Date(meeting.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-300">
                        {meeting.total_participants_count || 0} participants
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenResponses(meeting)}
                          className="px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 rounded-lg text-xs font-semibold text-indigo-300 transition-colors inline-flex items-center space-x-1"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Responses</span>
                        </button>

                        <button
                          onClick={() => handleOpenAttendance(meeting)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors inline-flex items-center space-x-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Attendance</span>
                        </button>

                        {(meeting.host_id === user?.id || isSuperAdmin) && (
                          <button
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors inline-flex items-center"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUPER ADMIN CONTROL CENTER */}
      {activeTab === 'super' && isSuperAdmin && superSettings && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Global Meeting Enablement */}
            <div className="p-6 bg-slate-900/90 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>Global Meeting Engine</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Master toggle to enable or disable meeting capabilities across the entire portal.
                  </p>
                </div>
                <button
                  onClick={handleToggleGlobalMeetingEnabled}
                  disabled={savingSettings}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                    superSettings.settings.is_enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    superSettings.settings.is_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="pt-2 text-[11px] text-slate-400">
                Current Status: <span className="font-bold text-white">{superSettings.settings.is_enabled ? 'Active / Enabled' : 'Disabled for All'}</span>
              </div>
            </div>

            {/* Admin Creation Mode */}
            <div className="p-6 bg-slate-900/90 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Allow All Admins to Create</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    If enabled, any registered admin can create meetings. If disabled, only permitted admins below can create.
                  </p>
                </div>
                <button
                  onClick={handleToggleAllowAllAdmins}
                  disabled={savingSettings}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                    superSettings.settings.allow_all_admins ? 'bg-purple-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    superSettings.settings.allow_all_admins ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              <div className="pt-2 text-[11px] text-slate-400">
                Policy: <span className="font-bold text-white">{superSettings.settings.allow_all_admins ? 'Open to All Admins' : 'Restricted (Per-Admin Grant)'}</span>
              </div>
            </div>
          </div>

          {/* Allowed Audience Configuration */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Permitted Target Audiences for Regular Admins</span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose which audience types faculty and admins are allowed to target when scheduling meetings.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { id: 'ALL_STUDENTS', label: 'All Students' },
                { id: 'SPECIFIC_STUDENTS', label: 'Department / Year' },
                { id: 'ADMINS_ONLY', label: 'Admins / Faculty Only' },
                { id: 'ALL', label: 'Everyone (Admins + Students)' }
              ].map(opt => {
                const isChecked = superSettings.settings.allowed_audience_types?.includes(opt.id as any);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleToggleAudienceType(opt.id as any)}
                    disabled={savingSettings}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                      isChecked
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isChecked ? <Check className="w-4 h-4 text-purple-400" /> : <div className="w-4 h-4 rounded border border-slate-700" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Per-Admin Permissions Roster */}
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Admin Member Meeting Creation Privileges</span>
              </h3>
              <p className="text-xs text-slate-400">
                Control which individual admin members have authorization to schedule and host meetings.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Admin Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Meeting Creation Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {superSettings.admins.map(adm => {
                    const isSelfSuper = adm.email.toLowerCase() === 'pranavannur9659@gmail.com' || adm.is_super_admin;
                    const isPermitted = superSettings.settings.allow_all_admins || (superSettings.settings.permitted_admin_ids && superSettings.settings.permitted_admin_ids.includes(adm.id));

                    return (
                      <tr key={adm.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                          <span>{adm.name}</span>
                          {isSelfSuper && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                              Super Admin
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{adm.email}</td>
                        <td className="py-3 px-4">{adm.department}</td>
                        <td className="py-3 px-4 text-right">
                          {isSelfSuper ? (
                            <span className="text-[11px] font-bold text-amber-400">Master Authority</span>
                          ) : superSettings.settings.allow_all_admins ? (
                            <span className="text-[11px] text-emerald-400 font-semibold">Granted (All Admins Policy)</span>
                          ) : (
                            <button
                              onClick={() => handleToggleAdminPermission(adm.id, Boolean(isPermitted))}
                              disabled={savingSettings}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isPermitted 
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md' 
                                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              }`}
                            >
                              {isPermitted ? 'Authorized' : 'Grant Permission'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE MEETING WITH INSTANT MEMBER PICKER */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  {formData.status === 'ACTIVE' ? 'Instant Collaboration' : 'Schedule for Later'}
                </span>
                <h2 className="text-lg font-black text-white">Create New Meeting</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              {/* Meeting Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Lab Project Review & Discussion"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {/* Target Audience Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Who is this meeting for? (Audience) *</span>
                </label>
                <select
                  value={formData.audience_type}
                  onChange={e => setFormData({ ...formData, audience_type: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-purple-500/40 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-400 font-semibold"
                >
                  <option value="ALL_STUDENTS">Students Only (All Registered Students)</option>
                  <option value="SPECIFIC_STUDENTS">Specific Students (Filter by Department/Year)</option>
                  <option value="ADMINS_ONLY">Admins / Faculty Only (Private Staff Call)</option>
                  <option value="ALL">Everyone (Both Admins & Students)</option>
                </select>
              </div>

              {/* Specific Department & Year Filters */}
              {formData.audience_type === 'SPECIFIC_STUDENTS' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. AD, CSE, IT"
                      value={formData.target_department || ''}
                      onChange={e => setFormData({ ...formData, target_department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Year</label>
                    <select
                      value={formData.target_year || ''}
                      onChange={e => setFormData({ ...formData, target_year: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="">All Years</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Instant Add Members Picker directly in Create Modal */}
              <div className="space-y-2 p-3 bg-slate-950/80 border border-purple-500/30 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Instant Add Specific Members (Optional)</span>
                  </label>
                  <span className="text-[11px] text-purple-300 font-semibold">
                    {formData.invited_members?.length || 0} selected
                  </span>
                </div>

                {/* Selected Member Chips */}
                {formData.invited_members && formData.invited_members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-purple-500/20">
                    {formData.invited_members.map(m => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200 text-[10px] font-semibold flex items-center space-x-1"
                      >
                        <span>{m.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCreateInviteMember(m as any)}
                          className="hover:text-rose-400 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Category Filter Tabs */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCreateMemberTab('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      createMemberTab === 'ALL'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({allDirectoryMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMemberTab('STUDENT')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      createMemberTab === 'STUDENT'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Students ({directory.students.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMemberTab('ADMIN')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      createMemberTab === 'ADMIN'
                        ? 'bg-purple-700 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Faculty ({directory.admins.length})
                  </button>
                </div>

                {/* Search and Quick Pick */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search students or faculty by name, email, department..."
                      value={createMemberSearch}
                      onChange={e => setCreateMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  {/* Always-visible Member List */}
                  <div className="max-h-44 overflow-y-auto space-y-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 divide-y divide-slate-800/40">
                    {filteredCreateMembers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No members match your search.</div>
                    ) : (
                      filteredCreateMembers.map(member => {
                        const isSelected = formData.invited_members?.some(m => m.id === member.id);
                        return (
                          <div
                            key={member.id}
                            className={`p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                              isSelected ? 'bg-purple-950/60 text-purple-200' : 'hover:bg-slate-800/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 pr-2">
                              <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                member.role === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-sky-600 text-white'
                              }`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 truncate">
                                <span className="font-semibold text-white truncate block">{member.name}</span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {member.email} • {member.department} {member.role === 'ADMIN' ? '• Faculty' : ''}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleCreateInviteMember(member)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all shrink-0 ${
                                isSelected 
                                  ? 'bg-purple-600 text-white hover:bg-rose-600 shadow-xs' 
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {isSelected ? '✓ Added' : '+ Add'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Call Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Call Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, meeting_type: 'VIDEO_VOICE' })}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      formData.meeting_type === 'VIDEO_VOICE'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>Video & Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, meeting_type: 'VOICE_ONLY' })}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      formData.meeting_type === 'VOICE_ONLY'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span>Voice Only</span>
                  </button>
                </div>
              </div>

              {/* Scheduled Date/Time if SCHEDULED */}
              {formData.status === 'SCHEDULED' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_start_time}
                    onChange={e => setFormData({ ...formData, scheduled_start_time: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/50 hover:scale-105 active:scale-95 transition-all"
                >
                  {submitting ? 'Creating...' : formData.status === 'ACTIVE' ? 'Start Meeting Now' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSTANT ADD MEMBER TO ONGOING/SCHEDULED MEETING */}
      {inviteModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Instant Member Invitation
                </span>
                <h2 className="text-base font-bold text-white">{inviteModalMeeting.title}</h2>
              </div>
              <button
                onClick={() => setInviteModalMeeting(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{inviteSuccessMsg}</span>
              </div>
            )}

            {/* Meeting Selector (if multiple exist) */}
            {meetings.filter(m => m.status !== 'ENDED').length > 1 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Target Meeting:</label>
                <select
                  value={inviteModalMeeting.id}
                  onChange={e => {
                    const sel = meetings.find(m => m.id === e.target.value);
                    if (sel) setInviteModalMeeting(sel);
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-purple-500/40 rounded-xl text-xs text-white focus:outline-hidden"
                >
                  {meetings.filter(m => m.status !== 'ENDED').map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.status}] {m.title} ({m.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Share Link & Responses Shortcut */}
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Direct Join Link</span>
                <button
                  onClick={() => {
                    const curr = inviteModalMeeting;
                    setInviteModalMeeting(null);
                    handleOpenResponses(curr);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>View Member Responses ({inviteModalMeeting.invited_members?.length || 0})</span>
                </button>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-purple-300 truncate mr-2">
                  {window.location.origin}/meetings/room/{inviteModalMeeting.id}
                </span>
                <button
                  onClick={() => handleCopyCode(`${window.location.origin}/meetings/room/${inviteModalMeeting.id}`)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white shrink-0 flex items-center space-x-1"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-1.5 pt-1">
              <button
                type="button"
                onClick={() => setInviteMemberTab('ALL')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  inviteMemberTab === 'ALL'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                All ({allDirectoryMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setInviteMemberTab('STUDENT')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  inviteMemberTab === 'STUDENT'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Students ({directory.students.length})
              </button>
              <button
                type="button"
                onClick={() => setInviteMemberTab('ADMIN')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  inviteMemberTab === 'ADMIN'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Faculty ({directory.admins.length})
              </button>
            </div>

            {/* Member Directory Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search students or faculty by name, email, department..."
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredInstantMembers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No members matched your search.</div>
                ) : (
                  filteredInstantMembers.map(member => {
                    const isInvited = invitingMemberIds.includes(member.id) || inviteModalMeeting.invited_members?.some(im => im.id === member.id);
                    return (
                      <div
                        key={member.id}
                        className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            member.role === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-sky-600 text-white'
                          }`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {member.email} • {member.department} {member.role === 'ADMIN' ? '• Faculty' : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInstantInviteMember(member)}
                          disabled={isInvited}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ml-2 ${
                            isInvited
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                          }`}
                        >
                          {isInvited ? 'Invited ✓' : '+ Add to Meeting'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MEMBER RESPONSES & LIVE ATTENDANCE STATUS */}
      {responsesModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    Member Responses & Attendance
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Syncing</span>
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">{responsesModalMeeting.title}</h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const m = responsesModalMeeting;
                    setResponsesModalMeeting(null);
                    setInviteModalMeeting(m);
                    setInvitingMemberIds([]);
                    setInviteSearch('');
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Invite Members</span>
                </button>
                <button
                  onClick={() => setResponsesModalMeeting(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingResponses && !responsesData ? (
              <div className="p-12 text-center text-xs text-slate-500 font-bold">
                Loading member responses...
              </div>
            ) : responsesData ? (
              <div className="space-y-4">
                {/* Response KPI Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold block">Total Invited</span>
                    <span className="text-lg font-black text-white">{responsesData.total_invited}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-semibold block">In Call Now</span>
                    <span className="text-lg font-black text-emerald-300">{responsesData.total_joined}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-sky-500/30">
                    <span className="text-[10px] text-sky-400 font-semibold block">Left</span>
                    <span className="text-lg font-black text-sky-300">{responsesData.total_left}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/30">
                    <span className="text-[10px] text-amber-400 font-semibold block">Pending</span>
                    <span className="text-lg font-black text-amber-300">{responsesData.total_pending}</span>
                  </div>
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter responses by name or email..."
                    value={responseSearch}
                    onChange={e => setResponseSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                {/* Responses Table */}
                <div className="overflow-x-auto max-h-72 rounded-2xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Joined Time</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {responsesData.responses
                        .filter(r => {
                          const q = responseSearch.toLowerCase().trim();
                          if (!q) return true;
                          return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
                        })
                        .map(resp => (
                          <tr key={resp.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-white block">{resp.name}</span>
                              <span className="text-[10px] text-slate-500">{resp.email}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                resp.role === 'ADMIN' ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {resp.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {resp.status === 'JOINED' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  <span>In Call Now</span>
                                </span>
                              ) : resp.status === 'LEFT' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300">
                                  Attended
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300">
                                  Pending Join
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {resp.joined_at ? new Date(resp.joined_at).toLocaleTimeString() : '—'}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-purple-300">
                              {resp.duration_seconds ? `${Math.ceil(resp.duration_seconds / 60)} mins` : resp.status === 'JOINED' ? 'Active' : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {resp.status === 'INVITED' ? (
                                <button
                                  onClick={() => handleInstantInviteMember({ id: resp.id, name: resp.name, email: resp.email, role: resp.role, department: resp.department || '' })}
                                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold transition-all"
                                  title="Send instant reminder notification"
                                >
                                  Ping / Remind
                                </button>
                              ) : resp.status === 'JOINED' ? (
                                <span className="text-[10px] text-emerald-400 font-bold">Online</span>
                              ) : (
                                <button
                                  onClick={() => handleInstantInviteMember({ id: resp.id, name: resp.name, email: resp.email, role: resp.role, department: resp.department || '' })}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold"
                                  title="Re-invite member to join"
                                >
                                  Re-invite
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 4: ATTENDANCE MODAL */}
      {attendanceModalMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Attendance Record
                </span>
                <h2 className="text-base font-bold text-white">{attendanceModalMeeting.title}</h2>
              </div>
              <button
                onClick={() => setAttendanceModalMeeting(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAttendance ? (
              <div className="p-8 text-center text-xs text-slate-500 font-bold">Loading attendance data...</div>
            ) : attendanceList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No participant records recorded for this meeting.</div>
            ) : (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Joined At</th>
                      <th className="py-2.5 px-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {attendanceList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {item.user_name}
                          {item.is_host && (
                            <span className="ml-1 text-[9px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">
                              Host
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">{item.user_role}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.user_email}</td>
                        <td className="py-2.5 px-3">{new Date(item.joined_at).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-3 font-bold text-purple-300">
                          {item.duration_seconds ? `${Math.ceil(item.duration_seconds / 60)} mins` : 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMeetings;
