import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Baby } from "../types/baby.types";
import NavBar from "./navBar";
import { getBabies } from "../../services/babyService";
import { createInvitation, getInvitations, cancelInvitation } from "../../services/invitationService";
import { getCaregivers, removeCaregiver } from "../../services/caregiverService";
import { colors } from "../theme/colors";
import ModalWrapper from "./shared/ModalWrapper";

interface ShareModalProps {
  baby: Baby | null;
  visible: boolean;
  onClose: () => void;
}

function ShareModal({ baby, visible, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  if (!baby) return null;

  const handleSendInvite = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }
    setSending(true);
    try {
      const result = await createInvitation(baby.id, email.trim(), 2);
      if (result?.success && result.data?.token) {
        const inviteLink = `babytracker://invitations/${result.data.token}`;
        setEmail("");
        onClose();
        try {
          await Share.share({
            message: `You've been invited to help care for ${baby.name}! Open this link to accept: ${inviteLink}`,
          });
        } catch {}
      } else {
        Alert.alert("Error", result?.message ?? "Failed to create invitation");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalWrapper visible={visible} onClose={onClose} title={`Share ${baby.name}`}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="caregiver@email.com"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.roleText}>
            Role: <Text style={styles.roleBold}>SECONDARY</Text>
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSendInvite}
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              disabled={sending}
            >
              <Text style={styles.sendButtonText}>
                {sending ? "Sending..." : "Send Invite"}
              </Text>
            </TouchableOpacity>
          </View>
    </ModalWrapper>
  );
}

interface CaregiversModalProps {
  baby: Baby | null;
  visible: boolean;
  onClose: () => void;
}

interface Caregiver {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface PhotoModalProps {
  baby: Baby | null;
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
}

function PhotoModal({
  baby,
  visible,
  onClose,
  onTakePhoto,
  onChooseFromLibrary,
}: PhotoModalProps) {
  if (!baby) return null;

  return (
    <ModalWrapper visible={visible} onClose={onClose} title={`Add Photo for ${baby.name}`}>
          <TouchableOpacity
            style={styles.photoOption}
            onPress={() => {
              onClose();
              onTakePhoto();
            }}
          >
            <Ionicons name="camera-outline" size={24} color={colors.primary} />
            <Text style={styles.photoOptionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoOption}
            onPress={() => {
              onClose();
              onChooseFromLibrary();
            }}
          >
            <Ionicons name="images-outline" size={24} color={colors.primary} />
            <Text style={styles.photoOptionText}>Choose from Library</Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
    </ModalWrapper>
  );
}

interface PendingInvite {
  invite_id: number;
  invited_email: string;
  invited_role: string;
}

function CaregiversModal({ baby, visible, onClose }: CaregiversModalProps) {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
  const [resultModal, setResultModal] = useState<{ title: string; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    try {
      const res = await getCaregivers(baby.id);
      if (res?.success && Array.isArray(res.data)) {
        setCaregivers(
          res.data.map((c: any) => ({
            id: c.user_id,
            name: c.full_name,
            email: c.email,
            role: c.access_role?.replace("_CAREGIVER", "") ?? c.access_role,
          }))
        );
      }
      if (baby.canShare) {
        const invRes = await getInvitations(baby.id);
        if (invRes?.success && Array.isArray(invRes.data)) {
          setPendingInvites(invRes.data);
        }
      }
    } catch (e) {
      console.error("CaregiversModal: failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  }, [baby]);

  useEffect(() => {
    if (visible && baby) {
      fetchData();
    }
  }, [visible, baby, fetchData]);

  if (!baby) return null;

  const handleRemoveCaregiver = (caregiver: Caregiver) => {
    setConfirmModal({
      title: "Remove Caregiver",
      message: `Remove ${caregiver.name}'s access to ${baby.name}?`,
      confirmText: "Remove",
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await removeCaregiver(baby.id, caregiver.id);
        if (res?.success) {
          setResultModal({ title: "Success", message: `${caregiver.name} removed` });
          fetchData();
        } else {
          setResultModal({ title: "Error", message: res?.message ?? "Failed to remove caregiver" });
        }
      },
    });
  };

  const handleCancelInvite = (invite: PendingInvite) => {
    setConfirmModal({
      title: "Cancel Invitation",
      message: `Cancel invitation to ${invite.invited_email}?`,
      confirmText: "Cancel Invite",
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await cancelInvitation(baby.id, invite.invite_id);
        if (res?.success) {
          fetchData();
        } else {
          setResultModal({ title: "Error", message: res?.message ?? "Failed to cancel invitation" });
        }
      },
    });
  };

  return (
    <ModalWrapper visible={visible} onClose={onClose} title={`${baby.name} — Caregivers`}>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView style={styles.caregiversList}>
              {caregivers.map((caregiver) => (
                <View key={caregiver.id} style={styles.caregiverItem}>
                  <View style={styles.caregiverInfo}>
                    <Text style={styles.caregiverName}>{caregiver.name}</Text>
                    <Text style={styles.caregiverEmail}>{caregiver.email}</Text>
                    <Text style={styles.caregiverRole}>{caregiver.role}</Text>
                  </View>
                  {baby.role === "PRIMARY" && caregiver.role !== "PRIMARY" && (
                    <TouchableOpacity
                      onPress={() => handleRemoveCaregiver(caregiver)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pendingInvites.length > 0 && (
                <>
                  <Text style={[styles.caregiverRole, { marginTop: 10, marginBottom: 6 }]}>
                    PENDING INVITATIONS
                  </Text>
                  {pendingInvites.map((invite) => (
                    <View key={invite.invite_id} style={styles.caregiverItem}>
                      <View style={styles.caregiverInfo}>
                        <Text style={styles.caregiverEmail}>{invite.invited_email}</Text>
                        <Text style={styles.caregiverRole}>
                          {invite.invited_role?.replace("_CAREGIVER", "") ?? "PENDING"}
                        </Text>
                      </View>
                      {baby.role === "PRIMARY" && (
                        <TouchableOpacity
                          onPress={() => handleCancelInvite(invite)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

      {/* Confirmation modal (remove caregiver / cancel invite) */}
      <ModalWrapper
        visible={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
      >
            <Text style={styles.roleText}>{confirmModal?.message}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setConfirmModal(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmModal?.onConfirm()}
                style={[styles.sendButton, { backgroundColor: colors.error }]}
              >
                <Text style={styles.sendButtonText}>{confirmModal?.confirmText}</Text>
              </TouchableOpacity>
            </View>
      </ModalWrapper>

      {/* Result modal (success / error) */}
      <ModalWrapper
        visible={!!resultModal}
        onClose={() => setResultModal(null)}
        title={resultModal?.title}
      >
            <Text style={styles.roleText}>{resultModal?.message}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setResultModal(null)}
                style={styles.sendButton}
              >
                <Text style={styles.sendButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
      </ModalWrapper>
    </ModalWrapper>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showCaregivers, setShowCaregivers] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [babyImages, setBabyImages] = useState<{ [key: number]: string }>({});

  // ── Live API data
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBabies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBabies();
      if (res?.success && Array.isArray(res.data)) {
        // Map BabyWithDetailsDTO → Baby (local type)
        const mapped: Baby[] = res.data.map((b: any) => ({
          id: b.baby_id,
          name: b.display_name,
          dob: b.date_of_birth?.slice(0, 10) ?? "",
          sex: b.sex === "male" ? "M" : b.sex === "female" ? "F" : b.sex ?? "—",
          role: b.access_role === "PRIMARY_CAREGIVER" ? "PRIMARY" : "SECONDARY",
          canShare: b.can_share ?? false,
        }));
        setBabies(mapped);
      }
    } catch (e) {
      console.error("ProfileScreen: failed to fetch babies", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchBabies();
  }, [fetchBabies]);

  // Re-fetch whenever this screen comes into focus (e.g. after AddChild)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", fetchBabies);
    return unsubscribe;
  }, [navigation, fetchBabies]);

  const handleViewHistory = (baby: Baby) => {
    setSelectedBaby(baby);
    navigation.navigate("History", { baby });
  };

  const handleSharePress = (baby: Baby) => {
    setSelectedBaby(baby);
    setShowShare(true);
  };

  const handleCaregiversPress = (baby: Baby) => {
    setSelectedBaby(baby);
    setShowCaregivers(true);
  };

  const handleAddPhoto = (baby: Baby) => {
    console.log("handleAddPhoto called for", baby.name);
    setSelectedBaby(baby);
    setShowPhotoModal(true);
  };

  const handleTakePhoto = async () => {
    if (!selectedBaby) return;
    console.log("Take Photo pressed");
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Camera permission is required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      console.log("Image selected:", result.assets[0].uri);
      setBabyImages((prev) => ({
        ...prev,
        [selectedBaby.id]: result.assets[0].uri,
      }));
    }
  };

  const handleChooseFromLibrary = async () => {
    if (!selectedBaby) return;
    console.log("Choose from Library pressed");
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Photo library permission is required",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      console.log("Image selected:", result.assets[0].uri);
      setBabyImages((prev) => ({
        ...prev,
        [selectedBaby.id]: result.assets[0].uri,
      }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title row with Add button */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Babies</Text>
          <TouchableOpacity
            style={styles.addBabyBtn}
            onPress={() => navigation.navigate("AddChild")}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBabyBtnText}>Add Baby</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.stateText}>Loading babies...</Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && babies.length === 0 && (
          <View style={styles.centeredState}>
            <Ionicons name="people-outline" size={52} color="#c0d4e8" />
            <Text style={styles.stateText}>No babies added yet</Text>
            <TouchableOpacity
              style={styles.addBabyBtnLarge}
              onPress={() => navigation.navigate("AddChild")}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.addBabyBtnText}>Add your first baby</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Baby cards */}
        {!loading &&
          babies.map((baby) => (
          <View key={baby.id} style={styles.card}>
            <View style={styles.cardTop}>
              <TouchableOpacity
                style={styles.babyIconContainer}
                onPress={() => {
                  console.log("TouchableOpacity pressed for baby:", baby.name);
                  handleAddPhoto(baby);
                }}
                activeOpacity={0.7}
              >
                {babyImages[baby.id] ? (
                  <Image
                    source={{ uri: babyImages[baby.id] }}
                    style={styles.babyImage}
                  />
                ) : (
                  <Ionicons name="person" size={40} color={colors.primary} />
                )}
                <View style={styles.cameraIconOverlay} pointerEvents="none">
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.cardInfo}>
                <View style={styles.header}>
                  <Text style={styles.babyName}>{baby.name}</Text>
                  <View
                    style={[
                      styles.badge,
                      baby.role === "PRIMARY"
                        ? styles.badgePrimary
                        : styles.badgeSecondary,
                    ]}
                  >
                    <Text style={styles.badgeText}>{baby.role}</Text>
                  </View>
                </View>

                <Text style={styles.infoText}>DOB: {baby.dob}</Text>
                <Text style={styles.infoText}>Sex: {baby.sex}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => navigation.navigate("BabyDetail", { babyId: baby.id })}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewHistory(baby)}
              >
                <Text style={styles.actionButtonText}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCaregiversPress(baby)}
              >
                <Text style={styles.actionButtonText}>Caregivers</Text>
              </TouchableOpacity>

              {baby.canShare && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSharePress(baby)}
                >
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <ShareModal
        baby={selectedBaby}
        visible={showShare}
        onClose={() => setShowShare(false)}
      />

      <CaregiversModal
        baby={selectedBaby}
        visible={showCaregivers}
        onClose={() => setShowCaregivers(false)}
      />

      <PhotoModal
        baby={selectedBaby}
        visible={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onTakePhoto={handleTakePhoto}
        onChooseFromLibrary={handleChooseFromLibrary}
      />

      <NavBar navigation={navigation} activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#555",
  },
  addBabyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBabyBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  addBabyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  centeredState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#aaa",
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  babyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "visible",
  },
  babyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    overflow: "hidden",
  },
  cameraIconOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardInfo: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  babyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePrimary: {
    backgroundColor: colors.success,
  },
  badgeSecondary: {
    backgroundColor: colors.textTertiary,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primaryDark,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    fontSize: 14,
  },
  roleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  roleBold: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: colors.cancel,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  caregiversList: {
    maxHeight: 300,
    marginBottom: 15,
  },
  caregiverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 10,
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  caregiverEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  caregiverRole: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: "600",
  },
  removeButton: {
    padding: 8,
    marginLeft: 10,
  },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginBottom: 10,
  },
  photoOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 15,
    fontWeight: "500",
  },
});
