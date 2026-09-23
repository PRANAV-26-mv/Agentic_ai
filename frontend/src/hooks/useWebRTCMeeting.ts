import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  // Stable references across re-renders
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const meetingIdRef = useRef(meetingId);
  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  const localAudioEnabledRef = useRef(localAudioEnabled);
  useEffect(() => {
    localAudioEnabledRef.current = localAudioEnabled;
  }, [localAudioEnabled]);

  const localVideoEnabledRef = useRef(localVideoEnabled);
  useEffect(() => {
    localVideoEnabledRef.current = localVideoEnabled;
  }, [localVideoEnabled]);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidatesQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Determine Socket URL
  const getSocketUrl = useCallback(() => {
    if (API_BASE_URL.startsWith('http')) {
      return API_BASE_URL.replace(/\/api\/?$/, '');
    }
    return window.location.origin;
  }, []);

  // Robust Media Acquisition
  const acquireMediaStream = useCallback(async (withVideo: boolean, withAudio: boolean): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera and microphone access requires a secure connection (HTTPS or localhost).');
    }

    if (withVideo && withAudio) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch (err1) {
        console.warn('Simultaneous video+audio acquisition failed, attempting separately:', err1);
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => videoStream.addTrack(track));
          } catch (audioErr) {
            console.warn('Microphone access failed; continuing with video only:', audioErr);
            setLocalAudioEnabled(false);
          }
          return videoStream;
        } catch (videoErr) {
          console.warn('Camera access failed; falling back to audio only:', videoErr);
          setLocalVideoEnabled(false);
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      }
    } else if (withVideo) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        console.warn('Video acquisition failed, returning blank stream');
        setLocalVideoEnabled(false);
        throw err;
      }
    } else if (withAudio) {
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    throw new Error('Neither video nor audio was requested.');
  }, []);

  // Setup Web Audio Volume Meter
  const setupVolumeMeter = useCallback((stream: MediaStream) => {
    try {
      const hasAudio = stream.getAudioTracks().length > 0;
      if (!hasAudio) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const resumeCtx = () => {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
      };

      window.addEventListener('click', resumeCtx, { once: false });
      window.addEventListener('pointerdown', resumeCtx, { once: false });
      window.addEventListener('keydown', resumeCtx, { once: false });
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

        const activeAudio = localStreamRef.current?.getAudioTracks().some(t => t.enabled && t.readyState === 'live');
        if (analyserRef.current && activeAudio) {
          analyserRef.current.getByteTimeDomainData(timeData);
          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            sum += Math.abs(timeData[i] - 128);
          }
          const average = sum / timeData.length;
          const normalized = Math.min(100, Math.round((average / 18) * 100));
          setMicVolume(normalized);
        } else {
          setMicVolume(0);
        }
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (audioCtxErr) {
      console.warn('AudioContext volume analyzer skipped:', audioCtxErr);
    }
  }, []);

  // Helper to initialize local media stream safely
  const initLocalStream = useCallback(async (withVideo = true, withAudio = true): Promise<MediaStream | null> => {
    try {
      // If current stream already has live tracks, reuse it
      if (localStreamRef.current && localStreamRef.current.active) {
        const liveVid = localStreamRef.current.getVideoTracks().some(t => t.readyState === 'live');
        const liveAud = localStreamRef.current.getAudioTracks().some(t => t.readyState === 'live');
        if ((!withVideo || liveVid) && (!withAudio || liveAud)) {
          return localStreamRef.current;
        }
      }

      const stream = await acquireMediaStream(withVideo, withAudio);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setError(null);

      const hasVideo = stream.getVideoTracks().some(t => t.readyState === 'live');
      const hasAudio = stream.getAudioTracks().some(t => t.readyState === 'live');
      setLocalVideoEnabled(hasVideo);
      setLocalAudioEnabled(hasAudio);

      if (hasAudio) {
        setupVolumeMeter(stream);
      }

      return stream;
    } catch (err: any) {
      console.error('Local stream initialization error:', err);
      // If user denied or hardware missing, don't crash
      setError('Camera or microphone access was denied or is unavailable. Please check permissions.');
      return null;
    }
  }, [acquireMediaStream, setupVolumeMeter]);

  // Helper to drain queued ICE candidates for a peer
  const drainIceCandidates = useCallback(async (socketId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidatesQueueRef.current.get(socketId);
    if (!queue || queue.length === 0) return;

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`[WebRTC] Failed to add queued ICE candidate for ${socketId}:`, err);
      }
    }
    iceCandidatesQueueRef.current.delete(socketId);
  }, []);

  // Create Peer Connection Helper
  const createPeerConnection = useCallback((remoteSocketId: string, remoteUser: RemotePeer): RTCPeerConnection => {
    const existingPc = peerConnectionsRef.current.get(remoteSocketId);
    if (existingPc && existingPc.signalingState !== 'closed') {
      return existingPc;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(remoteSocketId, pc);

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStreamRef.current!);
        } catch (e) {
          console.warn('[WebRTC] Track add warning:', e);
        }
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit('signal-send', {
          toSocketId: remoteSocketId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from ${remoteSocketId}`);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setPeers(prev => {
        const next = new Map(prev);
        const existing = next.get(remoteSocketId) || remoteUser;
        next.set(remoteSocketId, {
          ...existing,
          stream: remoteStream
        });
        return next;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${remoteSocketId}:`, pc.connectionState);
    };

    return pc;
  }, []);

  // Stable Socket.IO Lifecycle
  const userId = user?.id;
  useEffect(() => {
    if (!meetingId || !userId) return;

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to meeting signaling server:', socket.id);
      setLoading(false);
      setError(null);
    });

    socket.on('meeting-error', (data: { message: string }) => {
      console.error('[Socket] Meeting error:', data.message);
      setError(data.message);
      setLoading(false);
    });

    // 1. You joined the meeting: setup existing peers and send offers
    socket.on('meeting-joined', async (data: {
      meeting: Meeting;
      existingPeers: RemotePeer[];
      isHost: boolean;
    }) => {
      console.log('[Socket] meeting-joined received. Existing peers:', data.existingPeers.length);
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
          socket.emit('signal-send', {
            toSocketId: peer.socketId,
            signal: { type: 'offer', sdp: offer }
          });
        } catch (offerErr) {
          console.error('[WebRTC] Failed to create offer for existing peer:', offerErr);
        }
      }

      setPeers(newPeersMap);
    });

    // 2. Someone else joined the meeting: add to peers map and prepare connection
    socket.on('user-joined', (newPeer: RemotePeer) => {
      console.log('[Socket] user-joined received:', newPeer.userName, newPeer.socketId);
      setPeers(prev => {
        const next = new Map(prev);
        next.set(newPeer.socketId, newPeer);
        return next;
      });
      createPeerConnection(newPeer.socketId, newPeer);
    });

    // 3. WebRTC signaling receiver (offer, answer, candidate)
    socket.on('signal-receive', async (data: { fromSocketId: string; signal: any }) => {
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
          await drainIceCandidates(fromSocketId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal-send', {
            toSocketId: fromSocketId,
            signal: { type: 'answer', sdp: answer }
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await drainIceCandidates(fromSocketId, pc);
        } else if (signal.type === 'candidate' && signal.candidate) {
          if (!pc.remoteDescription) {
            const queue = iceCandidatesQueueRef.current.get(fromSocketId) || [];
            queue.push(signal.candidate);
            iceCandidatesQueueRef.current.set(fromSocketId, queue);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (sigErr) {
        console.error('[WebRTC] Signal handling error:', sigErr);
      }
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
      iceCandidatesQueueRef.current.delete(data.socketId);
      setPeers(prev => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
      setRaisedHands(prev => prev.filter(u => u.socketId !== data.socketId));
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
      window.location.href = userRef.current?.role === 'ADMIN' ? '/admin/meetings' : '/meetings';
    });

    socket.on('meeting-ended', (data: { message: string }) => {
      alert(data.message || 'The host has ended this meeting.');
      window.location.href = userRef.current?.role === 'ADMIN' ? '/admin/meetings' : '/meetings';
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

    return () => {
      socket.disconnect();
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      iceCandidatesQueueRef.current.clear();
    };
  }, [meetingId, userId, getSocketUrl, createPeerConnection, drainIceCandidates]);

  // Clean up media streams and visualizers ONLY when component unmounts completely
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Join Room Execution: sends join-meeting message on the active socket
  const joinMeetingRoom = useCallback(async () => {
    if (!socketRef.current || !userRef.current || !meetingIdRef.current) return;

    try {
      let stream = localStreamRef.current;
      if (!stream || !stream.active) {
        stream = await initLocalStream(localVideoEnabledRef.current, localAudioEnabledRef.current);
      }

      socketRef.current.emit('join-meeting', {
        meetingId: meetingIdRef.current,
        user: {
          id: userRef.current.id,
          name: userRef.current.name,
          email: userRef.current.email,
          role: userRef.current.role
        },
        audioEnabled: localAudioEnabledRef.current,
        videoEnabled: localVideoEnabledRef.current
      });
    } catch (err: any) {
      console.error('Failed to join meeting:', err);
      setError('Failed to join meeting call.');
    }
  }, [initLocalStream]);

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

        // Add track to all active peer connections
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(newTrack, localStreamRef.current!);
        });

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        setLocalVideoEnabled(true);
        socketRef.current?.emit('toggle-video', { enabled: true });
        return;
      } catch (err) {
        console.warn('Failed to re-acquire video track:', err);
        return;
      }
    }

    videoTracks.forEach(track => {
      track.enabled = nextState;
    });
    setLocalVideoEnabled(nextState);
    setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    socketRef.current?.emit('toggle-video', { enabled: nextState });
  }, [localVideoEnabled, localAudioEnabled, initLocalStream]);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      socketRef.current?.emit('toggle-screen-share', { isSharing: false });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setScreenStream(stream);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          screenStreamRef.current = null;
          socketRef.current?.emit('toggle-screen-share', { isSharing: false });
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
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    iceCandidatesQueueRef.current.clear();
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
