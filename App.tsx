import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  bg: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  primary: '#111827',
  card: '#f3f4f6',
  border: '#e5e7eb',
};

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerWrap}>
          <View style={styles.avatar}>
            <Ionicons name="medkit-outline" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bienvenue Dr. Castillon</Text>
            <Text style={styles.subtitle}>
              Gérez vos consultations et suivez vos patients en toute simplicité
            </Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCardPrimary,
                pressed && styles.pressed,
              ]}
              android_ripple={{ color: '#00000010' }}
            >
              <Ionicons name="add" size={32} color="#fff" />
              <Text style={styles.actionPrimaryText}>Nouveau bilan</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCardSecondary,
                pressed && styles.pressed,
              ]}
              android_ripple={{ color: '#00000010' }}
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
            <Pressable hitSlop={8}>
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
    </SafeAreaView>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  android: { elevation: 2 },
});

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

  patientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

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
});