import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import {
  getProfilePhoto,
  uploadProfilePhoto,
} from "../../services/profilePhotoService";
import { getMe, updateMe } from "../../services/userService";
import { logoutUser } from "../../services/authService";

export default function ProfileHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [editVisible, setEditVisible] = useState(false);

  // ── Profile photo state ──────────────────────────────────
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Real user data from backend ──────────────────────────
  const [userLoading, setUserLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstLineName: "",
    fullName: "",
    role: "",
    email: "",
    phone: "",
    languages: "",
    address: "",
    caregiverType: "",
    alertType: "All",
    theme: "Default Blue",
    fontScale: "x1.0",
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    languages: "",
    address: "",
    caregiverType: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);

  // ── Fetch real user profile on mount ─────────────────────
  const fetchUserProfile = useCallback(async () => {
    setUserLoading(true);
    try {
      const result = await getMe();
      if (result?.success && result.data) {
        const u = result.data;
        setProfile((prev) => ({
          ...prev,
          firstLineName: u.full_name ?? "",
          fullName: u.full_name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          // languages, address, caregiverType are not in the DB yet — keep as empty
          languages: "",
          address: "",
          caregiverType: "",
        }));
      }
    } catch (e) {
      console.error("[ProfileHomeScreen] fetchUserProfile error:", e);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // ── Fetch saved profile photo on mount ───────────────────
  const fetchSavedPhoto = useCallback(async () => {
    setPhotoLoading(true);
    try {
      const result = await getProfilePhoto();
      if (result?.success && result.data?.sas_url) {
        // Append a cache-busting param so React Native's Image component
        // never serves a stale/expired SAS URL from its internal cache.
        const busted = `${result.data.sas_url}&_cb=${Date.now()}`;
        setProfilePhotoUri(busted);
      } else {
        // No photo saved yet — make sure we clear any previous URI
        setProfilePhotoUri(null);
      }
    } catch (e) {
      console.error("ProfileHomeScreen: failed to fetch profile photo", e);
    } finally {
      setPhotoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPhoto();
  }, [fetchSavedPhoto]);

  // ── Pick image from library and upload ───────────────────
  const handleAvatarPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library access is required to change your profile picture."
      );
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

    // Optimistically show the local image immediately
    setProfilePhotoUri(imageUri);
    setPhotoUploading(true);

    try {
      const uploadResult = await uploadProfilePhoto(imageUri);
      if (uploadResult?.success && uploadResult.data?.sas_url) {
        const busted = `${uploadResult.data.sas_url}&_cb=${Date.now()}`;
        setProfilePhotoUri(busted);
      } else {
        Alert.alert(
          "Upload Failed",
          uploadResult?.message ?? "Could not upload photo. Please try again."
        );
        fetchSavedPhoto();
      }
    } catch (e: any) {
      Alert.alert(
        "Upload Failed",
        e?.message ?? "An error occurred uploading your photo."
      );
      fetchSavedPhoto();
    } finally {
      setPhotoUploading(false);
    }
  };

  const openSubpage = () => {
    navigation.navigate("ProfileScreen");
  };

  const openEditProfile = () => {
    setEditForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      email: profile.email ?? "",
      languages: profile.languages ?? "",
      address: profile.address ?? "",
      caregiverType: profile.caregiverType ?? "",
    });
    setEditVisible(true);
  };

  const saveEditProfile = async () => {
    if (!editForm.fullName.trim()) {
      Alert.alert("Validation", "Full name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    try {
      const result = await updateMe({
        full_name: editForm.fullName.trim(),
        phone: editForm.phone.trim() || null,
      });
      if (result?.success) {
        setProfile((prev) => ({
          ...prev,
          fullName: editForm.fullName.trim(),
          firstLineName: editForm.fullName.trim(),
          phone: editForm.phone.trim(),
          // keep local-only fields as entered
          languages: editForm.languages,
          address: editForm.address,
          caregiverType: editForm.caregiverType,
        }));
        setEditVisible(false);
      } else {
        Alert.alert("Save Failed", result?.message ?? "Could not save profile changes.");
      }
    } catch (e: any) {
      Alert.alert("Save Failed", e?.message ?? "An error occurred saving your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logoutUser();
            navigation.reset({
              index: 0,
              routes: [{ name: "Landing" }],
            });
          },
        },
      ]
    );
  };

  const displayValue = (value?: string) => {
    if (!value || !value.trim()) return "N/A";
    return value;
  };

  const isMissing = (value?: string) => !value || !value.trim();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { paddingTop: insets.top + 18 }]}>
          <View style={styles.heroRow}>
            <TouchableOpacity
              style={styles.avatarOuter}
              onPress={handleAvatarPress}
              activeOpacity={0.85}
              disabled={photoUploading}
            >
              <View style={styles.avatarInner}>
                {photoLoading ? (
                  <ActivityIndicator size="small" color="#6E89A6" />
                ) : profilePhotoUri ? (
                  <Image
                    source={{ uri: profilePhotoUri }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={54} color="#6E89A6" />
                )}
              </View>
              <View style={styles.avatarCameraBadge} pointerEvents="none">
                {photoUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.heroTextWrap}>
              <Text
                style={[
                  styles.heroName,
                  !profile.firstLineName && styles.mutedHeroText,
                ]}
              >
                {profile.firstLineName || "N/A"}
              </Text>

              <Text
                style={[
                  styles.heroRole,
                  !profile.role && styles.mutedHeroText,
                ]}
              >
                {profile.role || "N/A"}
              </Text>

              {(profile.email || profile.phone) ? (
                <>
                  <View style={styles.heroDivider} />

                  {!!profile.email && (
                    <View style={styles.contactRow}>
                      <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.contactText}>{profile.email}</Text>
                    </View>
                  )}

                  {!!profile.phone && (
                    <View style={[styles.contactRow, { marginTop: 8 }]}>
                      <Ionicons name="call-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.contactText}>{profile.phone}</Text>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>Personal Information</Text>

              <View style={styles.sectionHeaderActions}>
                <TouchableOpacity
                  style={styles.sectionIconButton}
                  onPress={openEditProfile}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoList}>
              <InfoRow label="Full Name:" value={displayValue(profile.fullName)} missing={isMissing(profile.fullName)} />
              <InfoRow label="Phone:" value={displayValue(profile.phone)} missing={isMissing(profile.phone)} />
              <InfoRow label="Email:" value={displayValue(profile.email)} missing={isMissing(profile.email)} />
              <InfoRow label="Language(s):" value={displayValue(profile.languages)} missing={isMissing(profile.languages)} />
              <InfoRow label="Address:" value={displayValue(profile.address)} missing={isMissing(profile.address)} />
              <InfoRow label="Caregiver type:" value={displayValue(profile.caregiverType)} missing={isMissing(profile.caregiverType)} />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderTitle}>General Settings</Text>
              <Ionicons name="settings" size={28} color="#FFFFFF" />
            </View>

            <View style={styles.settingsBody}>
              <Text style={styles.settingsGroupTitle}>Notifications</Text>

              <View style={styles.settingRowCompact}>
                <Text style={styles.settingLabel}>Reminders:</Text>
                <Switch
                  value={remindersEnabled}
                  onValueChange={setRemindersEnabled}
                  trackColor={{ false: "#D6D6D6", true: "#8DBCF1" }}
                  thumbColor="#F4F4F4"
                  ios_backgroundColor="#D6D6D6"
                />
              </View>

              <View style={styles.settingRowCompact}>
                <Text style={styles.settingLabel}>Alert Type:</Text>
                <TouchableOpacity style={styles.fakeDropdown} activeOpacity={0.85}>
                  <Ionicons name="chevron-down" size={20} color="#737373" />
                  <Text style={styles.fakeDropdownText}>{profile.alertType}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.settingsGroupTitle, styles.settingsGroupTitleTight]}>
                Accessibility
              </Text>

              <View style={styles.settingRowCompact}>
                <Text style={styles.settingLabel}>Theme:</Text>
                <TouchableOpacity
                  style={[styles.fakeDropdown, styles.themeDropdown]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-down" size={20} color="#737373" />
                  <Text style={styles.fakeDropdownText}>{profile.theme}</Text>
                  <View style={styles.themePreview} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRowCompactNoBottom}>
                <Text style={styles.settingLabel}>Font Scale:</Text>
                <TouchableOpacity style={styles.fontScalePill} activeOpacity={0.85}>
                  <Text style={styles.fontScaleText}>{profile.fontScale}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.babyInfoButton}
            onPress={openSubpage}
            activeOpacity={0.9}
          >
            <Ionicons name="happy-outline" size={24} color="#FFFFFF" />
            <Text style={styles.babyInfoButtonText}>Baby Info</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <Ionicons name="log-out-outline" size={22} color="#D9534F" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Personal Info</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditVisible(false)}
              >
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Field
                label="Full Name"
                value={editForm.fullName}
                onChangeText={(v) => setEditForm((p) => ({ ...p, fullName: v }))}
              />
              <Field
                label="Phone Number"
                value={editForm.phone}
                onChangeText={(v) => setEditForm((p) => ({ ...p, phone: v }))}
                placeholder="Enter phone number"
              />
              <Field
                label="Email"
                value={editForm.email}
                onChangeText={(v) => setEditForm((p) => ({ ...p, email: v }))}
                placeholder="Enter email"
              />
              <Field
                label="Languages"
                value={editForm.languages}
                onChangeText={(v) => setEditForm((p) => ({ ...p, languages: v }))}
                placeholder="English, French..."
              />
              <Field
                label="Address"
                value={editForm.address}
                onChangeText={(v) => setEditForm((p) => ({ ...p, address: v }))}
                placeholder="Enter address"
                multiline
              />
              <Field
                label="Caregiver Type"
                value={editForm.caregiverType}
                onChangeText={(v) => setEditForm((p) => ({ ...p, caregiverType: v }))}
                placeholder="Mother, Father, Guardian..."
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, savingProfile && { opacity: 0.6 }]}
                onPress={saveEditProfile}
                disabled={savingProfile}
              >
                <Text style={styles.modalSaveText}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, missing && styles.infoValueMissing]}>
        {value}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? "Enter value"}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF3F7",
  },

  heroCard: {
    backgroundColor: "#8DBCF1",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    paddingHorizontal: 18,
    paddingBottom: 26,
    marginHorizontal: 0,
  },

  contentWrap: {
    paddingHorizontal: 10,
    paddingTop: 16,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  avatarOuter: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    position: "relative",
  },

  avatarInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: "#D9E0E8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },

  avatarCameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8DBCF1",
    borderWidth: 2,
    borderColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTextWrap: {
    flex: 1,
  },

  heroName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  heroRole: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "500",
    color: "#F4F8FF",
  },

  mutedHeroText: {
    color: "rgba(255,255,255,0.75)",
  },

  heroDivider: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
    marginTop: 8,
    marginBottom: 10,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  contactText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },

  sectionCard: {
    marginTop: 16,
    backgroundColor: "#F3F3F3",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#B7B7B7",
    overflow: "hidden",
  },

  sectionHeader: {
    minHeight: 58,
    backgroundColor: "#8DBCF1",
    borderBottomWidth: 1,
    borderBottomColor: "#7BAEE7",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeaderTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowRadius: 2,
  },

  sectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
  },

  sectionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  infoList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 9,
  },

  infoLabel: {
    width: 145,
    fontSize: 14,
    fontWeight: "800",
    color: "#555555",
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    color: "#777777",
    lineHeight: 20,
    fontWeight: "500",
  },

  infoValueMissing: {
    color: "#B1B1B1",
  },

  settingsBody: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },

  settingsGroupTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#555555",
    marginBottom: 8,
  },

  settingsGroupTitleTight: {
    marginTop: 2,
  },

  settingRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },

  settingRowCompactNoBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#555555",
  },

  fakeDropdown: {
    minWidth: 108,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#ADADAD",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  fakeDropdownText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#6F6F6F",
    fontWeight: "500",
  },

  themeDropdown: {
    minWidth: 156,
    justifyContent: "flex-start",
  },

  themePreview: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#8DBCF1",
    borderWidth: 1,
    borderColor: "#6F9FD5",
  },

  fontScalePill: {
    minWidth: 58,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#ADADAD",
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  fontScaleText: {
    fontSize: 14,
    color: "#6F6F6F",
    fontWeight: "500",
  },

  babyInfoButton: {
    marginTop: 18,
    marginBottom: 8,
    backgroundColor: "#8DBCF1",
    borderRadius: 18,
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },

  babyInfoButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#F6F6F6",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    maxHeight: "88%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#555",
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E9E9E9",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldWrap: {
    marginBottom: 14,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
    marginBottom: 6,
  },

  fieldInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C8D0D9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#444",
  },

  fieldInputMultiline: {
    minHeight: 92,
    paddingTop: 12,
  },

  modalActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
  },

  modalCancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#E5E5E5",
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  modalSaveButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#8DBCF1",
  },

  modalSaveText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  logoutButton: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#FFF0F0",
    borderRadius: 18,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#F5C6C6",
  },

  logoutButtonText: {
    color: "#D9534F",
    fontSize: 18,
    fontWeight: "800",
  },
});


