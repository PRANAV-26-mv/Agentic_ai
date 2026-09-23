import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  ScreenShare, 
  StopCircle, 
  Hand, 
  MessageSquare, 
  Users, 
  PhoneOff, 
  Copy, 
  Check, 
  Info, 
  ShieldAlert, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Crown,
  Sparkles,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTCMeeting, RemotePeer } from '../hooks/useWebRTCMeeting';

export const MeetingRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // WebRTC hook
  const {
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
    peers,
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
  } = useWebRTCMeeting(id || '', user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  } : null);

  // UI Panels
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'participants' | 'info' | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [lobbyStreamStarted, setLobbyStreamStarted] = useState(false);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Initialize camera preview in pre-join lobby
  useEffect(() => {
    if (!isJoined && !lobbyStreamStarted) {
      initLocalStream(true, true).then(stream => {
        if (stream && lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
        setLobbyStreamStarted(true);
      });
    }
  }, [isJoined, lobbyStreamStarted, initLocalStream]);

  // Connect local video element once joined
  useEffect(() => {
    if (isJoined && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [isJoined, localStream, localVideoEnabled]);

  // Connect screen share video element
  useEffect(() => {
    if (isScreenSharing && screenStream && screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = screenStream;
    }
  }, [isScreenSharing, screenStream]);

  // Elapsed timer once joined
  useEffect(() => {
    if (!isJoined) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isJoined]);

  // Auto scroll chat
  useEffect(() => {
    if (activeDrawer === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeDrawer]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleLeaveCall = () => {
    leaveMeeting();
    navigate(user?.role === 'ADMIN' ? '/admin/meetings' : '/meetings');
  };

  const handleEndMeetingForAll = () => {
    performHostAction('end-meeting');
    leaveMeeting();
    navigate(user?.role === 'ADMIN' ? '/admin/meetings' : '/meetings');
  };

  // Find if any peer is sharing screen
  const screenSharingPeer = peers.find(p => p.isScreenSharing);
  const activeScreenShareStream = isScreenSharing ? screenStream : screenSharingPeer?.stream;

  // ==========================================
  // 1. PRE-JOIN LOBBY SCREEN (GOOGLE MEET STYLE)
  // ==========================================
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-4xl z-10 flex flex-col items-center space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300">
              <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Portal Live Meeting Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Ready to Join?
            </h1>
            <p className="text-sm text-slate-400">
              Check your camera, microphone, and preview before entering the session.
            </p>
          </div>

          {error && (
            <div className="w-full max-w-lg p-4 bg-rose-950/80 border border-rose-500/40 rounded-2xl text-rose-300 text-sm flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-center">
            {/* Camera Preview Tile */}
            <div className="md:col-span-7 flex flex-col items-center space-y-4">
              <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl shadow-purple-950/20 flex items-center justify-center">
                {localVideoEnabled ? (
                  <video
                    ref={lobbyVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-medium text-slate-400">Camera is turned off</span>
                  </div>
                )}

                {/* Mic Volume Level Meter Indicator */}
                {localAudioEnabled && (
                  <div className="absolute top-4 left-4 flex items-center space-x-1.5 px-3 py-1 bg-slate-950/70 backdrop-blur-md rounded-full border border-slate-700/50">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ width: `${Math.max(5, micVolume)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Controls Pill */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center space-x-3">
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-all duration-200 backdrop-blur-md shadow-lg ${
                      localAudioEnabled 
                        ? 'bg-slate-800/90 text-white hover:bg-slate-700' 
                        : 'bg-rose-600 text-white hover:bg-rose-500 ring-2 ring-rose-400/50'
                    }`}
                    title={localAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {localAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-all duration-200 backdrop-blur-md shadow-lg ${
                      localVideoEnabled 
                        ? 'bg-slate-800/90 text-white hover:bg-slate-700' 
                        : 'bg-rose-600 text-white hover:bg-rose-500 ring-2 ring-rose-400/50'
                    }`}
                    title={localVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {localVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Joining Information & Actions */}
            <div className="md:col-span-5 flex flex-col space-y-6">
              <div className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                <div>
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    Meeting Details
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {meeting?.title || 'Live Collaboration Session'}
                  </h2>
                  {meeting?.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{meeting.description}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Host:</span>
                    <span className="font-semibold text-slate-200">{meeting?.host_name || 'Faculty Admin'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Audience:</span>
                    <span className="font-medium px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {meeting?.audience_type || 'ALL_STUDENTS'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Meeting Code:</span>
                    <span className="font-mono font-bold text-indigo-300">{meeting?.code || id}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={joinMeetingRoom}
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-white shadow-xl shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Join Now</span>
                  </button>

                  <button
                    onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/meetings' : '/meetings')}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    Return to Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. IN-CALL MEETING ROOM (GOOGLE MEET STYLE)
  // ==========================================
  return (
    <div className="h-screen w-screen bg-[#131316] text-slate-100 flex flex-col overflow-hidden select-none font-sans relative">
      {/* Hand Raise Floating Notification Toast */}
      {raisedHands.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="px-4 py-2 bg-amber-500 text-slate-950 rounded-full font-bold text-xs flex items-center space-x-2 shadow-2xl">
            <Hand className="w-4 h-4 fill-current" />
            <span>{raisedHands[raisedHands.length - 1].userName} raised a hand!</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-14 px-4 sm:px-6 bg-[#1b1b20] border-b border-slate-800/60 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="font-bold text-sm text-slate-100 truncate max-w-xs sm:max-w-md">
              {meeting?.title || 'Live Meeting'}
            </h1>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/60 rounded-lg text-xs font-mono text-slate-300">
            <span>{meeting?.code}</span>
            <button 
              onClick={() => copyToClipboard(meeting?.code || '', 'code')}
              className="text-slate-400 hover:text-white transition-colors"
              title="Copy code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Elapsed Duration Clock */}
          <div className="px-3 py-1 bg-slate-800/50 rounded-full text-xs font-mono text-slate-300 border border-slate-700/40">
            {formatTimer(elapsedSeconds)}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center Main Stage + Drawers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Stage Grid */}
        <main className={`flex-1 p-3 sm:p-4 overflow-hidden flex flex-col justify-center items-center transition-all duration-300 ${activeDrawer ? 'mr-0 sm:mr-80' : ''}`}>
          {/* Screen Share Spotlight Layout */}
          {activeScreenShareStream ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-3">
              {/* Main Presentation Screen */}
              <div className="flex-1 h-full bg-black rounded-2xl overflow-hidden border border-purple-500/30 relative flex items-center justify-center">
                <video
                  ref={screenShareVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-purple-950/80 backdrop-blur-md rounded-full border border-purple-500/40 text-xs font-semibold text-purple-300 flex items-center space-x-1.5">
                  <ScreenShare className="w-3.5 h-3.5" />
                  <span>{isScreenSharing ? 'You are sharing your screen' : `${screenSharingPeer?.userName} is presenting`}</span>
                </div>
              </div>

              {/* Side Participant Filmstrip */}
              <div className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-40 lg:max-h-full">
                {/* Local User Mini Tile */}
                <div className="w-40 lg:w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative shrink-0">
                  {localVideoEnabled ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-xs font-bold text-slate-300">You</div>
                  )}
                  <div className="absolute bottom-1 left-2 text-[10px] text-white/80 font-medium">You</div>
                </div>

                {/* Peer Mini Tiles */}
                {peers.map(peer => (
                  <PeerVideoTile key={peer.socketId} peer={peer} isCompact />
                ))}
              </div>
            </div>
          ) : (
            /* Dynamic Multi-Participant Grid */
            <div className={`w-full h-full grid gap-3 sm:gap-4 place-content-center ${
              peers.length === 0 ? 'grid-cols-1 max-w-4xl max-h-[75vh]' :
              peers.length === 1 ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl' :
              peers.length <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-6xl' :
              peers.length <= 5 ? 'grid-cols-2 sm:grid-cols-3 max-w-6xl' :
              'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-w-7xl'
            }`}>
              {/* Local Participant Tile */}
              <div className="relative w-full h-full min-h-[160px] aspect-video bg-[#1a1a20] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/80 shadow-lg group flex items-center justify-center">
                {localVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl border-2 border-purple-400/30">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                )}

                {/* Active speaker border highlight */}
                {localAudioEnabled && micVolume > 15 && (
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 border-emerald-400 pointer-events-none animate-pulse" />
                )}

                {/* Bottom Tag */}
                <div className="absolute bottom-3 left-3 flex items-center space-x-2 px-2.5 py-1 bg-slate-950/70 backdrop-blur-md rounded-lg text-xs font-semibold text-white">
                  <span>{user?.name} (You)</span>
                  {isHost && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      Host
                    </span>
                  )}
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                  {isHandRaised && (
                    <div className="p-1.5 bg-amber-500 text-slate-950 rounded-full shadow-lg" title="Hand Raised">
                      <Hand className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                  {!localAudioEnabled && (
                    <div className="p-1.5 bg-rose-600/90 text-white rounded-full shadow-lg" title="Microphone Muted">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Peers Tiles */}
              {peers.map(peer => (
                <PeerVideoTile 
                  key={peer.socketId} 
                  peer={peer} 
                  isHandRaised={raisedHands.some(h => h.socketId === peer.socketId)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Right Drawer (Chat, Participants, Meeting Info) */}
        {activeDrawer && (
          <aside className="fixed sm:absolute inset-y-0 right-0 w-full sm:w-80 bg-[#1e1e24] border-l border-slate-800 z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-sm text-white flex items-center space-x-2">
                {activeDrawer === 'chat' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>In-Call Messages</span>
                  </>
                )}
                {activeDrawer === 'participants' && (
                  <>
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>People ({peers.length + 1})</span>
                  </>
                )}
                {activeDrawer === 'info' && (
                  <>
                    <Info className="w-4 h-4 text-sky-400" />
                    <span>Meeting Info</span>
                  </>
                )}
              </h2>
              <button 
                onClick={() => setActiveDrawer(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* CHAT DRAWER */}
              {activeDrawer === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-4">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <p>Messages can only be seen by people in the call and are deleted when the call ends.</p>
                      </div>
                    ) : (
                      chatMessages.map(msg => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-0.5">
                              <span className="font-semibold text-slate-300">{msg.senderName}</span>
                              <span className="px-1 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400">
                                {msg.senderRole}
                              </span>
                            </div>
                            <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                              isMe 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs' 
                                : 'bg-slate-800 text-slate-200 rounded-bl-xs'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="pt-3 mt-auto flex items-center space-x-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Send a message to everyone..."
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* PARTICIPANTS DRAWER */}
              {activeDrawer === 'participants' && (
                <div className="space-y-4">
                  {/* Host Quick Controls */}
                  {isHost && peers.length > 0 && (
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                      <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                        Host Moderation
                      </span>
                      <button
                        onClick={() => performHostAction('mute-all')}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-rose-300 flex items-center justify-center space-x-2 transition-colors"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Mute All Participants</span>
                      </button>
                    </div>
                  )}

                  {/* List of Participants */}
                  <div className="space-y-2">
                    {/* Self */}
                    <div className="p-2.5 bg-slate-800/40 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                          {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>{user?.name} (You)</span>
                            {isHost && <Crown className="w-3 h-3 text-amber-400" />}
                          </p>
                          <p className="text-[10px] text-slate-400">{user?.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400">
                        {localAudioEnabled ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    </div>

                    {/* Remote Peers */}
                    {peers.map(peer => (
                      <div key={peer.socketId} className="p-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                            {peer.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                              <span>{peer.userName}</span>
                              {peer.isHost && <Crown className="w-3 h-3 text-amber-400" />}
                            </p>
                            <p className="text-[10px] text-slate-400">{peer.userRole}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {peer.audioEnabled ? (
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <MicOff className="w-3.5 h-3.5 text-rose-400" />
                          )}

                          {isHost && (
                            <button
                              onClick={() => performHostAction('mute-user', peer.socketId)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-300"
                              title="Mute this user"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isHost && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove ${peer.userName} from this meeting?`)) {
                                  performHostAction('remove-user', peer.socketId);
                                }
                              }}
                              className="p-1 hover:bg-rose-950 rounded text-slate-400 hover:text-rose-400"
                              title="Remove from meeting"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MEETING INFO DRAWER */}
              {activeDrawer === 'info' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                      Joining Information
                    </span>
                    <div>
                      <p className="text-xs text-slate-400">Meeting Link</p>
                      <div className="flex items-center justify-between mt-1 p-2 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-[11px] font-mono text-indigo-300 truncate mr-2">
                          {window.location.href}
                        </span>
                        <button
                          onClick={() => copyToClipboard(window.location.href, 'link')}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-[10px] font-bold text-white flex items-center space-x-1 shrink-0"
                        >
                          {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Meeting Code</p>
                      <p className="font-mono font-bold text-white text-sm mt-0.5">{meeting?.code}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Host</p>
                      <p className="font-semibold text-white text-xs mt-0.5">{meeting?.host_name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Target Audience</p>
                      <p className="font-semibold text-purple-300 text-xs mt-0.5">{meeting?.audience_type}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Floating Bottom Controls Dock (Google Meet Classic) */}
      <footer className="h-20 bg-[#1b1b20] border-t border-slate-800/80 px-4 sm:px-8 flex items-center justify-between z-20 shrink-0">
        {/* Left Side Info */}
        <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400">
          <span className="font-semibold text-white truncate max-w-xs">{meeting?.title}</span>
        </div>

        {/* Center Main Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 mx-auto">
          {/* Microphone Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-full transition-all duration-200 shadow-lg ${
              localAudioEnabled 
                ? 'bg-slate-800 text-white hover:bg-slate-700' 
                : 'bg-rose-600 text-white hover:bg-rose-500 ring-2 ring-rose-400/50'
            }`}
            title={localAudioEnabled ? 'Turn off microphone' : 'Turn on microphone'}
          >
            {localAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-all duration-200 shadow-lg ${
              localVideoEnabled 
                ? 'bg-slate-800 text-white hover:bg-slate-700' 
                : 'bg-rose-600 text-white hover:bg-rose-500 ring-2 ring-rose-400/50'
            }`}
            title={localVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {localVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-all duration-200 shadow-lg ${
              isScreenSharing 
                ? 'bg-purple-600 text-white hover:bg-purple-500 ring-2 ring-purple-400/50' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isScreenSharing ? 'Stop presenting' : 'Present screen'}
          >
            {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          </button>

          {/* Raise Hand Toggle */}
          <button
            onClick={toggleRaiseHand}
            className={`p-3.5 rounded-full transition-all duration-200 shadow-lg ${
              isHandRaised 
                ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 ring-2 ring-amber-300' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand className={`w-5 h-5 ${isHandRaised ? 'fill-current' : ''}`} />
          </button>

          {/* End Call / Leave Button (Google Meet Red) */}
          <button
            onClick={() => isHost ? setShowEndModal(true) : handleLeaveCall()}
            className="px-5 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-950/50 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5 fill-current" />
            <span className="hidden sm:inline text-xs font-bold">Leave</span>
          </button>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center space-x-2">
          {/* Meeting Info */}
          <button
            onClick={() => setActiveDrawer(prev => prev === 'info' ? null : 'info')}
            className={`p-3 rounded-full transition-colors ${
              activeDrawer === 'info' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Meeting details"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* People / Participants */}
          <button
            onClick={() => setActiveDrawer(prev => prev === 'participants' ? null : 'participants')}
            className={`p-3 rounded-full relative transition-colors ${
              activeDrawer === 'participants' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Show participants"
          >
            <Users className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-700 text-[9px] font-bold text-white flex items-center justify-center">
              {peers.length + 1}
            </span>
          </button>

          {/* In-Call Chat */}
          <button
            onClick={() => setActiveDrawer(prev => prev === 'chat' ? null : 'chat')}
            className={`p-3 rounded-full relative transition-colors ${
              activeDrawer === 'chat' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Chat with everyone"
          >
            <MessageSquare className="w-5 h-5" />
            {chatMessages.length > 0 && activeDrawer !== 'chat' && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            )}
          </button>
        </div>
      </footer>

      {/* Host End Meeting Confirmation Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#1e1e24] border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Leave or End Meeting?</h3>
            <p className="text-xs text-slate-400">
              As the meeting host, you can choose to leave the call and let participants continue, or end the meeting for everyone.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleEndMeetingForAll}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                End Meeting for Everyone
              </button>
              <button
                onClick={handleLeaveCall}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Just Leave Call
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                className="w-full py-2 px-4 text-slate-500 hover:text-slate-400 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: PEER VIDEO TILE
// ==========================================
const PeerVideoTile: React.FC<{
  peer: RemotePeer;
  isCompact?: boolean;
  isHandRaised?: boolean;
}> = ({ peer, isCompact, isHandRaised }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (peer.stream && videoRef.current) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className={`relative w-full h-full min-h-[140px] aspect-video bg-[#1a1a20] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800/80 shadow-lg flex items-center justify-center ${
      isCompact ? 'min-h-0 aspect-video rounded-xl' : ''
    }`}>
      {peer.videoEnabled && peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl border-2 border-indigo-400/30">
            {peer.userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Bottom Name Tag */}
      <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 bg-slate-950/70 backdrop-blur-md rounded-lg text-xs font-semibold text-white">
        <span className="truncate max-w-[120px]">{peer.userName}</span>
        {peer.isHost && (
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
            Host
          </span>
        )}
      </div>

      {/* Status Badges */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5">
        {isHandRaised && (
          <div className="p-1.5 bg-amber-500 text-slate-950 rounded-full shadow-lg" title="Hand Raised">
            <Hand className="w-3.5 h-3.5 fill-current" />
          </div>
        )}
        {!peer.audioEnabled && (
          <div className="p-1.5 bg-rose-600/90 text-white rounded-full shadow-lg" title="Microphone Muted">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRoom;
