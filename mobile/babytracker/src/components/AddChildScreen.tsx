import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { createBaby } from "../../services/babyService";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { colors } from "../theme/colors";

type Props = {
  navigation: any;
};

type SexOption = "male" | "female" | null;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AddChildScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState<SexOption>(null);
  const [bloodType, setBloodType] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Format DOB input as YYYY-MM-DD automatically
  const handleDobChange = (text: string) => {
    // Strip non-digits
    const digits = text.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length >= 5) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    } else if (digits.length >= 3) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    setDateOfBirth(formatted.slice(0, 10));
  };

  const validate = (): boolean => {
    if (!displayName.trim()) {
      Alert.alert("Validation", "Please enter the baby's name.");
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert("Validation", "Please enter a valid date (YYYY-MM-DD).");
      return false;
    }
    const parsed = new Date(dateOfBirth);
    if (isNaN(parsed.getTime()) || parsed > new Date()) {
      Alert.alert("Validation", "Date of birth cannot be in the future.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const response = await createBaby({
        display_name: displayName.trim(),
        date_of_birth: dateOfBirth,
        sex: sex ?? undefined,
        blood_type: bloodType ?? undefined,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        Alert.alert(
          "Success 🎉",
          `${displayName.trim()} has been added!`,
          [
            {
              text: "OK",
              onPress: () => {
                // Go back — Children screen will re-fetch on focus
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response.message || "Failed to add baby.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#c9e8f9", "#e8f4fd"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={moderateScale(24)} color="#1a3d5c" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Baby</Text>
        <View style={{ width: moderateScale(40) }} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar placeholder */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person-add-outline" size={moderateScale(48)} color={colors.primary} />
          </View>
          <Text style={styles.avatarHint}>Fill in the details below</Text>
        </View>

        {/* ── Name ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Baby's Name *</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g. Emma Johnson"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* ── Date of Birth ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
          <TextInput
            value={dateOfBirth}
            onChangeText={handleDobChange}
            placeholder="e.g. 2024-10-14"
            style={styles.input}
            keyboardType="numeric"
            maxLength={10}
            returnKeyType="next"
          />
        </View>

        {/* ── Sex ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Sex</Text>
          <View style={styles.chipRow}>
            {(["male", "female"] as SexOption[]).map((s) => (
              <TouchableOpacity
                key={s as string}
                onPress={() => setSex(sex === s ? null : s)}
                style={[
                  styles.chip,
                  sex === s && styles.chipActive,
                ]}
              >
                <Ionicons
                  name={s === "male" ? "male-outline" : "female-outline"}
                  size={moderateScale(16)}
                  color={sex === s ? "#fff" : colors.primaryDark}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                  {s === "male" ? "Male" : "Female"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Blood Type ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Blood Type (optional)</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRowH}
          >
            {BLOOD_TYPES.map((bt) => (
              <TouchableOpacity
                key={bt}
                onPress={() => setBloodType(bloodType === bt ? null : bt)}
                style={[
                  styles.chip,
                  bloodType === bt && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    bloodType === bt && styles.chipTextActive,
                  ]}
                >
                  {bt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Notes ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            style={[styles.input, styles.inputMultiline]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
          style={styles.saveBtn}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={moderateScale(20)} color="#fff" />
              <Text style={styles.saveBtnText}>Add Baby</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: verticalScale(40) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },

  // Header
  header: {
    paddingTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(54),
    paddingBottom: verticalScale(16),
    paddingHorizontal: scale(20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    color: "#1a3d5c",
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
  },

  // Avatar placeholder
  avatarWrap: {
    alignItems: "center",
    marginBottom: verticalScale(28),
  },
  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    backgroundColor: "#eaf3fb",
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
  },
  avatarHint: {
    fontSize: moderateScale(14),
    color: "#7a9bbf",
    fontWeight: "500",
  },

  // Fields
  fieldGroup: { marginBottom: verticalScale(18) },
  label: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#2d4150",
    marginBottom: verticalScale(7),
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#d8e4f0",
    borderRadius: 12,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(15),
    color: "#2d4150",
    backgroundColor: "#fff",
  },
  inputMultiline: {
    height: verticalScale(100),
    textAlignVertical: "top",
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    gap: scale(10),
  },
  chipRowH: {
    flexDirection: "row",
    gap: scale(8),
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 20,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    backgroundColor: "#eaf3fb",
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipText: {
    fontSize: moderateScale(13),
    color: colors.primaryDark,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },

  // Save button
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: verticalScale(15),
    marginTop: verticalScale(10),
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#fff",
  },
});

