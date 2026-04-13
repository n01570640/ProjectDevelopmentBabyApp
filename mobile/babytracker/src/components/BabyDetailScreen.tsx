import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { getBaby, updateBaby, getLatestGrowth, recordGrowth } from "../../services/babyService";
import { getBabyProfilePhoto, uploadBabyProfilePhoto } from "../../services/babyProfilePhotoService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { colors } from "../theme/colors";

const { height } = Dimensions.get("window");

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const cmToFt = (cm: number | null) =>
  cm == null ? "N/A" : `${(cm / 30.48).toFixed(2)} ft`;
const kgToLbs = (kg: number | null) =>
  kg == null ? "N/A" : `${(kg * 2.205).toFixed(1)} lbs`;
const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};
const ageFromDob = (dob: string | null | undefined): string => {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0
    ? `${years} yr${years !== 1 ? "s" : ""}`
    : `${years} yr${years !== 1 ? "s" : ""} ${rem} mo`;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type Props = { navigation: any; route: any };

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function BabyDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { babyId } = route.params as { babyId: number };

  const [baby, setBaby] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [growthModalVisible, setGrowthModalVisible] = useState(false);

  // ── Baby profile photo state ─────────────────────────────
  const [babyPhotoUri, setBabyPhotoUri] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Fetch baby + latest growth
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [babyRes, growthRes] = await Promise.all([
        getBaby(babyId),
        getLatestGrowth(babyId),
      ]);
      if (babyRes?.success) setBaby(babyRes.data);
      if (growthRes?.success) setGrowth(growthRes.data);
    } catch (e) {
      console.error("BabyDetail load error:", e);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => { load(); }, [load]);

  // ── Fetch saved baby photo on mount ─────────────────────
  const fetchBabyPhoto = useCallback(async () => {
    try {
      const result = await getBabyProfilePhoto(babyId);
      if (result?.success && result.data?.sas_url) {
        setBabyPhotoUri(result.data.sas_url);
      }
    } catch (e) {
      console.error("BabyDetailScreen: failed to fetch baby profile photo", e);
    }
  }, [babyId]);

  useEffect(() => { fetchBabyPhoto(); }, [fetchBabyPhoto]);

  // ── Pick image and upload ────────────────────────────────
  const handleAvatarPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Photo library access is required to change the baby's profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const imageUri = result.assets[0].uri;
    setBabyPhotoUri(imageUri); // optimistic update
    setPhotoUploading(true);

    try {
      const uploadResult = await uploadBabyProfilePhoto(babyId, imageUri);
      if (uploadResult?.success && uploadResult.data?.sas_url) {
        setBabyPhotoUri(uploadResult.data.sas_url);
      } else {
        Alert.alert("Upload Failed", uploadResult?.message ?? "Could not upload photo. Please try again.");
        fetchBabyPhoto();
      }
    } catch (e: any) {
      Alert.alert("Upload Failed", e?.message ?? "An error occurred uploading the photo.");
      fetchBabyPhoto();
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!baby) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text style={styles.loadingText}>Baby not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMale = baby.sex === "male";
  const accentColor = isMale ? colors.primaryDark : colors.female;
  const accentLight = isMale ? colors.maleLight : colors.femaleLight;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isMale ? ["#c9e8f9", "#e8f4fd"] : ["#fce4ec", "#fdf0f5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={moderateScale(22)} color="#1a3d5c" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {/* Avatar — tap to change photo */}
          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.8}
            style={[styles.avatar, { borderColor: accentColor }]}
          >
            {babyPhotoUri ? (
              <Image
                source={{ uri: babyPhotoUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons
                name={isMale ? "man-outline" : "woman-outline"}
                size={moderateScale(44)}
                color={accentColor}
              />
            )}
            {photoUploading && (
              <View style={styles.avatarUploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            {/* Camera badge */}
            <View style={[styles.avatarCameraBadge, { backgroundColor: accentColor }]}>
              <Ionicons name="camera" size={moderateScale(10)} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.babyName}>{baby.display_name}</Text>
          <Text style={styles.babyAge}>{ageFromDob(baby.date_of_birth)}</Text>
          <View style={[styles.roleBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.roleBadgeText}>
              {baby.access_role === "PRIMARY_CAREGIVER" ? "Primary" : "Secondary"}
            </Text>
          </View>
        </View>
        {/* Edit button — only PRIMARY can edit */}
        {baby.access_role === "PRIMARY_CAREGIVER" && (
          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={moderateScale(22)} color="#1a3d5c" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Basic Info ── */}
        <SectionCard title="Basic Information" icon="information-circle-outline" accentColor={accentColor}>
          <InfoRow icon="calendar-outline" label="Date of Birth" value={fmtDate(baby.date_of_birth)} accentColor={accentColor} />
          <InfoRow icon="fitness-outline" label="Age" value={ageFromDob(baby.date_of_birth)} accentColor={accentColor} />
          <InfoRow
            icon={isMale ? "male-outline" : "female-outline"}
            label="Sex"
            value={baby.sex ? baby.sex.charAt(0).toUpperCase() + baby.sex.slice(1) : "Not specified"}
            accentColor={accentColor}
          />
          <InfoRow icon="water-outline" label="Blood Type" value={baby.blood_type ?? "Not specified"} accentColor={accentColor} />
          <InfoRow icon="person-outline" label="Primary Caregiver" value={baby.primary_caregiver_name ?? "N/A"} accentColor={accentColor} />
          {baby.notes ? (
            <InfoRow icon="document-text-outline" label="Notes" value={baby.notes} accentColor={accentColor} />
          ) : null}
        </SectionCard>

        {/* ── Growth Metrics ── */}
        <SectionCard
          title="Growth Metrics"
          icon="trending-up-outline"
          accentColor={accentColor}
          action={
            baby.can_edit_health ? (
              <TouchableOpacity
                onPress={() => setGrowthModalVisible(true)}
                style={[styles.sectionAction, { backgroundColor: accentColor }]}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.sectionActionText}>Log Growth</Text>
              </TouchableOpacity>
            ) : undefined
          }
        >
          {growth ? (
            <>
              <InfoRow
                icon="barbell-outline"
                label="Weight"
                value={
                  growth.weight_kg != null
                    ? `${growth.weight_kg} kg  ·  ${kgToLbs(growth.weight_kg)}`
                    : "Not recorded"
                }
                accentColor={accentColor}
              />
              <InfoRow
                icon="resize-outline"
                label="Height / Length"
                value={
                  growth.length_cm != null
                    ? `${growth.length_cm} cm  ·  ${cmToFt(growth.length_cm)}`
                    : "Not recorded"
                }
                accentColor={accentColor}
              />
              <InfoRow
                icon="ellipse-outline"
                label="Head Circumference"
                value={
                  growth.head_circum_cm != null
                    ? `${growth.head_circum_cm} cm`
                    : "Not recorded"
                }
                accentColor={accentColor}
              />
              <InfoRow
                icon="time-outline"
                label="Last Recorded"
                value={fmtDate(growth.recorded_at)}
                accentColor={accentColor}
              />
            </>
          ) : (
            <View style={styles.noDataRow}>
              <Ionicons name="analytics-outline" size={32} color="#c0d4e8" />
              <Text style={styles.noDataText}>No growth data yet.</Text>
              {baby.can_edit_health && (
                <Text style={styles.noDataSub}>Tap "Log Growth" to record measurements.</Text>
              )}
            </View>
          )}
        </SectionCard>

        {/* ── Account Info ── */}
        <SectionCard title="Access & Permissions" icon="shield-checkmark-outline" accentColor={accentColor}>
          <PermissionRow label="Edit Health Data" granted={baby.can_edit_health} />
          <PermissionRow label="Edit Activities" granted={baby.can_edit_activities} />
          <PermissionRow label="Share / Invite Caregivers" granted={baby.can_share} />
        </SectionCard>

        <View style={{ height: verticalScale(40) }} />
      </ScrollView>

      {/* Edit Baby Modal */}
      <EditBabyModal
        visible={editModalVisible}
        baby={baby}
        accentColor={accentColor}
        onClose={() => setEditModalVisible(false)}
        onSaved={async (updated: any) => {
          setEditModalVisible(false);
          await load();
        }}
      />

      {/* Log Growth Modal */}
      <LogGrowthModal
        visible={growthModalVisible}
        babyId={babyId}
        accentColor={accentColor}
        onClose={() => setGrowthModalVisible(false)}
        onSaved={async () => {
          setGrowthModalVisible(false);
          await load();
        }}
      />
    </View>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  accentColor,
  children,
  action,
}: {
  title: string;
  icon: string;
  accentColor: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: accentColor + "22" }]}>
          <Ionicons name={icon as any} size={moderateScale(18)} color={accentColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
        {action && <View style={styles.sectionActionWrap}>{action}</View>}
      </View>
      {children}
    </View>
  );
}

// ─── INFO ROW ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: string;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: accentColor + "15" }]}>
        <Ionicons name={icon as any} size={moderateScale(15)} color={accentColor} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── PERMISSION ROW ───────────────────────────────────────────────────────────
function PermissionRow({ label, granted }: { label: string; granted: boolean }) {
  return (
    <View style={styles.permRow}>
      <Ionicons
        name={granted ? "checkmark-circle" : "close-circle"}
        size={moderateScale(20)}
        color={granted ? "#4CAF50" : "#aaa"}
      />
      <Text style={[styles.permLabel, { color: granted ? "#2d4150" : "#aaa" }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── EDIT BABY MODAL ──────────────────────────────────────────────────────────
function EditBabyModal({
  visible,
  baby,
  accentColor,
  onClose,
  onSaved,
}: {
  visible: boolean;
  baby: any;
  accentColor: string;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const [name, setName] = useState(baby?.display_name ?? "");
  const [dob, setDob] = useState(baby?.date_of_birth?.slice(0, 10) ?? "");
  const [sex, setSex] = useState<string | null>(baby?.sex ?? null);
  const [bloodType, setBloodType] = useState<string | null>(baby?.blood_type ?? null);
  const [notes, setNotes] = useState(baby?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Reset when baby changes
  useEffect(() => {
    setName(baby?.display_name ?? "");
    setDob(baby?.date_of_birth?.slice(0, 10) ?? "");
    setSex(baby?.sex ?? null);
    setBloodType(baby?.blood_type ?? null);
    setNotes(baby?.notes ?? "");
    setFeedback(null);
  }, [baby, visible]);

  const handleDobChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    let f = digits;
    if (digits.length >= 5) f = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    else if (digits.length >= 3) f = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    setDob(f.slice(0, 10));
  };

  const handleSave = async () => {
    setFeedback(null);
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Name is required." });
      return;
    }
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setFeedback({ type: "error", message: "Date must be YYYY-MM-DD." });
      return;
    }
    setSaving(true);
    try {
      const res = await updateBaby(baby.baby_id, {
        display_name: name.trim(),
        date_of_birth: dob || undefined,
        sex: sex ?? undefined,
        blood_type: bloodType ?? undefined,
        notes: notes.trim() || undefined,
      });
      if (res?.success || res?.data) {
        onSaved(res?.data ?? res);
      } else {
        setFeedback({ type: "error", message: res?.message ?? "Update failed." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message ?? "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={[styles.modalHeaderRow, { borderBottomColor: accentColor }]}>
            <Ionicons name="create-outline" size={22} color={accentColor} />
            <Text style={[styles.modalTitle, { color: accentColor }]}>  Edit Baby Info</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {feedback && (
              <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
                <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
                  {feedback.message}
                </Text>
              </View>
            )}
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name <Text style={styles.required}>*</Text></Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Baby's name"
                autoCapitalize="words"
              />
            </View>

            {/* DOB */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput
                value={dob}
                onChangeText={handleDobChange}
                style={styles.input}
                placeholder="e.g. 2024-10-14"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* Sex */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sex</Text>
              <View style={styles.chipRow}>
                {(["male", "female"] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSex(sex === s ? null : s)}
                    style={[
                      styles.chip,
                      sex === s && { backgroundColor: accentColor, borderColor: accentColor },
                    ]}
                  >
                    <Ionicons
                      name={s === "male" ? "male-outline" : "female-outline"}
                      size={13}
                      color={sex === s ? "#fff" : accentColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, { color: sex === s ? "#fff" : accentColor }]}>
                      {s === "male" ? "Male" : "Female"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Blood type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Blood Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {BLOOD_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      onPress={() => setBloodType(bloodType === bt ? null : bt)}
                      style={[
                        styles.chip,
                        bloodType === bt && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: bloodType === bt ? "#fff" : accentColor }]}>
                        {bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.inputMultiline]}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>  Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── LOG GROWTH MODAL ─────────────────────────────────────────────────────────
function LogGrowthModal({
  visible,
  babyId,
  accentColor,
  onClose,
  onSaved,
}: {
  visible: boolean;
  babyId: number;
  accentColor: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [weightKg, setWeightKg] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [headCm, setHeadCm] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (visible) {
      setWeightKg(""); setLengthCm(""); setHeadCm(""); setNotes("");
      setFeedback(null);
    }
  }, [visible]);

  const handleSave = async () => {
    setFeedback(null);
    if (!weightKg && !lengthCm && !headCm) {
      setFeedback({ type: "error", message: "Please enter at least one measurement." });
      return;
    }
    setSaving(true);
    try {
      const res = await recordGrowth(babyId, {
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        length_cm: lengthCm ? parseFloat(lengthCm) : undefined,
        head_circum_cm: headCm ? parseFloat(headCm) : undefined,
        notes: notes.trim() || undefined,
      });
      if (res?.success || res?.data) {
        onSaved();
      } else {
        setFeedback({ type: "error", message: res?.message ?? "Failed to log growth." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message ?? "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={[styles.modalHeaderRow, { borderBottomColor: accentColor }]}>
            <Ionicons name="trending-up-outline" size={22} color={accentColor} />
            <Text style={[styles.modalTitle, { color: accentColor }]}>  Log Growth</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {feedback && (
              <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
                <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
                  {feedback.message}
                </Text>
              </View>
            )}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Weight (kg)</Text>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                style={styles.input}
                placeholder="e.g. 7.5"
                keyboardType="decimal-pad"
              />
              {weightKg ? (
                <Text style={[styles.convertHint, { color: accentColor }]}>
                  ≈ {kgToLbs(parseFloat(weightKg) || null)}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Height / Length (cm)</Text>
              <TextInput
                value={lengthCm}
                onChangeText={setLengthCm}
                style={styles.input}
                placeholder="e.g. 68.5"
                keyboardType="decimal-pad"
              />
              {lengthCm ? (
                <Text style={[styles.convertHint, { color: accentColor }]}>
                  ≈ {cmToFt(parseFloat(lengthCm) || null)}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Head Circumference (cm)</Text>
              <TextInput
                value={headCm}
                onChangeText={setHeadCm}
                style={styles.input}
                placeholder="e.g. 42.0"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.inputMultiline]}
                placeholder="Any notes..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>  Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: moderateScale(15), color: "#aaa" },
  backFallback: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primaryDark,
    borderRadius: 20,
  },
  backFallbackText: { color: "#fff", fontWeight: "700" },

  // Header
  header: {
    paddingBottom: verticalScale(20),
    paddingHorizontal: scale(20),
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? verticalScale(40) : verticalScale(54),
    left: scale(16),
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  editBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? verticalScale(40) : verticalScale(54),
    right: scale(16),
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  headerCenter: { alignItems: "center", marginTop: verticalScale(8) },
  avatar: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: moderateScale(45),
  },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(45),
  },
  avatarCameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  babyName: {
    fontSize: moderateScale(24),
    fontWeight: "800",
    color: "#1a3d5c",
    marginBottom: verticalScale(2),
  },
  babyAge: {
    fontSize: moderateScale(14),
    color: "#5a82a8",
    fontWeight: "500",
    marginBottom: verticalScale(8),
  },
  roleBadge: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(4),
    borderRadius: 20,
  },
  roleBadgeText: { color: "#fff", fontSize: moderateScale(12), fontWeight: "700" },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: scale(16), paddingTop: verticalScale(16) },

  // Section card
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: scale(16),
    marginBottom: verticalScale(14),
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  sectionIconWrap: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    flex: 1,
  },
  sectionActionWrap: { marginLeft: "auto" },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: 14,
    gap: 3,
  },
  sectionActionText: { color: "#fff", fontSize: moderateScale(11), fontWeight: "700" },

  // Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(10),
  },
  infoIconWrap: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
    marginTop: 1,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: moderateScale(11), color: "#8fa8c0", fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: moderateScale(14), color: "#2d4150", fontWeight: "500" },

  // Permission row
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
    gap: scale(8),
  },
  permLabel: { fontSize: moderateScale(14), fontWeight: "500" },

  // No data
  noDataRow: {
    alignItems: "center",
    paddingVertical: verticalScale(16),
    gap: 6,
  },
  noDataText: { fontSize: moderateScale(14), color: "#aec6de", fontWeight: "600" },
  noDataSub: { fontSize: moderateScale(12), color: "#c8dae8", textAlign: "center" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(32),
    maxHeight: height * 0.88,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    paddingBottom: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  modalTitle: { flex: 1, fontSize: moderateScale(18), fontWeight: "800" },
  modalCloseBtn: { padding: 4 },

  // Fields
  fieldGroup: { marginBottom: verticalScale(14) },
  fieldLabel: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#2d4150",
    marginBottom: verticalScale(6),
  },
  required: { color: "#e05353" },
  input: {
    borderWidth: 1.5,
    borderColor: "#d8e4f0",
    borderRadius: 12,
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(11),
    fontSize: moderateScale(14),
    color: "#2d4150",
    backgroundColor: "#f7f9fc",
  },
  inputMultiline: { height: verticalScale(90), textAlignVertical: "top" },
  convertHint: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 4,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#c0d4e8",
    borderRadius: 20,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: "#f0f6fc",
  },
  chipText: { fontSize: moderateScale(12), fontWeight: "600" },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
    marginTop: verticalScale(16),
  },
  cancelBtn: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(11),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#c0d4e8",
  },
  cancelBtnText: { color: "#6d8eb0", fontWeight: "600", fontSize: moderateScale(14) },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(11),
    borderRadius: 12,
    minWidth: scale(110),
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: moderateScale(14) },

  // Feedback banners
  feedbackSuccess: {
    backgroundColor: colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.successBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  feedbackSuccessText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.successDark,
  },
  feedbackError: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.errorBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  feedbackErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.errorDark,
  },
});

