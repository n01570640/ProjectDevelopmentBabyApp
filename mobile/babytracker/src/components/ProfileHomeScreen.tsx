import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { useAppSelector } from "../store/hooks";

export default function ProfileHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [editVisible, setEditVisible] = useState(false);

  const { items: rawBabies } = useAppSelector((state: any) => state.babies);
  const primaryBaby = rawBabies?.[0];

  const derivedProfile = useMemo(() => {
    const displayName =
      primaryBaby?.display_name?.trim() ||
      primaryBaby?.name?.trim() ||
      "";

    const role =
      primaryBaby?.access_role === "PRIMARY_CAREGIVER"
        ? "Primary Caregiver"
        : primaryBaby?.access_role
        ? "Secondary Caregiver"
        : "";

    const phone =
      primaryBaby?.phone_number?.trim() ||
      primaryBaby?.phone?.trim() ||
      "";

    const email =
      primaryBaby?.email?.trim() ||
      primaryBaby?.caregiver_email?.trim() ||
      "";

    const languages =
      primaryBaby?.languages?.trim() ||
      primaryBaby?.language?.trim() ||
      "";

    const address =
      primaryBaby?.address?.trim() ||
      "";

    const caregiverType =
      primaryBaby?.caregiver_type?.trim() ||
      "";

    return {
      firstLineName: displayName,
      fullName: displayName,
      role,
      email,
      phone,
      languages,
      address,
      caregiverType,
      alertType: "All",
      theme: "Default Blue",
      fontScale: "x1.0",
    };
  }, [primaryBaby]);

  const [profile, setProfile] = useState(derivedProfile);

  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    languages: "",
    address: "",
    caregiverType: "",
  });

  useEffect(() => {
    setProfile(derivedProfile);
  }, [derivedProfile]);

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

  const saveEditProfile = () => {
    setProfile((prev) => ({
      ...prev,
      fullName: editForm.fullName,
      firstLineName: editForm.fullName,
      phone: editForm.phone,
      email: editForm.email,
      languages: editForm.languages,
      address: editForm.address,
      caregiverType: editForm.caregiverType,
    }));
    setEditVisible(false);
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
            <View style={styles.avatarOuter}>
              <View style={styles.avatarInner}>
                <Ionicons name="person" size={54} color="#6E89A6" />
              </View>
            </View>

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
                style={styles.modalSaveButton}
                onPress={saveEditProfile}
              >
                <Text style={styles.modalSaveText}>Save Changes</Text>
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
});