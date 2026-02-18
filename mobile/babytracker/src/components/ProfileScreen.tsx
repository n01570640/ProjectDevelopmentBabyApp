import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Baby } from "../types/baby.types";
import NavBar from "./navBar";

interface ShareModalProps {
  baby: Baby | null;
  visible: boolean;
  onClose: () => void;
}

function ShareModal({ baby, visible, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");

  if (!baby) return null;

  const handleSendInvite = () => {
    Alert.alert("Success", `Invite sent to ${email}`);
    setEmail("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Share {baby.name}</Text>

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
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Photo for {baby.name}</Text>

          <TouchableOpacity
            style={styles.photoOption}
            onPress={() => {
              onClose();
              onTakePhoto();
            }}
          >
            <Ionicons name="camera-outline" size={24} color="#81b6eb" />
            <Text style={styles.photoOptionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoOption}
            onPress={() => {
              onClose();
              onChooseFromLibrary();
            }}
          >
            <Ionicons name="images-outline" size={24} color="#81b6eb" />
            <Text style={styles.photoOptionText}>Choose from Library</Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CaregiversModal({ baby, visible, onClose }: CaregiversModalProps) {
  if (!baby) return null;

  // Demo caregivers data
  const caregivers: Caregiver[] = [
    { id: 1, name: "John Smith", email: "john@example.com", role: "PRIMARY" },
    { id: 2, name: "Jane Doe", email: "jane@example.com", role: "SECONDARY" },
    { id: 3, name: "Bob Wilson", email: "bob@example.com", role: "SECONDARY" },
  ];

  const handleRemoveCaregiver = (caregiver: Caregiver) => {
    Alert.alert(
      "Remove Caregiver",
      `Remove ${caregiver.name}'s access to ${baby.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Alert.alert("Success", `${caregiver.name} removed`);
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{baby.name} — Caregivers</Text>

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
                    <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showCaregivers, setShowCaregivers] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [babyImages, setBabyImages] = useState<{ [key: number]: string }>({});

  // Demo data
  const babies: Baby[] = [
    {
      id: 1,
      name: "Emma Johnson",
      dob: "2025-04-03",
      sex: "F",
      role: "PRIMARY",
      canShare: true,
    },
    {
      id: 2,
      name: "Noah Johnson",
      dob: "2024-10-11",
      sex: "M",
      role: "SECONDARY",
      canShare: false,
    },
    {
      id: 3,
      name: "Olivia Smith",
      dob: "2023-06-19",
      sex: "F",
      role: "SECONDARY",
      canShare: false,
    },
  ];

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
        <Text style={styles.title}>My Babies</Text>

        {babies.map((baby) => (
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
                  <Ionicons name="person" size={40} color="#81b6eb" />
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
                style={styles.actionButton}
                onPress={() => handleViewHistory(baby)}
              >
                <Text style={styles.actionButtonText}>View History</Text>
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
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for navbar
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#555",
  },
  card: {
    backgroundColor: "#fff",
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
    borderColor: "#81b6eb",
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
    backgroundColor: "#81b6eb",
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
    color: "#333",
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePrimary: {
    backgroundColor: "#2ecc71",
  },
  badgeSecondary: {
    backgroundColor: "#999",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: "#81b6eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  label: {
    fontSize: 14,
    color: "#666",
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
    color: "#666",
    marginBottom: 15,
  },
  roleBold: {
    fontWeight: "bold",
    color: "#333",
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
    backgroundColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    backgroundColor: "#81b6eb",
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
    color: "#333",
    marginBottom: 2,
  },
  caregiverEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  caregiverRole: {
    fontSize: 12,
    color: "#999",
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
    color: "#333",
    marginLeft: 15,
    fontWeight: "500",
  },
});
