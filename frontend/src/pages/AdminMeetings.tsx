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
  PhoneOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { meetingService, CreateMeetingPayload, SuperMeetingSettingsResponse } from '../services/meetingService';
import { Meeting, MeetingParticipant, MeetingAudienceType } from '../types';

export const AdminMeetings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = user?.email?.toLowerCase() === 'pranavannur9659@gmail.com' || user?.is_super_admin;

  // States
  const [activeTab, setActiveTab] = useState<'live' | 'scheduled' | 'past' | 'super'>('live');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    external_link: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Attendance Modal State
  const [attendanceModalMeeting, setAttendanceModalMeeting] = useState<Meeting | null>(null);
  const [attendanceList, setAttendanceList] = useState<MeetingParticipant[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

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

  // Load Super Admin Settings
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

  useEffect(() => {
    fetchMeetings();
    if (isSuperAdmin) {
      fetchSuperSettings();
    }
  }, [isSuperAdmin]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        external_link: ''
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

  // Filtered lists
  const liveMeetings = meetings.filter(m => m.status === 'ACTIVE');
  const scheduledMeetings = meetings.filter(m => m.status === 'SCHEDULED');
  const pastMeetings = meetings.filter(m => m.status === 'ENDED');

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
            Host high-definition Google Meet-style video calls, voice sessions, and targeted group conferences.
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

      {/* TAB CONTENT */}

      {/* 1. LIVE MEETINGS */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {liveMeetings.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
              <Video className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">No Meetings Currently Live</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start an instant meeting or launch a scheduled session to collaborate with your students or faculty.
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

                  <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/meetings/room/${meeting.id}`)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Join Room</span>
                    </button>

                    {(meeting.host_id === user?.id || isSuperAdmin) && (
                      <button
                        onClick={() => handleEndMeeting(meeting.id)}
                        className="p-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 rounded-xl transition-colors"
                        title="End Meeting for All"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. SCHEDULED MEETINGS */}
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

                  <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/meetings/room/${meeting.id}`)}
                      className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Now</span>
                    </button>

                    {(meeting.host_id === user?.id || isSuperAdmin) && (
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PAST MEETINGS & ATTENDANCE */}
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
                          onClick={() => handleOpenAttendance(meeting)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors inline-flex items-center space-x-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>View Attendance</span>
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

      {/* 4. SUPER ADMIN CONTROL CENTER */}
      {activeTab === 'super' && isSuperAdmin && superSettings && (
        <div className="space-y-6">
          {/* Master Policy Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Global Meeting Module Enablement */}
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

            {/* Admin Permission Mode */}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Admin Member Meeting Creation Privileges</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Control which individual admin members have authorization to schedule and host meetings.
                </p>
              </div>
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

      {/* CREATE MEETING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
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

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Agenda / Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional brief notes or instructions for attendees"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                />
              </div>

              {/* Target Audience Selector (Key Requirement) */}
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

              {/* If Specific Students selected, show department and year filters */}
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

              {/* Meeting Type */}
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

              {/* Optional Settings */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_screen_share}
                    onChange={e => setFormData({ ...formData, allow_screen_share: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                  />
                  <span>Allow participants to share screen</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_student_chat}
                    onChange={e => setFormData({ ...formData, allow_student_chat: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 bg-slate-950 border-slate-700"
                  />
                  <span>Allow in-meeting public text chat</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3">
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

      {/* ATTENDANCE MODAL */}
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
              <div className="p-8 text-center text-xs text-slate-500">Loading attendance data...</div>
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
