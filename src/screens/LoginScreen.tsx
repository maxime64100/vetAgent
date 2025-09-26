import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { AuthContext } from '../auth/AuthContext';

const colors = {
  bg: '#ffffff', text: '#111827', muted: '#6b7280', primary: '#111827',
  card: '#f3f4f6', border: '#e5e7eb', danger: '#dc2626'
};

export default function LoginScreen() {
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
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de connexion');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
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

        <Pressable onPress={onSubmit} style={({pressed}) => [styles.btn, pressed && {opacity:0.85}]} android_ripple={{color:'#00000010'}}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Se connecter</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const shadow = Platform.select({
  ios: { shadowColor:'#000', shadowOpacity:0.08, shadowOffset:{width:0,height:8}, shadowRadius:12 },
  android: { elevation: 2 }
});

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: colors.bg, alignItems:'center', justifyContent:'center', padding:24 },
  card: { width:'100%', maxWidth:420, backgroundColor: colors.bg, borderRadius:16, padding:20, borderWidth:StyleSheet.hairlineWidth, borderColor: colors.border, ...(shadow as object) },
  title: { fontSize:24, fontWeight:'700', color: colors.text },
  subtitle: { color: colors.muted, marginTop:4 },
  input: { borderWidth:1, borderColor: colors.border, borderRadius:12, paddingHorizontal:12, paddingVertical:12, color: colors.text },
  btn: { marginTop:16, backgroundColor: colors.primary, borderRadius:12, paddingVertical:14, alignItems:'center', justifyContent:'center' },
  btnText: { color:'#fff', fontWeight:'700' },
  error: { color: colors.danger, marginTop:12 }
});