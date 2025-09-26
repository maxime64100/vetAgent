import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (uri: string) => void; // callback après stop
  /** URL de l'endpoint d'upload (ex: https://api.vetagent.fr/uploads/audio) */
  uploadUrl?: string;
  /** Token JWT optionnel pour l'Authorization: Bearer */
  authToken?: string;
  /** Callback après upload réussi (réponse JSON du backend) */
  onUploaded?: (response: any) => void;
};

export default function RecorderModal({ visible, onClose, onSaved, uploadUrl, authToken, onUploaded }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!visible && soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, [visible]);

  const formatTime = useCallback((ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const startTimer = () => {
    timer.current && clearInterval(timer.current);
    timer.current = setInterval(async () => {
      const rec = recordingRef.current;
      if (!rec) return;
      const status = await rec.getStatusAsync();
      if (status.isRecording) setDuration(status.durationMillis ?? 0);
    }, 250);
  };

  const stopTimer = () => {
    timer.current && clearInterval(timer.current);
    timer.current = null;
  };

  const startRecording = useCallback(async () => {
    try {
      console.log('[Recorder] Requesting permissions…');
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        console.warn('[Recorder] Microphone permission not granted');
        return;
      }

      console.log('[Recorder] Setting audio mode for recording');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('[Recorder] Preparing recording');
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          bitRateStrategy: Audio.IOSBitRateStrategy.CONSTANT,
        },
        web: {},
      } as any);

      console.log('[Recorder] Starting…');
      await rec.startAsync();

      recordingRef.current = rec;
      setIsRecording(true);
      setDuration(0);
      setUri(null);
      startTimer();
    } catch (e) {
      console.error('[Recorder] startRecording error', e);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) {
      console.warn('[Recorder] No active recording to stop');
      return;
    }
    stopTimer();
    try {
      console.log('[Recorder] Stopping…');
      await rec.stopAndUnloadAsync();
      const u = rec.getURI() || null;
      console.log('[Recorder] Saved at URI:', u);
      setUri(u);
      setIsRecording(false);
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });

      if (u && onSaved) onSaved(u);
    } catch (e) {
      console.error('[Recorder] stopRecording error', e);
    }
  }, [onSaved]);

  const uploadRecording = useCallback(async () => {
    if (!uri || !uploadUrl) return;
    try {
      setIsUploading(true);
      setUploadError(null);

      const filename = `consult-${Date.now()}.m4a`;
      const form = new FormData();
      form.append('file', {
        uri,
        name: filename,
        type: 'audio/m4a',
      } as any);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload failed (${res.status}): ${text}`);
      }

      const json = await res.json().catch(() => ({}));
      console.log('[Recorder] Upload success', json);
      onUploaded?.(json);
    } catch (e: any) {
      console.error('[Recorder] upload error', e);
      setUploadError(e?.message ?? 'Upload error');
    } finally {
      setIsUploading(false);
    }
  }, [uri, uploadUrl, authToken, onUploaded]);

  const playLast = useCallback(async () => {
    if (!uri) return;
    try {
      let sound = soundRef.current;
      if (!sound) {
        const { sound: created } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        sound = created;
        soundRef.current = sound;
      } else {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            return;
          }
          await sound.setPositionAsync(0);
          await sound.playAsync();
        }
      }

      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        setIsPlaying(!!st.isPlaying);
        if ('didJustFinish' in st && st.didJustFinish) {
          setIsPlaying(false);
          soundRef.current?.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.error('[Recorder] playLast error', e);
    }
  }, [uri]);

  const actions = useMemo(() => {
    if (isRecording)
      return (
        <Pressable style={[styles.btn, styles.btnStop]} onPress={stopRecording}>
          <Text style={styles.btnText}>Arrêter</Text>
        </Pressable>
      );
    return (
      <Pressable style={[styles.btn, styles.btnPrimary]} onPress={startRecording}>
        <Text style={styles.btnText}>Enregistrer</Text>
      </Pressable>
    );
  }, [isRecording, startRecording, stopRecording]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Enregistrement vocal</Text>
        <Text style={styles.timer}>{formatTime(duration)}</Text>

        <View style={styles.pill}>
          <View style={[styles.dot, isRecording && styles.dotLive]} />
          <Text style={styles.pillText}>{isRecording ? 'En cours…' : 'Prêt'}</Text>
        </View>

        <View style={{ height: 24 }} />

        <View style={styles.row}>
          {actions}

          <Pressable
            style={[styles.btn, styles.btnGhost, (!uri || isRecording) && { opacity: 0.4 }]}
            disabled={!uri || isRecording}
            onPress={playLast}
          >
            <Text style={styles.btnGhostText}>{isPlaying ? 'Pause' : 'Relire'}</Text>
          </Pressable>

          {uploadUrl ? (
            <Pressable
              style={[
                styles.btn,
                styles.btnPrimary,
                (!uri || isRecording || isUploading) && { opacity: 0.5 },
              ]}
              disabled={!uri || isRecording || isUploading}
              onPress={uploadRecording}
            >
              {isUploading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.btnText}>Envoi…</Text>
                </View>
              ) : (
                <Text style={styles.btnText}>Envoyer</Text>
              )}
            </Pressable>
          ) : null}
        </View>

        {uploadError ? (
          <Text style={{ color: '#ef4444', marginTop: 8 }}>Erreur d’upload : {uploadError}</Text>
        ) : null}

        <Pressable style={styles.link} onPress={onClose}>
          <Text style={styles.linkText}>Fermer</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff', padding: 24, paddingTop: 56 },
  title: { fontSize: 22, fontWeight: '700' },
  timer: { marginTop: 12, fontSize: 36, fontVariant: ['tabular-nums'] as any },
  pill: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillText: { color: '#111827' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9CA3AF' },
  dotLive: { backgroundColor: '#ef4444' },
  row: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#111827' },
  btnStop: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  btnGhostText: { color: '#111827', fontWeight: '600' },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { color: '#6b7280' },
});