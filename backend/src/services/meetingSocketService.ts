import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { MeetingsModel, MeetingParticipantsModel } from '../models/dbModels.js';

interface MeetingSocketData {
  meetingId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: 'ADMIN' | 'STUDENT';
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isScreenSharing?: boolean;
  isHost?: boolean;
}

export function setupMeetingSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  io.on('connection', (socket: Socket) => {
    // 1. Join Meeting Room
    socket.on('join-meeting', async (payload: {
      meetingId: string;
      user: { id: string; name: string; email: string; role: 'ADMIN' | 'STUDENT' };
      audioEnabled?: boolean;
      videoEnabled?: boolean;
    }) => {
      try {
        const { meetingId, user, audioEnabled = true, videoEnabled = true } = payload;
        if (!meetingId || !user?.id) {
          socket.emit('meeting-error', { message: 'Invalid join parameters.' });
          return;
        }

        const meeting = MeetingsModel.findById(meetingId) || MeetingsModel.findByCode(meetingId);
        if (!meeting) {
          socket.emit('meeting-error', { message: 'Meeting not found or has been removed.' });
          return;
        }

        if (meeting.status === 'ENDED') {
          socket.emit('meeting-error', { message: 'This meeting has already ended.' });
          return;
        }

        // If meeting was SCHEDULED, mark as ACTIVE once host or participants join
        if (meeting.status === 'SCHEDULED' && (user.role === 'ADMIN' || meeting.host_id === user.id)) {
          MeetingsModel.update(meeting.id, {
            status: 'ACTIVE',
            actual_start_time: meeting.actual_start_time || new Date().toISOString()
          });
        }

        const actualMeetingId = meeting.id;
        const isHost = meeting.host_id === user.id || user.email.toLowerCase() === 'pranavannur9659@gmail.com';

        // Store metadata on socket
        socket.data = {
          meetingId: actualMeetingId,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          audioEnabled,
          videoEnabled,
          isScreenSharing: false,
          isHost
        } as MeetingSocketData;

        socket.join(actualMeetingId);

        // Record participant attendance
        MeetingParticipantsModel.recordJoin({
          meeting_id: actualMeetingId,
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_role: user.role,
          joined_at: new Date().toISOString(),
          is_host: isHost
        });

        // Find existing clients in this room (excluding current socket)
        const socketsInRoom = await io.in(actualMeetingId).fetchSockets();
        const existingPeers = socketsInRoom
          .filter(s => s.id !== socket.id)
          .map(s => ({
            socketId: s.id,
            userId: s.data.userId,
            userName: s.data.userName,
            userEmail: s.data.userEmail,
            userRole: s.data.userRole,
            audioEnabled: Boolean(s.data.audioEnabled),
            videoEnabled: Boolean(s.data.videoEnabled),
            isScreenSharing: Boolean(s.data.isScreenSharing),
            isHost: Boolean(s.data.isHost)
          }));

        // Send existing room members to the new joiner
        socket.emit('meeting-joined', {
          meeting: {
            id: meeting.id,
            code: meeting.code,
            title: meeting.title,
            description: meeting.description,
            meeting_type: meeting.meeting_type,
            audience_type: meeting.audience_type,
            host_name: meeting.host_name,
            host_email: meeting.host_email,
            allow_screen_share: meeting.allow_screen_share,
            allow_student_chat: meeting.allow_student_chat,
            status: meeting.status
          },
          existingPeers,
          isHost
        });

        // Notify other room participants about the new peer
        socket.to(actualMeetingId).emit('user-joined', {
          socketId: socket.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
          audioEnabled,
          videoEnabled,
          isScreenSharing: false,
          isHost
        });
      } catch (err: any) {
        console.error('Error in join-meeting socket handler:', err);
        socket.emit('meeting-error', { message: 'Failed to join meeting room.' });
      }
    });

    // 2. WebRTC Peer-to-Peer Signaling
    socket.on('signal-send', (payload: { toSocketId: string; signal: any }) => {
      const { toSocketId, signal } = payload;
      if (!toSocketId || !signal) return;
      io.to(toSocketId).emit('signal-receive', {
        fromSocketId: socket.id,
        signal
      });
    });

    // 3. Audio & Video State Toggles
    socket.on('toggle-audio', (payload: { enabled: boolean }) => {
      socket.data.audioEnabled = payload.enabled;
      if (socket.data.meetingId) {
        socket.to(socket.data.meetingId).emit('user-toggled-audio', {
          socketId: socket.id,
          userId: socket.data.userId,
          enabled: payload.enabled
        });
      }
    });

    socket.on('toggle-video', (payload: { enabled: boolean }) => {
      socket.data.videoEnabled = payload.enabled;
      if (socket.data.meetingId) {
        socket.to(socket.data.meetingId).emit('user-toggled-video', {
          socketId: socket.id,
          userId: socket.data.userId,
          enabled: payload.enabled
        });
      }
    });

    socket.on('toggle-screen-share', (payload: { isSharing: boolean }) => {
      socket.data.isScreenSharing = payload.isSharing;
      if (socket.data.meetingId) {
        socket.to(socket.data.meetingId).emit('user-toggled-screen-share', {
          socketId: socket.id,
          userId: socket.data.userId,
          isSharing: payload.isSharing
        });
      }
    });

    // 4. In-Meeting Chat
    socket.on('chat-message', (payload: { text: string }) => {
      if (!socket.data.meetingId || !payload.text?.trim()) return;

      const messageObj = {
        id: uuidv4(),
        senderId: socket.data.userId,
        senderName: socket.data.userName,
        senderRole: socket.data.userRole,
        text: payload.text.trim(),
        timestamp: new Date().toISOString()
      };

      io.in(socket.data.meetingId).emit('chat-message', messageObj);
    });

    // 5. Raise Hand
    socket.on('raise-hand', (payload: { isRaised: boolean }) => {
      if (!socket.data.meetingId) return;
      io.in(socket.data.meetingId).emit('user-raised-hand', {
        socketId: socket.id,
        userId: socket.data.userId,
        userName: socket.data.userName,
        isRaised: payload.isRaised
      });
    });

    // 6. Host Moderation Actions
    socket.on('host-action', async (payload: {
      action: 'mute-user' | 'mute-all' | 'remove-user' | 'end-meeting';
      targetSocketId?: string;
      targetUserId?: string;
    }) => {
      const { meetingId, isHost, userEmail } = socket.data as MeetingSocketData;
      const isSuper = userEmail?.toLowerCase() === 'pranavannur9659@gmail.com';
      if (!meetingId || (!isHost && !isSuper)) {
        socket.emit('meeting-error', { message: 'Unauthorized: Only the host or Super Admin can perform host actions.' });
        return;
      }

      const { action, targetSocketId } = payload;

      if (action === 'mute-user' && targetSocketId) {
        io.to(targetSocketId).emit('force-mute');
      } else if (action === 'mute-all') {
        socket.to(meetingId).emit('force-mute');
      } else if (action === 'remove-user' && targetSocketId) {
        io.to(targetSocketId).emit('kicked-from-meeting', {
          message: 'You have been removed from this meeting by the host.'
        });
      } else if (action === 'end-meeting') {
        MeetingsModel.update(meetingId, {
          status: 'ENDED',
          actual_end_time: new Date().toISOString()
        });
        io.in(meetingId).emit('meeting-ended', {
          message: 'The host has ended this meeting for all participants.'
        });
      }
    });

    // 7. Disconnection / Leave
    const handleLeave = () => {
      const { meetingId, userId } = socket.data as MeetingSocketData;
      if (meetingId && userId) {
        MeetingParticipantsModel.recordLeave(meetingId, userId);
        socket.to(meetingId).emit('user-left', {
          socketId: socket.id,
          userId
        });
      }
    };

    socket.on('leave-meeting', handleLeave);
    socket.on('disconnect', handleLeave);
  });

  return io;
}
