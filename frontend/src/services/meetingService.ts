import { api } from './api';
import { Meeting, MeetingSettings, AdminMeetingPermission, MeetingParticipant } from '../types';

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
}

export interface SuperMeetingSettingsResponse {
  settings: MeetingSettings;
  admins: AdminMeetingPermission[];
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

  async getSuperMeetingSettings(): Promise<SuperMeetingSettingsResponse> {
    const res = await api.get('/meetings/super/settings');
    return res.data;
  },

  async updateSuperMeetingSettings(payload: Partial<MeetingSettings>): Promise<{ message: string; settings: MeetingSettings }> {
    const res = await api.put('/meetings/super/settings', payload);
    return res.data;
  }
};
