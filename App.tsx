import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import RecorderModal from './src/components/RecorderModal';

// ---------- CONFIG API ----------
const API_BASE = 'http://192.168.1.158:8000'; // ← remplace par l’IP/URL de ton API

async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Connexion refusée (${res.status}) ${txt}`);
  }
  const json = await res.json();
  if (!json?.token) throw new Error('Token absent dans la réponse');
  return json.token as string;
}

// ---------- AUTH CONTEXT ----------
type AuthContextType = {
  token: string | null;
  restoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextType>({
  token: null,
  restoring: true,
  login: async () => {},
  logout: async () => {},
});

const TOKEN_KEY = 'vetagent_jwt';
async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}
async function loadToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}
async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await loadToken();
        setToken(t);
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      token,
      restoring,
      login: async (email: string, password: string) => {
        const t = await apiLogin(email.trim(), password);
        await saveToken(t);
        setToken(t);
      },
      logout: async () => {
        await clearToken();
        setToken(null);
      },
    }),
    [token, restoring]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------- UI ----------
const colors = {
  bg: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  primary: '#111827',
  card: '#f3f4f6',
  border: '#e5e7eb',
};

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  android: { elevation: 2 },
});

// ---------- LOGIN SCREEN ----------
function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email || !password) return setError('Email et mot de passe requis');
    try {
      setBusy(true);
      await login(email, password);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de connexion');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.loginWrap}>
        <View style={styles.loginCard}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Identifiez-vous pour continuer</Text>

          <View style={{ gap: 10, marginTop: 16 }}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
            <TextInput
              secureTextEntry
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor={colors.muted}
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSubmit}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
            android_ripple={{ color: '#00000010' }}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Se connecter</Text>}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- HOME SCREEN (ton App.tsx actuel) ----------
function HomeScreen() {
  const [recVisible, setRecVisible] = useState(false);
  const { token, logout } = useContext(AuthContext);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.avatar}>
            <Ionicons name="medkit-outline" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>Gérez vos consultations et suivez vos patients</Text>
          </View>
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={{ color: colors.muted }}>Déconnexion</Text>
          </Pressable>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.actionCardPrimary, pressed && styles.pressed]}
              android_ripple={{ color: '#00000010' }}
              onPress={() => setRecVisible(true)}
            >
              <Ionicons name="add" size={32} color="#fff" />
              <Text style={styles.actionPrimaryText}>Nouveau bilan</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionCardSecondary, pressed && styles.pressed]}
              android_ripple={{ color: '#00000010' }}
              onPress={() => Alert.alert('Recherche', 'À brancher')}
            >
              <Ionicons name="search" size={28} color={colors.text} />
              <Text style={styles.actionSecondaryText}>Rechercher</Text>
            </Pressable>
          </View>
        </View>

        {/* Patients récents */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Patients récents</Text>
            <Pressable hitSlop={8} onPress={() => Alert.alert('Voir tout', 'À brancher')}>
              <Text style={styles.link}>Voir tout</Text>
            </Pressable>
          </View>

          {[
            { name: 'Max - Labrador', owner: 'Mme Dubois' },
            { name: 'Luna - Chat persan', owner: 'M. Martin' },
          ].map((p, i) => (
            <View key={i} style={styles.patientCard}>
              <View style={styles.patientLeft}>
                <View style={styles.paw}>
                  <Ionicons name="paw-outline" size={18} color={colors.text} />
                </View>
                <View>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientOwner}>Propriétaire: {p.owner}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal enregistrement vocal */}
      <RecorderModal
        visible={recVisible}
        onClose={() => setRecVisible(false)}
        uploadUrl={`${API_BASE}/api/consultations/audio`} // adapte si ton endpoint nécessite un ID
        authToken={token ?? ''}
        onUploaded={(json) => {
          console.log('Réponse API:', json);
        }}
      />
    </SafeAreaView>
  );
}

// ---------- ROOT ----------
function Root() {
  const { token, restoring } = useContext(AuthContext);
  if (restoring) return null; // petit splash natif suffisant
  return token ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  content: { paddingBottom: 24 },

  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 4 },

  section: { paddingHorizontal: 24, marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  link: { color: colors.muted },

  row: { flexDirection: 'row', gap: 16 },

  actionCardPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingVertical: 22,
    ...(shadow as object),
  },
  actionPrimaryText: { color: '#fff', marginTop: 8, fontWeight: '600' },

  actionCardSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.card,
    paddingVertical: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionSecondaryText: { color: colors.text, marginTop: 8, fontWeight: '600' },

  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...(shadow as object),
  },
  patientLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paw: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  patientName: { fontWeight: '700', color: colors.text },
  patientOwner: { color: colors.muted },

  pressed: { opacity: 0.85 },

  // login
  loginWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.bg,
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...(shadow as object),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
  },
  btnPrimary: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 12 },
});