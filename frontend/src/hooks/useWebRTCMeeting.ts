import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../services/api';
import { Meeting } from '../types';

export interface RemotePeer {
  socketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'ADMIN' | 'STUDENT';
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  isHost: boolean;
  stream?: MediaStream;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'ADMIN' | 'STUDENT';
  text: string;
  timestamp: string;
}

export interface RaisedHandUser {
  socketId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export function useWebRTCMeeting(
  meetingId: string, 
  user: { id: string; name: string; email: string; role: 'ADMIN' | 'STUDENT' } | null
) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local Media Streams as React State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Local Media Controls
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // 0 to 100 for audio visualizer

  // Remote Peers & Room State
  const [peers, setPeers] = useState<Map<string, RemotePeer>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [raisedHands, setRaisedHands] = useState<RaisedHandUser[]>([]);

  // References
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Determine Socket URL
  const getSocketUrl = () => {
    if (API_BASE_URL.startsWith('http')) {
      return API_BASE_URL.replace(/\/api\/?$/, '');
    }
    return window.location.origin;
  };

  // Robust Media Acquisition
  const acquireMediaStream = async (withVideo: boolean, withAudio: boolean): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera and microphone access requires a secure connection (HTTPS or localhost).');
    }

    // 1. Try standard video & audio without rigid constraints
    if (withVideo && withAudio) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (err1) {
        console.warn('Initial video+audio acquisition failed, attempting separate tracks:', err1);
        try {
          // Try video alone first
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => videoStream.addTrack(track));
          } catch (audioErr) {
            console.warn('Microphone access failed; proceeding with video only:', audioErr);
            setLocalAudioEnabled(false);
          }
          return videoStream;
        } catch (videoErr) {
          console.warn('Camera access failed; falling back to microphone audio only:', videoErr);
          setLocalVideoEnabled(false);
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      }
    } else if (withVideo) {
      return await navigator.mediaDevices.getUserMedia({ video: true });
    } else if (withAudio) {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    throw new Error('Neither video nor audio was requested.');
  };

  // Helper to get or create local media stream
  const initLocalStream = useCallback(async (withVideo = true, withAudio = true): Promise<MediaStream | null> => {
    try {
      // If already active with requested tracks, reuse
      if (localStreamRef.current && localStreamRef.current.active) {
        const hasVid = localStreamRef.current.getVideoTracks().length > 0;
        const hasAud = localStreamRef.current.getAudioTracks().length > 0;
        if ((!withVideo || hasVid) && (!withAudio || hasAud)) {
          return localStreamRef.current;
        }
      }

      const stream = await acquireMediaStream(withVideo, withAudio);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setError(null);

      // Verify track states
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      setLocalVideoEnabled(hasVideo);
      setLocalAudioEnabled(hasAudio);

      // Setup Web Audio API volume visualizer with sensitive time-domain analyzer
      try {
        if (hasAudio) {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
          }

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const resumeCtx = () => {
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }
          };

          // Resume on any user interaction anywhere
          window.addEventListener('click', resumeCtx);
          window.addEventListener('pointerdown', resumeCtx);
          window.addEventListener('keydown', resumeCtx);
          resumeCtx();

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.4;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          const timeData = new Uint8Array(analyser.fftSize);

          const checkVolume = () => {
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }

            const activeAudio = localStreamRef.current?.getAudioTracks().some(t => t.enabled);
            if (analyserRef.current && activeAudio) {
              analyserRef.current.getByteTimeDomainData(timeData);
              let sum = 0;
              for (let i = 0; i < timeData.length; i++) {
                sum += Math.abs(timeData[i] - 128);
              }
              const average = sum / timeData.length;
              // Map waveform variation to 0-100% smoothly
              const normalized = Math.min(100, Math.round((average / 18) * 100));
              setMicVolume(normalized);
            } else {
              setMicVolume(0);
            }
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          };

          checkVolume();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext volume analyzer skipped:', audioCtxErr);
      }

      return stream;
    } catch (err: any) {
      console.error('Fatal media devices error:', err);
      setError('Camera or microphone access was denied or is unavailable. Please check permissions in your browser address bar.');
      return null;
    }
  }, []);

  // Initialize Socket.io Connection
  useEffect(() => {
    if (!meetingId || !user) return;

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to meeting signaling server:', socket.id);
      setLoading(false);
    });

    socket.on('meeting-error', (data: { message: string }) => {
      setError(data.message);
      setLoading(false);
    });

    socket.on('force-mute', () => {
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      setLocalAudioEnabled(false);
      setMicVolume(0);
      socket.emit('toggle-audio', { enabled: false });
    });

    socket.on('kicked-from-meeting', (data: { message: string }) => {
      alert(data.message || 'You have been removed from the meeting by the host.');
      window.location.href = user.role === 'ADMIN' ? '/admin/meetings' : '/meetings';
    });

    socket.on('meeting-ended', (data: { message: string }) => {
      alert(data.message || 'The host has ended this meeting.');
      window.location.href = user.role === 'ADMIN' ? '/admin/meetings' : '/meetings';
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('user-raised-hand', (data: { socketId: string; userId: string; userName: string; isRaised: boolean }) => {
      setRaisedHands(prev => {
        if (data.isRaised) {
          if (prev.some(u => u.socketId === data.socketId)) return prev;
          return [...prev, { socketId: data.socketId, userId: data.userId, userName: data.userName, timestamp: Date.now() }];
        } else {
          return prev.filter(u => u.socketId !== data.socketId);
        }
      });
    });

    socket.on('user-toggled-audio', (data: { socketId: string; enabled: boolean }) => {
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(data.socketId);
        if (peer) {
          next.set(data.socketId, { ...peer, audioEnabled: data.enabled });
        }
        return next;
      });
    });

    socket.on('user-toggled-video', (data: { socketId: string; enabled: boolean }) => {
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(data.socketId);
        if (peer) {
          next.set(data.socketId, { ...peer, videoEnabled: data.enabled });
        }
        return next;
      });
    });

    socket.on('user-toggled-screen-share', (data: { socketId: string; isSharing: boolean }) => {
      setPeers(prev => {
        const next = new Map(prev);
        const peer = next.get(data.socketId);
        if (peer) {
          next.set(data.socketId, { ...peer, isScreenSharing: data.isSharing });
        }
        return next;
      });
    });

    socket.on('user-left', (data: { socketId: string }) => {
      const pc = peerConnectionsRef.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.socketId);
      }
      setPeers(prev => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
      setRaisedHands(prev => prev.filter(u => u.socketId !== data.socketId));
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      socket.disconnect();
    };
  }, [meetingId, user]);

  // Create Peer Connection Helper
  const createPeerConnection = useCallback((remoteSocketId: string, remoteUser: RemotePeer) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteSocketId, pc);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal-send', {
          toSocketId: remoteSocketId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setPeers(prev => {
        const next = new Map(prev);
        const existing = next.get(remoteSocketId) || remoteUser;
        next.set(remoteSocketId, {
          ...existing,
          stream: remoteStream || new MediaStream([event.track])
        });
        return next;
      });
    };

    return pc;
  }, []);

  // Join Room Execution
  const joinMeetingRoom = useCallback(async () => {
    if (!socketRef.current || !user || !meetingId) return;

    try {
      const stream = await initLocalStream(localVideoEnabled, localAudioEnabled);

      socketRef.current.on('meeting-joined', async (data: {
        meeting: Meeting;
        existingPeers: RemotePeer[];
        isHost: boolean;
      }) => {
        setMeeting(data.meeting);
        setIsHost(data.isHost);
        setIsJoined(true);

        const newPeersMap = new Map<string, RemotePeer>();

        for (const peer of data.existingPeers) {
          newPeersMap.set(peer.socketId, peer);
          const pc = createPeerConnection(peer.socketId, peer);

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current?.emit('signal-send', {
              toSocketId: peer.socketId,
              signal: { type: 'offer', sdp: offer }
            });
          } catch (offerErr) {
            console.error('Failed to create WebRTC offer:', offerErr);
          }
        }

        setPeers(newPeersMap);
      });

      socketRef.current.on('user-joined', (newPeer: RemotePeer) => {
        setPeers(prev => {
          const next = new Map(prev);
          next.set(newPeer.socketId, newPeer);
          return next;
        });
        createPeerConnection(newPeer.socketId, newPeer);
      });

      socketRef.current.on('signal-receive', async (data: { fromSocketId: string; signal: any }) => {
        const { fromSocketId, signal } = data;
        let pc = peerConnectionsRef.current.get(fromSocketId);

        if (!pc) {
          const dummyPeer: RemotePeer = {
            socketId: fromSocketId,
            userId: '',
            userName: 'Participant',
            userEmail: '',
            userRole: 'STUDENT',
            audioEnabled: true,
            videoEnabled: true,
            isScreenSharing: false,
            isHost: false
          };
          pc = createPeerConnection(fromSocketId, dummyPeer);
        }

        try {
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current?.emit('signal-send', {
              toSocketId: fromSocketId,
              signal: { type: 'answer', sdp: answer }
            });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } else if (signal.type === 'candidate' && signal.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (sigErr) {
          console.error('Error handling WebRTC signal:', sigErr);
        }
      });

      socketRef.current.emit('join-meeting', {
        meetingId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        audioEnabled: localAudioEnabled,
        videoEnabled: localVideoEnabled
      });
    } catch (err: any) {
      console.error('Failed to join meeting:', err);
      setError('Failed to initialize meeting call.');
    }
  }, [meetingId, user, localAudioEnabled, localVideoEnabled, initLocalStream, createPeerConnection]);

  // Toggle Microphone
  const toggleAudio = useCallback(async () => {
    if (!localStreamRef.current) {
      const stream = await initLocalStream(localVideoEnabled, true);
      if (stream) setLocalAudioEnabled(true);
      return;
    }

    const nextState = !localAudioEnabled;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = nextState;
    });
    setLocalAudioEnabled(nextState);
    if (!nextState) setMicVolume(0);
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    socketRef.current?.emit('toggle-audio', { enabled: nextState });
  }, [localAudioEnabled, localVideoEnabled, initLocalStream]);

  // Toggle Camera
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current) {
      const stream = await initLocalStream(true, localAudioEnabled);
      if (stream) setLocalVideoEnabled(true);
      return;
    }

    const nextState = !localVideoEnabled;
    const videoTracks = localStreamRef.current.getVideoTracks();

    if (videoTracks.length === 0 && nextState) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = videoStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(newTrack, localStreamRef.current!);
        });
      } catch (camErr) {
        console.warn('Failed to reactivate camera:', camErr);
        return;
      }
    } else {
      videoTracks.forEach(track => {
        track.enabled = nextState;
      });
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }

    setLocalVideoEnabled(nextState);
    socketRef.current?.emit('toggle-video', { enabled: nextState });
  }, [localVideoEnabled, localAudioEnabled, initLocalStream]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        setScreenStream(null);
      }

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      peerConnectionsRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && cameraTrack) {
          sender.replaceTrack(cameraTrack);
        }
      });

      setIsScreenSharing(false);
      socketRef.current?.emit('toggle-screen-share', { isSharing: false });
    } else {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenStreamRef.current = sStream;
        setScreenStream(sStream);
        const screenTrack = sStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        socketRef.current?.emit('toggle-screen-share', { isSharing: true });
      } catch (screenErr) {
        console.warn('Screen share cancelled or failed:', screenErr);
      }
    }
  }, [isScreenSharing]);

  // Raise / Lower Hand
  const toggleRaiseHand = useCallback(() => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socketRef.current?.emit('raise-hand', { isRaised: nextState });
  }, [isHandRaised]);

  // Send In-Meeting Chat
  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    socketRef.current?.emit('chat-message', { text });
  }, []);

  // Host Action
  const performHostAction = useCallback((
    action: 'mute-user' | 'mute-all' | 'remove-user' | 'end-meeting', 
    targetSocketId?: string
  ) => {
    socketRef.current?.emit('host-action', { action, targetSocketId });
  }, []);

  // Leave Meeting
  const leaveMeeting = useCallback(() => {
    socketRef.current?.emit('leave-meeting');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    setIsJoined(false);
  }, []);

  return {
    meeting,
    isJoined,
    loading,
    error,
    localStream,
    screenStream,
    localAudioEnabled,
    localVideoEnabled,
    isScreenSharing,
    isHandRaised,
    isHost,
    micVolume,
    peers: Array.from(peers.values()),
    chatMessages,
    raisedHands,
    initLocalStream,
    joinMeetingRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleRaiseHand,
    sendChatMessage,
    performHostAction,
    leaveMeeting
  };
}
