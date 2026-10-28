import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Room, RoomEvent, Track } from 'livekit-client';
import { app, db } from '../../firebase.js';
import '../../styles/memberLiveKit.css';

const functions = getFunctions(app);

function ParticipantTile({ participant, local = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const camera = participant.getTrackPublication(Track.Source.Camera)?.track;
  const microphone = participant.getTrackPublication(Track.Source.Microphone)?.track;

  useEffect(() => {
    const element = videoRef.current;
    if (!camera || !element) return;
    camera.attach(element);
    return () => camera.detach(element);
  }, [camera]);

  useEffect(() => {
    const element = audioRef.current;
    if (!microphone || !element || local) return;
    microphone.attach(element);
    return () => microphone.detach(element);
  }, [microphone, local]);

  const displayName = participant.name || participant.identity || 'Member';
  return (
    <div className="member-livekit-tile">
      {camera ? <video ref={videoRef} autoPlay playsInline muted={local} /> : <div className="member-livekit-avatar">{displayName.slice(0, 1).toUpperCase()}</div>}
      <span className="member-livekit-name">{displayName}{local ? ' · Host' : ''}</span>
      {!local && <audio ref={audioRef} autoPlay />}
    </div>
  );
}

function LiveKitStage({ stream, user, isHost, onEnd }) {
  const [participants, setParticipants] = useState([]);
  const [room, setRoom] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);

  const refreshParticipants = useCallback((activeRoom) => {
    setParticipants([activeRoom.localParticipant, ...activeRoom.remoteParticipants.values()]);
  }, []);

  useEffect(() => {
    let active = true;
    let activeRoom;
    const join = async () => {
      try {
        const getToken = httpsCallable(functions, 'getLiveStreamToken');
        const { data } = await getToken({ streamId: stream.id });
        if (!active) return;
        activeRoom = new Room({ adaptiveStream: true, dynacast: true });
        const refresh = () => active && refreshParticipants(activeRoom);
        activeRoom.on(RoomEvent.ParticipantConnected, refresh);
        activeRoom.on(RoomEvent.ParticipantDisconnected, refresh);
        activeRoom.on(RoomEvent.TrackSubscribed, refresh);
        activeRoom.on(RoomEvent.TrackUnsubscribed, refresh);
        activeRoom.on(RoomEvent.LocalTrackPublished, refresh);
        activeRoom.on(RoomEvent.LocalTrackUnpublished, refresh);
        await activeRoom.connect(data.serverUrl, data.participantToken);
        if (!active) { activeRoom.disconnect(); return; }
        setRoom(activeRoom);
        refreshParticipants(activeRoom);
        if (isHost) {
          try {
            await activeRoom.localParticipant.setCameraEnabled(true);
            setCameraOn(true);
            await activeRoom.localParticipant.setMicrophoneEnabled(true);
            setMicOn(true);
          } catch {
            setError('Room connected. Allow camera and microphone access in your browser to broadcast.');
          }
        }
      } catch (joinError) {
        if (active) setError(joinError?.message || 'Could not join the LiveKit room.');
      } finally {
        if (active) setConnecting(false);
      }
    };
    join();
    return () => {
      active = false;
      activeRoom?.disconnect();
    };
  }, [stream.id, isHost, refreshParticipants]);

  const toggleCamera = async () => {
    if (!room) return;
    try { await room.localParticipant.setCameraEnabled(!cameraOn); setCameraOn((value) => !value); setError(''); }
    catch { setError('Camera permission was blocked. Allow camera access in your browser and try again.'); }
  };
  const toggleMic = async () => {
    if (!room) return;
    try { await room.localParticipant.setMicrophoneEnabled(!micOn); setMicOn((value) => !value); setError(''); }
    catch { setError('Microphone permission was blocked. Allow microphone access in your browser and try again.'); }
  };

  return (
    <div className="member-livekit-stage-wrap">
      <div className="member-livekit-stage">
        {participants.length ? participants.map((participant) => <ParticipantTile key={participant.identity} participant={participant} local={participant === room?.localParticipant} />) : (
          <div className="member-livekit-waiting"><span className="member-livekit-live-pill">● LIVE</span><strong>{connecting ? 'Connecting to live room…' : 'Waiting for the host video…'}</strong><small>Keep this page open while the host connects.</small></div>
        )}
      </div>
      <div className="member-livekit-controls">
        <span>{connecting ? 'Connecting…' : `${participants.length} participant${participants.length === 1 ? '' : 's'}`}</span>
        {isHost && <div><button type="button" onClick={toggleMic}>{micOn ? 'Mute mic' : 'Turn mic on'}</button><button type="button" onClick={toggleCamera}>{cameraOn ? 'Turn camera off' : 'Turn camera on'}</button><button className="member-livekit-end" type="button" onClick={onEnd}>End stream</button></div>}
      </div>
      {error && <p className="member-livekit-error" role="status">{error}</p>}
    </div>
  );
}

export default function MemberLiveRoom({ user, isAdmin }) {
  const [streams, setStreams] = useState([]);
  const [title, setTitle] = useState('Live Trading Session');
  const [selectedStream, setSelectedStream] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'liveStreams'), where('status', '==', 'live')), (snapshot) => {
    const currentStreams = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    currentStreams.sort((a, b) => (b.startedAt?.toMillis?.() || 0) - (a.startedAt?.toMillis?.() || 0));
    setStreams(currentStreams);
    setSelectedStream((current) => currentStreams.find((item) => item.id === current?.id) || currentStreams[0] || null);
  }, (snapshotError) => setError(snapshotError.message)), []);

  const startStream = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const start = httpsCallable(functions, 'startLiveStream');
      const { data } = await start({ title });
      setSelectedStream({ id: data.streamId, title, hostUid: user.uid, status: 'live' });
    } catch (startError) { setError(startError?.message || 'Could not start the live stream.'); }
    finally { setBusy(false); }
  };

  const endStream = async () => {
    if (!selectedStream) return;
    setBusy(true); setError('');
    try {
      const end = httpsCallable(functions, 'endLiveStream');
      await end({ streamId: selectedStream.id });
      setSelectedStream(null);
    } catch (endError) { setError(endError?.message || 'Could not end the live stream.'); }
    finally { setBusy(false); }
  };

  const isHost = selectedStream?.hostUid === user?.uid && isAdmin;
  return (
    <section className="member-room-page" aria-labelledby="member-room-heading">
      <div className="member-room-heading">
        <div><span className="member-room-eyebrow">COMMUNITY BROADCAST</span><h1 id="member-room-heading">Live Room</h1><p>Watch real sessions, follow the analysis, and learn alongside the community.</p></div>
        <span className={`member-room-status${selectedStream ? ' is-live' : ''}`}><i />{selectedStream ? 'Live now' : 'Offline'}</span>
      </div>
      {isAdmin && !selectedStream && <form className="member-livekit-host-form" onSubmit={startStream}><label htmlFor="member-live-title">Start a live session</label><div><input id="member-live-title" value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder="Session title"/><button type="submit" disabled={busy || !title.trim()}>{busy ? 'Starting…' : 'Start live stream'}</button></div><small>Starting opens your camera and microphone so approved members can join.</small></form>}
      <div className="member-room-tabs">{[['live','Live'],['upcoming','Upcoming'],['past','Past']].map(([key,label]) => <button type="button" key={key} className={key === 'live' ? 'active' : ''}>{label}</button>)}</div>
      <div className="member-room-grid">
        <div className="member-room-player">
          {selectedStream ? <><div className="member-livekit-stream-title"><span className="member-livekit-live-pill">● LIVE</span><strong>{selectedStream.title}</strong>{!isHost && <button type="button" onClick={() => setSelectedStream(null)}>Leave room</button>}</div><LiveKitStage key={selectedStream.id} stream={selectedStream} user={user} isHost={isHost} onEnd={endStream}/></> : <div className="member-room-player-mark"><span>▶</span><strong>No stream is live</strong><p>When a host starts a broadcast, the player and live chat will appear here.</p></div>}
        </div>
        <aside className="member-room-chat"><div className="member-chat-tabs"><button className="active" type="button">Live Chat</button><button type="button">Moderators</button></div><div className="member-room-chat-empty">{selectedStream ? 'LiveKit video is connected. Live chat is not connected yet.' : 'Chat will open when a host starts a live session.'}</div><input aria-label="Chat message" disabled placeholder={selectedStream ? 'Chat not connected' : 'Chat is offline'} /></aside>
      </div>
      <section className="member-room-schedule"><div><h2>Upcoming sessions</h2><p>{streams.length ? `${streams.length} session${streams.length === 1 ? '' : 's'} live now.` : 'No sessions have been scheduled yet.'}</p></div><span>Times shown in your local timezone</span></section>
      {error && <p className="member-livekit-error" role="alert">{error}</p>}
    </section>
  );
}
