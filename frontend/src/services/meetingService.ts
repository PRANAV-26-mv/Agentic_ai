import { api } from './api';
import { Meeting, MeetingSettings, AdminMeetingPermission, MeetingParticipant, DirectoryMember, MemberResponse } from '../types';

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  meeting_type?: 'VIDEO_VOICE' | 'VOICE_ONLY';
  audience_type: 'ALL_STUDENTS' | 'SPECIFIC_STUDENTS' | 'ADMINS_ONLY' | 'ALL';
  target_department?: string;
  target_year?: number;
  status?: 'SCHEDULED' | 'ACTIVE';
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  allow_screen_share?: boolean;
  allow_student_chat?: boolean;
  mute_on_entry?: boolean;
  external_link?: string;
  invited_members?: Array<{ id: string; name: string; email: string; role: 'ADMIN' | 'STUDENT'; department?: string }>;
}

export interface SuperMeetingSettingsResponse {
  settings: MeetingSettings;
  admins: AdminMeetingPermission[];
}

export interface MeetingResponsesResponse {
  meeting: Meeting;
  total_invited: number;
  total_joined: number;
  total_left: number;
  total_pending: number;
  responses: MemberResponse[];
}

export const meetingService = {
  async getMeetings(): Promise<Meeting[]> {
    const res = await api.get('/meetings');
    return res.data;
  },

  async getMeeting(idOrCode: string): Promise<Meeting> {
    const res = await api.get(`/meetings/${idOrCode}`);
    return res.data;
  },

  async createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
    const res = await api.post('/meetings', payload);
    return res.data;
  },

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting> {
    const res = await api.put(`/meetings/${id}`, updates);
    return res.data;
  },

  async endMeeting(id: string): Promise<{ message: string; meeting: Meeting }> {
    const res = await api.post(`/meetings/${id}/end`);
    return res.data;
  },

  async deleteMeeting(id: string): Promise<{ message: string }> {
    const res = await api.delete(`/meetings/${id}`);
    return res.data;
  },

  async getMeetingAttendance(id: string): Promise<{ meeting: Meeting; total_attended: number; participants: MeetingParticipant[] }> {
    const res = await api.get(`/meetings/${id}/attendance`);
    return res.data;
  },

  async getDirectoryMembers(): Promise<{ students: DirectoryMember[]; admins: DirectoryMember[] }> {
    const res = await api.get('/meetings/directory/members');
    return res.data;
  },

  async inviteMembers(meetingId: string, members: Array<{ id: string; name: string; email: string; role: 'ADMIN' | 'STUDENT'; department?: string }>): Promise<{ message: string; meeting: Meeting }> {
    const res = await api.post(`/meetings/${meetingId}/invite`, { members });
    return res.data;
  },

  async getMeetingResponses(meetingId: string): Promise<MeetingResponsesResponse> {
    const res = await api.get(`/meetings/${meetingId}/responses`);
    return res.data;
  },

  async getSuperMeetingSettings(): Promise<SuperMeetingSettingsResponse> {
    const res = await api.get('/meetings/super/settings');
    return res.data;
  },

  async updateSuperMeetingSettings(payload: Partial<MeetingSettings>): Promise<{ message: string; settings: MeetingSettings }> {
    const res = await api.put('/meetings/super/settings', payload);
    return res.data;
  }
};
