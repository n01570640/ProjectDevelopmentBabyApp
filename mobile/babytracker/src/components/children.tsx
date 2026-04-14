
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchBabies } from "../store/slices/babiesSlice";
import { createBaby, updateBaby, deleteBaby } from "../../services/babyService";
import {
  getBabyProfilePhoto,
  uploadBabyProfilePhoto,
} from "../../services/babyProfilePhotoService";
import { useFocusEffect } from "@react-navigation/native";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

type Props = {
  navigation: any;
  route?: any;
};

type LatestGrowth = {
  weight_kg: number | null;
  length_cm: number | null;
  head_circum_cm: number | null;
  recorded_at: string | null;
};

type BabyProfile = {
  baby_id: number;
  display_name: string;
  date_of_birth: string;
  sex: "male" | "female" | null;
  blood_type?: string | null;
  notes: string | null;
  created_at?: string;
  access_role?: string;
  can_edit_health?: boolean;
  can_edit_activities?: boolean;
  can_share?: boolean;
  latest_growth: LatestGrowth | null;
  primary_caregiver_name: string | null;
};

type LayoutMode = 1 | 2 | 4;
type SexOption = "male" | "female" | null;
type ModalMode = "add" | "edit";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const placeholderImage = require("../images/children/charlie.jpg");
const CARD_RADIUS = 20;

const formatBirthDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const formatShortBirthDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const getAgeLabel = (dateString: string): string => {
  const dob = new Date(dateString);
  if (Number.isNaN(dob.getTime())) return "Age unavailable";

  const now = new Date();
  let months =
    (now.getFullYear() - dob.getFullYear()) * 12 +
    (now.getMonth() - dob.getMonth());

  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) months = 0;

  if (months < 24) {
    return `${months} month${months === 1 ? "" : "s"} old`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} year${years === 1 ? "" : "s"} old`;
  return `${years}y ${remMonths}m`;
};

const getLayoutIcon = (layoutMode: LayoutMode) => {
  if (layoutMode === 1) return "reorder-three-outline";
  if (layoutMode === 2) return "grid-outline";
  return "apps-outline";
};

type ChildModalForm = {
  displayName: string;
  dateOfBirth: string;
  sex: SexOption;
  bloodType: string | null;
  notes: string;
  localPhotoUri: string | null;
  uploadedPhotoUri: string | null;
};

const emptyForm = (): ChildModalForm => ({
  displayName: "",
  dateOfBirth: "",
  sex: null,
  bloodType: null,
  notes: "",
  localPhotoUri: null,
  uploadedPhotoUri: null,
});

export default function Children({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items: babies, loading, error } = useAppSelector((state) => state.babies);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(1);
  const [selectedGridBabyId, setSelectedGridBabyId] = useState<number | null>(null);
  const [babyPhotos, setBabyPhotos] = useState<Record<number, string | null>>({});

  const [childModalVisible, setChildModalVisible] = useState(false);
  const [childModalMode, setChildModalMode] = useState<ModalMode>("add");
  const [editingBaby, setEditingBaby] = useState<BabyProfile | null>(null);
  const [childSaving, setChildSaving] = useState(false);
  const [childFeedback, setChildFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [childForm, setChildForm] = useState<ChildModalForm>(emptyForm());

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [childDeleting, setChildDeleting] = useState(false);

  const loadBabyPhotos = useCallback(() => {
    if (!babies || babies.length === 0) return;
    babies.forEach(async (baby: BabyProfile) => {
      try {
        const result = await getBabyProfilePhoto(baby.baby_id);
        if (result?.success && result.data?.sas_url) {
          setBabyPhotos((prev) => ({ ...prev, [baby.baby_id]: result.data.sas_url }));
        } else {
          setBabyPhotos((prev) => ({ ...prev, [baby.baby_id]: null }));
        }
      } catch {
        setBabyPhotos((prev) => ({ ...prev, [baby.baby_id]: null }));
      }
    });
  }, [babies]);

  // Fetch photos on initial load and when babies list changes
  useEffect(() => { loadBabyPhotos(); }, [loadBabyPhotos]);

  // Re-fetch photos when navigating back to this screen
  useFocusEffect(useCallback(() => { loadBabyPhotos(); }, [loadBabyPhotos]));

  useEffect(() => {
    const inviteMessage = route?.params?.inviteMessage;
    if (inviteMessage) {
      setFeedback(inviteMessage);
      setTimeout(() => setFeedback(null), 3000);
      navigation.setParams({ inviteMessage: undefined });
    }
  }, [route?.params?.inviteMessage, navigation]);

  useEffect(() => {
    dispatch(fetchBabies());
  }, [dispatch]);

  useEffect(() => {
    if (!feedback || feedback.type !== "success") return;
    const timeout = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);

  const filteredBabies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return babies;

    return babies.filter((baby: BabyProfile) =>
      baby.display_name?.toLowerCase().includes(query)
    );
  }, [babies, searchQuery]);

  const selectedGridBaby =
    layoutMode === 4
      ? filteredBabies.find((baby: BabyProfile) => baby.baby_id === selectedGridBabyId) ?? null
      : null;

  const cycleLayout = () => {
    setSelectedGridBabyId(null);
    setLayoutMode((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  const getCardWidth = () => {
    const gap = scale(12);
    const available = width * 0.9;

    if (layoutMode === 1) return "100%";
    if (layoutMode === 2) return (available - gap) / 2;
    return (available - gap * 3) / 4;
  };

  const resetChildModal = useCallback(() => {
    setChildModalVisible(false);
    setEditingBaby(null);
    setChildSaving(false);
    setChildFeedback(null);
    setChildForm(emptyForm());
  }, []);

  const handleDobChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length >= 5) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
    } else if (digits.length >= 3) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    setChildForm((prev) => ({ ...prev, dateOfBirth: formatted.slice(0, 10) }));
  };

  const openAddChildModal = () => {
    setChildModalMode("add");
    setEditingBaby(null);
    setChildFeedback(null);
    setChildForm(emptyForm());
    setChildModalVisible(true);
  };

  const openEditChildModal = (baby: BabyProfile) => {
    const existingPhoto = babyPhotos[baby.baby_id] ?? null;
    setChildModalMode("edit");
    setEditingBaby(baby);
    setChildFeedback(null);
    setChildForm({
      displayName: baby.display_name ?? "",
      dateOfBirth: baby.date_of_birth?.slice(0, 10) ?? "",
      sex: baby.sex ?? null,
      bloodType: baby.blood_type ?? null,
      notes: baby.notes ?? "",
      localPhotoUri: existingPhoto,
      uploadedPhotoUri: existingPhoto,
    });
    setChildModalVisible(true);
  };

  const handlePickChildPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library access is required to change the baby's profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    const imageUri = result.assets[0].uri;
    setChildForm((prev) => ({
      ...prev,
      localPhotoUri: imageUri,
    }));
  };

  const validateChildForm = () => {
    if (!childForm.displayName.trim()) {
      setChildFeedback({ type: "error", message: "Please enter the baby's name." });
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(childForm.dateOfBirth)) {
      setChildFeedback({
        type: "error",
        message: "Please enter a valid date (YYYY-MM-DD).",
      });
      return false;
    }

    const parsed = new Date(childForm.dateOfBirth);
    if (isNaN(parsed.getTime()) || parsed > new Date()) {
      setChildFeedback({
        type: "error",
        message: "Date of birth cannot be in the future.",
      });
      return false;
    }

    return true;
  };

  const saveChild = async () => {
    setChildFeedback(null);
    if (!validateChildForm()) return;

    setChildSaving(true);

    try {
      if (childModalMode === "add") {
        const response = await createBaby({
          display_name: childForm.displayName.trim(),
          date_of_birth: childForm.dateOfBirth,
          sex: childForm.sex ?? undefined,
          blood_type: childForm.bloodType ?? undefined,
          notes: childForm.notes.trim() || undefined,
        });

        if (!response?.success) {
          setChildFeedback({
            type: "error",
            message: response?.message || "Failed to add baby.",
          });
          return;
        }

        const createdBabyId =
          response?.data?.baby_id ??
          response?.data?.id ??
          null;

        if (createdBabyId && childForm.localPhotoUri) {
          try {
            const uploadResult = await uploadBabyProfilePhoto(
              createdBabyId,
              childForm.localPhotoUri
            );
            if (uploadResult?.success && uploadResult.data?.sas_url) {
              setBabyPhotos((prev) => ({
                ...prev,
                [createdBabyId]: uploadResult.data.sas_url,
              }));
            }
          } catch {
            // keep create successful even if photo upload fails
          }
        }

        await dispatch(fetchBabies());
        resetChildModal();
        setFeedback({ type: "success", message: "Baby added successfully!" });
        return;
      }

      if (!editingBaby) return;

      const response = await updateBaby(editingBaby.baby_id, {
        display_name: childForm.displayName.trim(),
        date_of_birth: childForm.dateOfBirth,
        sex: childForm.sex ?? undefined,
        blood_type: childForm.bloodType ?? undefined,
        notes: childForm.notes.trim() || undefined,
      });

      if (!(response?.success || response?.data)) {
        setChildFeedback({
          type: "error",
          message: response?.message || "Update failed.",
        });
        return;
      }

      const originalPhoto = babyPhotos[editingBaby.baby_id] ?? null;
      const pickedPhoto = childForm.localPhotoUri;

      if (pickedPhoto && pickedPhoto !== originalPhoto) {
        try {
          const uploadResult = await uploadBabyProfilePhoto(
            editingBaby.baby_id,
            pickedPhoto
          );
          if (uploadResult?.success && uploadResult.data?.sas_url) {
            setBabyPhotos((prev) => ({
              ...prev,
              [editingBaby.baby_id]: uploadResult.data.sas_url,
            }));
          }
        } catch (e: any) {
          Alert.alert(
            "Photo Upload Failed",
            e?.message ?? "The child was updated, but the photo could not be uploaded."
          );
        }
      }

      await dispatch(fetchBabies());
      resetChildModal();
      setFeedback({ type: "success", message: "Baby updated successfully!" });
    } catch (e: any) {
      setChildFeedback({
        type: "error",
        message: e?.message ?? "Something went wrong.",
      });
    } finally {
      setChildSaving(false);
    }
  };

  const isPrimaryCaregiverForEditing =
    editingBaby?.access_role === "PRIMARY_CAREGIVER";

  const openDeleteConfirm = () => {
    setDeleteConfirmName("");
    setDeleteConfirmVisible(true);
  };

  const closeDeleteConfirm = () => {
    if (childDeleting) return;
    setDeleteConfirmVisible(false);
    setDeleteConfirmName("");
  };

  const confirmDeleteChild = async () => {
    if (!editingBaby) return;

    if (isPrimaryCaregiverForEditing) {
      const typed = deleteConfirmName.trim().toLowerCase();
      const expected = (editingBaby.display_name ?? "").trim().toLowerCase();
      if (!typed || typed !== expected) {
        setChildFeedback({
          type: "error",
          message: "Please type the child's name exactly to confirm deletion.",
        });
        return;
      }
    }

    setChildDeleting(true);
    setChildFeedback(null);

    try {
      const response = await deleteBaby(editingBaby.baby_id);
      if (!response?.success) {
        setChildFeedback({
          type: "error",
          message: response?.message ?? "Failed to delete child.",
        });
        return;
      }

      if (selectedGridBabyId === editingBaby.baby_id) {
        setSelectedGridBabyId(null);
      }
      setBabyPhotos((prev) => {
        const next = { ...prev };
        delete next[editingBaby.baby_id];
        return next;
      });

      await dispatch(fetchBabies());
      setDeleteConfirmVisible(false);
      setDeleteConfirmName("");
      resetChildModal();
      setFeedback({
        type: "success",
        message: isPrimaryCaregiverForEditing
          ? "Child deleted successfully."
          : "Your access has been removed.",
      });
    } catch (e: any) {
      setChildFeedback({
        type: "error",
        message: e?.message ?? "Something went wrong deleting this child.",
      });
    } finally {
      setChildDeleting(false);
    }
  };

  const renderLargeCard = (baby: BabyProfile) => {
    const photoUri = babyPhotos[baby.baby_id];
    return (
      <View key={baby.baby_id} style={styles.card}>
        <View style={styles.cardTopAccent} />

        <Image
          source={photoUri ? { uri: photoUri } : placeholderImage}
          style={styles.cardImage}
        />

        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <View style={styles.nameLeft}>
              {baby.sex && (
                <Ionicons
                  name={baby.sex === "male" ? "male-outline" : "female-outline"}
                  size={moderateScale(20)}
                  color="#5F8FC8"
                  style={styles.genderIcon}
                />
              )}
              <Text style={styles.childName}>{baby.display_name}</Text>
            </View>

            <View style={styles.agePill}>
              <Text style={styles.agePillText}>{getAgeLabel(baby.date_of_birth)}</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={moderateScale(15)}
              color="#74879B"
            />
            <Text style={styles.dateText}>{formatBirthDate(baby.date_of_birth)}</Text>
          </View>

          <View style={styles.infoChipRow}>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Height</Text>
              <Text style={styles.infoChipValue}>
                {baby.latest_growth?.length_cm
                  ? `${baby.latest_growth.length_cm} cm`
                  : "Not recorded"}
              </Text>
            </View>

            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Weight</Text>
              <Text style={styles.infoChipValue}>
                {baby.latest_growth?.weight_kg
                  ? `${baby.latest_growth.weight_kg} kg`
                  : "Not recorded"}
              </Text>
            </View>

            <View style={styles.infoChip}>
              <Text style={styles.infoChipLabel}>Guardian</Text>
              <Text style={styles.infoChipValue} numberOfLines={2}>
                {baby.primary_caregiver_name || "Not assigned"}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.viewButtonTap}
              onPress={() =>
                navigation.navigate("BabyDetail", { babyId: baby.baby_id })
              }
            >
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View information</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() => openEditChildModal(baby)}
            >
              <Ionicons
                name="settings-outline"
                size={moderateScale(18)}
                color="#4f6175"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTwoUpCard = (baby: BabyProfile) => {
    const cardWidth = getCardWidth();
    const photoUri = babyPhotos[baby.baby_id];

    return (
      <View key={baby.baby_id} style={[styles.twoUpCard, { width: cardWidth as number }]}>
        <View style={styles.cardTopAccent} />

        <Image
          source={photoUri ? { uri: photoUri } : placeholderImage}
          style={styles.twoUpImage}
        />

        <View style={styles.twoUpBody}>
          <Text style={styles.twoUpName} numberOfLines={1}>
            {baby.display_name}
          </Text>

          <View style={styles.twoUpTopMeta}>
            <Text style={styles.twoUpAge}>{getAgeLabel(baby.date_of_birth)}</Text>
          </View>

          <View style={styles.twoUpDateRow}>
            <Ionicons name="calendar-outline" size={moderateScale(12)} color="#74879B" />
            <Text style={styles.twoUpDateText} numberOfLines={1}>
              {formatShortBirthDate(baby.date_of_birth)}
            </Text>
          </View>

          <View style={styles.twoUpInfoList}>
            <Text style={styles.twoUpInfoLine} numberOfLines={1}>
              <Text style={styles.twoUpInfoLabel}>H: </Text>
              {baby.latest_growth?.length_cm ? `${baby.latest_growth.length_cm} cm` : "Not recorded"}
            </Text>

            <Text style={styles.twoUpInfoLine} numberOfLines={1}>
              <Text style={styles.twoUpInfoLabel}>W: </Text>
              {baby.latest_growth?.weight_kg ? `${baby.latest_growth.weight_kg} kg` : "Not recorded"}
            </Text>

            <Text style={styles.twoUpInfoLine} numberOfLines={1}>
              <Text style={styles.twoUpInfoLabel}>G: </Text>
              {baby.primary_caregiver_name || "Not assigned"}
            </Text>
          </View>

          <View style={styles.twoUpActionsRow}>
            <TouchableOpacity
              style={styles.twoUpIconButtonPrimary}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("BabyDetail", { babyId: baby.baby_id })}
            >
              <Ionicons name="eye-outline" size={moderateScale(17)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.twoUpIconButtonSecondary}
              activeOpacity={0.85}
              onPress={() => openEditChildModal(baby)}
            >
              <Ionicons name="settings-outline" size={moderateScale(17)} color="#4f6175" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCompactCard = (baby: BabyProfile) => {
    const cardWidth = getCardWidth();
    const isSelected = selectedGridBabyId === baby.baby_id;
    const photoUri = babyPhotos[baby.baby_id];

    return (
      <TouchableOpacity
        key={baby.baby_id}
        activeOpacity={0.9}
        style={[
          styles.compactCard,
          { width: cardWidth as number },
          isSelected && styles.compactCardSelected,
        ]}
        onPress={() =>
          setSelectedGridBabyId((prev) => (prev === baby.baby_id ? null : baby.baby_id))
        }
      >
        <View style={[styles.compactAccent, isSelected && styles.compactAccentSelected]} />

        <Image
          source={photoUri ? { uri: photoUri } : placeholderImage}
          style={styles.compactImage}
        />

        <View style={styles.compactBody}>
          <Text style={[styles.compactName, isSelected && styles.compactNameSelected]} numberOfLines={1}>
            {baby.display_name}
          </Text>

          <Text style={styles.compactSub} numberOfLines={1}>
            {getAgeLabel(baby.date_of_birth)}
          </Text>

          <View style={styles.compactMetaRow}>
            <Ionicons
              name={baby.sex === "female" ? "female-outline" : "person-outline"}
              size={moderateScale(12)}
              color={isSelected ? "#4E86C7" : "#7E8B99"}
            />
            <Text style={styles.compactMetaText} numberOfLines={1}>
              {formatShortBirthDate(baby.date_of_birth)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroWrap}>
        <View style={[styles.heroInner, { paddingTop: insets.top + verticalScale(12) }]}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Children</Text>
            <Text style={styles.heroSubtitle}>Profiles, quick info, and caregiver details</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.inner}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={moderateScale(18)}
                color="#8393A5"
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="children's names"
                style={styles.searchInput}
                placeholderTextColor="#b2b8c3"
              />
            </View>

            <TouchableOpacity style={styles.menuButton} activeOpacity={0.85} onPress={cycleLayout}>
              <Ionicons
                name={getLayoutIcon(layoutMode) as any}
                size={moderateScale(24)}
                color="#4f6175"
              />
            </TouchableOpacity>
          </View>

          {feedback && (
            <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
              <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
                {feedback.message}
              </Text>
            </View>
          )}

          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading children...</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.centerContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.errorBorder} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchBabies())}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && babies.length === 0 && (
            <View style={styles.centerContainer}>
              <Ionicons name="people-outline" size={48} color="#b2b8c3" />
              <Text style={styles.emptyText}>No children added yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first child</Text>
            </View>
          )}

          {!loading && !error && babies.length > 0 && filteredBabies.length === 0 && (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={48} color="#b2b8c3" />
              <Text style={styles.emptyText}>No matches found</Text>
              <Text style={styles.emptySubtext}>Try searching a different child name</Text>
            </View>
          )}

          {!loading && !error && filteredBabies.length > 0 && (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                layoutMode !== 1 && styles.gridScrollContent,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {layoutMode === 1 &&
                filteredBabies.map((baby: BabyProfile) => renderLargeCard(baby))}

              {layoutMode === 2 && (
                <View style={styles.gridWrap}>
                  {filteredBabies.map((baby: BabyProfile) => renderTwoUpCard(baby))}
                </View>
              )}

              {layoutMode === 4 && (
                <View style={styles.gridWrap}>
                  {filteredBabies.map((baby: BabyProfile) => renderCompactCard(baby))}
                </View>
              )}

              <View style={{ height: layoutMode === 4 ? verticalScale(250) : verticalScale(90) }} />
            </ScrollView>
          )}

          {layoutMode === 4 && selectedGridBaby && (
            <Pressable
              style={styles.dismissOverlay}
              onPress={() => setSelectedGridBabyId(null)}
            />
          )}

          {layoutMode === 4 && selectedGridBaby && (
            <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + verticalScale(72) }]}>
              <View style={styles.bottomSheetHandle} />

              <View style={styles.bottomSheetHeader}>
                <View>
                  <Text style={styles.bottomSheetTitle}>{selectedGridBaby.display_name}</Text>
                  <Text style={styles.bottomSheetSubtitle}>
                    {getAgeLabel(selectedGridBaby.date_of_birth)}
                  </Text>
                </View>

                {selectedGridBaby.sex && (
                  <View style={styles.bottomSheetSexPill}>
                    <Ionicons
                      name={
                        selectedGridBaby.sex === "male"
                          ? "male-outline"
                          : "female-outline"
                      }
                      size={moderateScale(16)}
                      color="#4F8DD4"
                    />
                    <Text style={styles.bottomSheetSexText}>
                      {selectedGridBaby.sex === "male" ? "Male" : "Female"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.bottomInfoRow}>
                <View style={styles.bottomInfoCard}>
                  <Text style={styles.bottomInfoLabel}>Height</Text>
                  <Text style={styles.bottomInfoValue}>
                    {selectedGridBaby.latest_growth?.length_cm
                      ? `${selectedGridBaby.latest_growth.length_cm} cm`
                      : "Not recorded"}
                  </Text>
                </View>

                <View style={styles.bottomInfoCard}>
                  <Text style={styles.bottomInfoLabel}>Weight</Text>
                  <Text style={styles.bottomInfoValue}>
                    {selectedGridBaby.latest_growth?.weight_kg
                      ? `${selectedGridBaby.latest_growth.weight_kg} kg`
                      : "Not recorded"}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomGuardianCard}>
                <Text style={styles.bottomInfoLabel}>Guardian</Text>
                <Text style={styles.bottomInfoValue}>
                  {selectedGridBaby.primary_caregiver_name || "Not assigned"}
                </Text>
              </View>

              <View style={styles.bottomActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.bottomViewButton}
                  onPress={() =>
                    navigation.navigate("BabyDetail", {
                      babyId: selectedGridBaby.baby_id,
                    })
                  }
                >
                  <Text style={styles.bottomViewButtonText}>View information</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bottomEditButton}
                  activeOpacity={0.85}
                  onPress={() => openEditChildModal(selectedGridBaby)}
                >
                  <Ionicons
                    name="settings-outline"
                    size={moderateScale(18)}
                    color="#4f6175"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.bottomEditText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + verticalScale(90) }]}
            activeOpacity={0.9}
            onPress={openAddChildModal}
          >
            <View style={styles.fabInner}>
              <Ionicons name="add" size={moderateScale(30)} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ChildEditModal
        visible={childModalVisible}
        mode={childModalMode}
        form={childForm}
        saving={childSaving}
        feedback={childFeedback}
        onClose={resetChildModal}
        onPickPhoto={handlePickChildPhoto}
        onNameChange={(v) => setChildForm((prev) => ({ ...prev, displayName: v }))}
        onDobChange={handleDobChange}
        onSexChange={(v) => setChildForm((prev) => ({ ...prev, sex: prev.sex === v ? null : v }))}
        onBloodTypeChange={(v) =>
          setChildForm((prev) => ({
            ...prev,
            bloodType: prev.bloodType === v ? null : v,
          }))
        }
        onNotesChange={(v) => setChildForm((prev) => ({ ...prev, notes: v }))}
        onSave={saveChild}
        canDelete={childModalMode === "edit" && !!editingBaby}
        isPrimaryCaregiver={isPrimaryCaregiverForEditing}
        onDelete={openDeleteConfirm}
      />

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteConfirm}
      >
        <View style={styles.deleteBackdrop}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconCircle}>
              <Ionicons name="warning-outline" size={28} color="#D9534F" />
            </View>

            <Text style={styles.deleteTitle}>
              {isPrimaryCaregiverForEditing ? "Delete Child" : "Remove Access"}
            </Text>

            <Text style={styles.deleteBody}>
              {isPrimaryCaregiverForEditing
                ? `This will permanently delete ${editingBaby?.display_name ?? "this child"} and all related data (growth, vaccinations, invitations, and caregiver access). This cannot be undone.`
                : `You will lose access to ${editingBaby?.display_name ?? "this child"}. The primary caregiver can re-invite you later.`}
            </Text>

            {isPrimaryCaregiverForEditing && (
              <>
                <Text style={styles.deleteTypePrompt}>
                  Type <Text style={styles.deleteTypeName}>{editingBaby?.display_name}</Text> to confirm.
                </Text>
                <TextInput
                  value={deleteConfirmName}
                  onChangeText={setDeleteConfirmName}
                  placeholder="Child's name"
                  placeholderTextColor="#b2b8c3"
                  style={styles.deleteInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!childDeleting}
                />
              </>
            )}

            {childFeedback?.type === "error" && (
              <Text style={styles.deleteErrorText}>{childFeedback.message}</Text>
            )}

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={closeDeleteConfirm}
                disabled={childDeleting}
                activeOpacity={0.85}
              >
                <Text style={styles.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, childDeleting && { opacity: 0.6 }]}
                onPress={confirmDeleteChild}
                disabled={childDeleting}
                activeOpacity={0.85}
              >
                {childDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.deleteConfirmText}>
                    {isPrimaryCaregiverForEditing ? "Delete" : "Remove Access"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

type ChildEditModalProps = {
  visible: boolean;
  mode: ModalMode;
  form: ChildModalForm;
  saving: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
  onClose: () => void;
  onPickPhoto: () => void;
  onNameChange: (v: string) => void;
  onDobChange: (v: string) => void;
  onSexChange: (v: SexOption) => void;
  onBloodTypeChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onSave: () => void;
  canDelete?: boolean;
  isPrimaryCaregiver?: boolean;
  onDelete?: () => void;
};

function ChildEditModal({
  visible,
  mode,
  form,
  saving,
  feedback,
  onClose,
  onPickPhoto,
  onNameChange,
  onDobChange,
  onSexChange,
  onBloodTypeChange,
  onNotesChange,
  onSave,
  canDelete,
  isPrimaryCaregiver,
  onDelete,
}: ChildEditModalProps) {
  const insets = useSafeAreaInsets();
  const title = mode === "add" ? "Add Child" : "Edit Child";
  const subtitle =
    mode === "add"
      ? "Create a child profile with quick details"
      : "Update child information and photo";

  const shownPhoto = form.localPhotoUri || form.uploadedPhotoUri;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <LinearGradient
            colors={["#8DBCF1", "#79ADDF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHero}
          >
            <View style={styles.modalHeroCompactRow}>
              <View style={styles.modalHeroLeft}>
                <View style={styles.modalHeroIconWrap}>
                  <Ionicons name="person-outline" size={22} color="#FFFFFF" />
                </View>

                <View style={styles.modalHeroTextWrap}>
                  <Text style={styles.modalHeroTitleCompact}>{title}</Text>
                  <Text style={styles.modalHeroSubtitleCompact}>{subtitle}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.modalCloseButtonCompact}>
                <Ionicons name="close" size={22} color="#5F6E7E" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {feedback && (
              <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
                <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
                  {feedback.message}
                </Text>
              </View>
            )}

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>Photo</Text>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.photoPickerButton}
                onPress={onPickPhoto}
              >
                {shownPhoto ? (
                  <Image source={{ uri: shownPhoto }} style={styles.modalPhotoPreview} />
                ) : (
                  <View style={styles.photoPlaceholderInner}>
                    <Ionicons name="camera-outline" size={moderateScale(28)} color="#5F8FC8" />
                    <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                  </View>
                )}

                <View style={styles.photoBadge}>
                  <Ionicons name="camera" size={moderateScale(12)} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>
                Baby's Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                value={form.displayName}
                onChangeText={onNameChange}
                placeholder="e.g. Emma Johnson"
                placeholderTextColor="#9AA8B6"
                style={styles.modalInput}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>
                Date of Birth <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                value={form.dateOfBirth}
                onChangeText={onDobChange}
                placeholder="e.g. 2024-10-14"
                placeholderTextColor="#9AA8B6"
                style={styles.modalInput}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>Sex</Text>
              <View style={styles.modalChipWrap}>
                {(["male", "female"] as SexOption[]).map((s) => (
                  <TouchableOpacity
                    key={s as string}
                    onPress={() => onSexChange(s)}
                    activeOpacity={0.85}
                    style={[
                      styles.modalTypeChip,
                      form.sex === s && styles.modalTypeChipActive,
                    ]}
                  >
                    <Ionicons
                      name={s === "male" ? "male-outline" : "female-outline"}
                      size={moderateScale(14)}
                      color={form.sex === s ? "#fff" : "#5F8FC8"}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.modalTypeChipText,
                        form.sex === s && styles.modalTypeChipTextActive,
                      ]}
                    >
                      {s === "male" ? "Male" : "Female"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>Blood Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.modalChipRow}>
                  {BLOOD_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      onPress={() => onBloodTypeChange(bt)}
                      activeOpacity={0.85}
                      style={[
                        styles.modalTypeChip,
                        form.bloodType === bt && styles.modalTypeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalTypeChipText,
                          form.bloodType === bt && styles.modalTypeChipTextActive,
                        ]}
                      >
                        {bt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>Notes</Text>
              <TextInput
                value={form.notes}
                onChangeText={onNotesChange}
                placeholder="Any additional notes..."
                placeholderTextColor="#9AA8B6"
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.modalInputMultiline]}
              />
            </View>
          </ScrollView>

          {canDelete && onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              activeOpacity={0.85}
              style={styles.modalDeleteBtn}
            >
              <Ionicons name="trash-outline" size={moderateScale(18)} color="#D9534F" />
              <Text style={styles.modalDeleteBtnText}>
                {isPrimaryCaregiver ? "Delete Child" : "Remove My Access"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={[styles.modalFooter, { paddingBottom: Math.max(verticalScale(18), insets.bottom) }]}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
              style={[
                styles.modalSaveBtn,
                saving && styles.modalSaveBtnDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>
                  {mode === "add" ? "Add Child" : "Save Changes"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },

  heroWrap: {
    backgroundColor: "#8DBCF1",
    borderBottomLeftRadius: moderateScale(28),
    borderBottomRightRadius: moderateScale(28),
  },

  heroInner: {
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(18),
  },

  heroTextWrap: {
    paddingRight: scale(12),
  },

  heroTitle: {
    fontSize: moderateScale(24),
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.12)",
    textShadowRadius: 2,
  },

  heroSubtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(13),
    color: "#EDF6FF",
  },

  contentWrap: {
    flex: 1,
  },

  inner: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(110),
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: verticalScale(48),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.textInput,
  },

  menuButton: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: moderateScale(16),
    color: colors.textSubtitle,
  },

  errorText: {
    marginTop: 12,
    fontSize: moderateScale(16),
    color: colors.errorBorder,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },

  retryButtonText: {
    color: "#ffffff",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },

  emptyText: {
    marginTop: 12,
    fontSize: moderateScale(18),
    color: colors.textSubtitle,
    fontWeight: "600",
  },

  emptySubtext: {
    marginTop: 6,
    fontSize: moderateScale(14),
    color: "#b2b8c3",
    textAlign: "center",
  },

  scrollContent: {
    paddingBottom: verticalScale(60),
  },

  gridScrollContent: {
    paddingBottom: verticalScale(20),
  },

  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: CARD_RADIUS,
    marginBottom: verticalScale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },

  cardTopAccent: {
    height: verticalScale(8),
    backgroundColor: "#8DBCF1",
  },

  cardImage: {
    width: "100%",
    height: verticalScale(160),
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
    gap: scale(8),
  },

  nameLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  childName: {
    fontSize: moderateScale(22),
    color: colors.textSubtitle,
    fontWeight: "800",
  },

  genderIcon: {
    marginRight: 6,
  },

  agePill: {
    backgroundColor: "#EEF5FD",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
  },

  agePillText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#4F8DD4",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },

  dateText: {
    marginLeft: 4,
    fontSize: moderateScale(13),
    color: "#74879B",
  },

  infoChipRow: {
    flexDirection: "row",
    gap: scale(8),
    marginBottom: verticalScale(12),
  },

  infoChip: {
    flex: 1,
    backgroundColor: "#F4F8FC",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    minHeight: verticalScale(50),
  },

  infoChipLabel: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#7A8B9C",
    marginBottom: verticalScale(4),
  },

  infoChipValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#4E5F72",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(10),
    justifyContent: "space-between",
  },

  viewButtonTap: {
    flex: 1,
    marginRight: 10,
  },

  viewButton: {
    height: verticalScale(42),
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  viewButtonText: {
    fontSize: moderateScale(15),
    color: "#ffffff",
    fontWeight: "700",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: "#f1f3f8",
  },

  editText: {
    fontSize: moderateScale(14),
    color: "#4f6175",
    fontWeight: "600",
  },

  twoUpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(18),
    marginBottom: verticalScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },

  twoUpImage: {
    width: "100%",
    height: verticalScale(94),
  },

  twoUpBody: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(9),
  },

  twoUpName: {
    fontSize: moderateScale(15),
    color: colors.textSubtitle,
    fontWeight: "800",
  },

  twoUpTopMeta: {
    marginTop: verticalScale(4),
  },

  twoUpAge: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF5FD",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    fontSize: moderateScale(9.5),
    fontWeight: "800",
    color: "#4F8DD4",
  },

  twoUpDateRow: {
    marginTop: verticalScale(7),
    flexDirection: "row",
    alignItems: "center",
  },

  twoUpDateText: {
    marginLeft: scale(4),
    fontSize: moderateScale(10.5),
    color: "#74879B",
    flex: 1,
  },

  twoUpInfoList: {
    marginTop: verticalScale(8),
    backgroundColor: "#F5F8FC",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(7),
  },

  twoUpInfoLine: {
    fontSize: moderateScale(10),
    color: "#5D6B79",
    marginBottom: verticalScale(2),
  },

  twoUpInfoLabel: {
    fontWeight: "800",
    color: "#4C6075",
  },

  twoUpActionsRow: {
    marginTop: verticalScale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(8),
  },

  twoUpIconButtonPrimary: {
    flex: 1,
    height: verticalScale(34),
    borderRadius: moderateScale(18),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  twoUpIconButtonSecondary: {
    flex: 1,
    height: verticalScale(34),
    borderRadius: moderateScale(18),
    backgroundColor: "#f1f3f8",
    alignItems: "center",
    justifyContent: "center",
  },

  compactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
    minHeight: verticalScale(145),
  },

  compactCardSelected: {
    borderColor: "#7FB2EF",
    backgroundColor: "#F3F8FF",
    shadowOpacity: 0.14,
    elevation: 4,
  },

  compactAccent: {
    height: verticalScale(6),
    backgroundColor: "#D9E8F8",
  },

  compactAccentSelected: {
    backgroundColor: "#8DBCF1",
  },

  compactImage: {
    width: "100%",
    height: verticalScale(68),
  },

  compactBody: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(8),
  },

  compactName: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    color: "#516274",
  },

  compactNameSelected: {
    color: "#3E73B1",
  },

  compactSub: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(9),
    color: "#7D8C99",
  },

  compactMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(6),
    gap: scale(4),
  },

  compactMetaText: {
    fontSize: moderateScale(8.5),
    color: "#7E8B99",
    flex: 1,
  },

  dismissOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  bottomSheet: {
    position: "absolute",
    left: scale(5),
    right: scale(5),
    bottom: -verticalScale(52),
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: moderateScale(26),
    borderTopRightRadius: moderateScale(26),
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 20,
    minHeight: verticalScale(420),
    zIndex: 20,
  },

  bottomSheetHandle: {
    width: scale(44),
    height: verticalScale(5),
    borderRadius: moderateScale(10),
    backgroundColor: "#D2D8DF",
    alignSelf: "center",
    marginBottom: verticalScale(12),
  },

  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: scale(10),
  },

  bottomSheetTitle: {
    fontSize: moderateScale(20),
    fontWeight: "900",
    color: "#526274",
  },

  bottomSheetSubtitle: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(12),
    color: "#8291A0",
  },

  bottomSheetSexPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF5FD",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(7),
  },

  bottomSheetSexText: {
    marginLeft: scale(5),
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#4F8DD4",
  },

  bottomInfoRow: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: verticalScale(14),
  },

  bottomInfoCard: {
    flex: 1,
    backgroundColor: "#F5F8FC",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
  },

  bottomGuardianCard: {
    marginTop: verticalScale(10),
    backgroundColor: "#F5F8FC",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
  },

  bottomInfoLabel: {
    fontSize: moderateScale(11),
    color: "#7A8B9C",
    fontWeight: "800",
    marginBottom: verticalScale(4),
  },

  bottomInfoValue: {
    fontSize: moderateScale(14),
    color: "#4E5F72",
    fontWeight: "700",
  },

  bottomActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(14),
    justifyContent: "space-between",
  },

  bottomViewButton: {
    flex: 1,
    marginRight: 10,
    height: verticalScale(42),
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },

  bottomViewButtonText: {
    fontSize: moderateScale(15),
    color: "#ffffff",
    fontWeight: "700",
  },

  bottomEditButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: "#f1f3f8",
  },

  bottomEditText: {
    fontSize: moderateScale(14),
    color: "#4f6175",
    fontWeight: "600",
  },

  fab: {
    position: "absolute",
    right: scale(20),
    zIndex: 30,
  },

  fabInner: {
    width: moderateScale(62),
    height: moderateScale(62),
    borderRadius: moderateScale(31),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },

  feedbackSuccess: {
    backgroundColor: colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.successBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: scale(10),
    marginTop: verticalScale(10),
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
    marginHorizontal: scale(10),
    marginTop: verticalScale(10),
  },

  feedbackErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.errorDark,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
  },

  modalCard: {
    maxHeight: "92%",
    backgroundColor: "#F7FAFC",
    borderTopLeftRadius: moderateScale(26),
    borderTopRightRadius: moderateScale(26),
    overflow: "hidden",
  },

  modalHero: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(14),
  },

  modalHeroCompactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
  },

  modalHeroLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  modalHeroIconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(10),
  },

  modalHeroTextWrap: {
    flex: 1,
  },

  modalHeroTitleCompact: {
    fontSize: moderateScale(18),
    fontWeight: "900",
    color: "#FFFFFF",
  },

  modalHeroSubtitleCompact: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(12),
    color: "#EDF6FF",
  },

  modalCloseButtonCompact: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "#F3F6F9",
    alignItems: "center",
    justifyContent: "center",
  },

  modalScrollContent: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(14),
  },

  modalSectionCard: {
    backgroundColor: "#EEF4F8",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(10),
  },

  modalSectionLabel: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#5F6E7E",
    marginBottom: verticalScale(8),
  },

  requiredStar: {
    color: "#E35D5B",
  },

  modalChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },

  modalChipRow: {
    flexDirection: "row",
    gap: scale(8),
    alignItems: "center",
  },

  modalTypeChip: {
    minHeight: verticalScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    borderColor: "#BDD0E3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(14),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  modalTypeChipActive: {
    backgroundColor: "#8DBCF1",
    borderColor: "#8DBCF1",
  },

  modalTypeChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#5F6E7E",
  },

  modalTypeChipTextActive: {
    color: "#FFFFFF",
  },

  modalInput: {
    minHeight: verticalScale(46),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#C8D3DD",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(12),
    fontSize: moderateScale(14),
    color: "#444444",
  },

  modalInputMultiline: {
    minHeight: verticalScale(96),
    paddingTop: verticalScale(12),
    textAlignVertical: "top",
  },

  photoPickerButton: {
    alignSelf: "center",
    width: moderateScale(116),
    height: moderateScale(116),
    borderRadius: moderateScale(58),
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#BDD0E3",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  modalPhotoPreview: {
    width: "100%",
    height: "100%",
  },

  photoPlaceholderInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(8),
  },

  photoPlaceholderText: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#5F8FC8",
    textAlign: "center",
  },

  photoBadge: {
    position: "absolute",
    bottom: scale(4),
    right: scale(4),
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "#8DBCF1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  modalFooter: {
    flexDirection: "row",
    gap: scale(10),
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(18),
    backgroundColor: "#EEF4F8",
  },

  modalCancelBtn: {
    flex: 1,
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#E6EBF0",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#66717C",
  },

  modalSaveBtn: {
    flex: 1.35,
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#8DBCF1",
    alignItems: "center",
    justifyContent: "center",
  },

  modalSaveBtnDisabled: {
    backgroundColor: "#B8C7D6",
  },

  modalSaveBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    color: "#FFFFFF",
  },

  modalDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    marginHorizontal: scale(14),
    marginTop: verticalScale(2),
    marginBottom: verticalScale(6),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: "#F5C6C6",
    backgroundColor: "#FFF0F0",
  },

  modalDeleteBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#D9534F",
  },

  deleteBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(22),
  },

  deleteCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(20),
    padding: scale(20),
    alignItems: "stretch",
  },

  deleteIconCircle: {
    alignSelf: "center",
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(10),
  },

  deleteTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#2F3A48",
    textAlign: "center",
    marginBottom: verticalScale(8),
  },

  deleteBody: {
    fontSize: moderateScale(13),
    color: "#5B6775",
    lineHeight: moderateScale(19),
    textAlign: "center",
    marginBottom: verticalScale(14),
  },

  deleteTypePrompt: {
    fontSize: moderateScale(12),
    color: "#5B6775",
    textAlign: "center",
    marginBottom: verticalScale(6),
  },

  deleteTypeName: {
    fontWeight: "800",
    color: "#2F3A48",
  },

  deleteInput: {
    borderWidth: 1,
    borderColor: "#D0D7E0",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(14),
    color: "#2F3A48",
    backgroundColor: "#F8FAFC",
    marginBottom: verticalScale(10),
  },

  deleteErrorText: {
    fontSize: moderateScale(12),
    color: "#D9534F",
    textAlign: "center",
    marginBottom: verticalScale(6),
  },

  deleteActions: {
    flexDirection: "row",
    gap: scale(10),
    marginTop: verticalScale(6),
  },

  deleteCancelBtn: {
    flex: 1,
    minHeight: verticalScale(46),
    borderRadius: moderateScale(14),
    backgroundColor: "#E6EBF0",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteCancelText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#66717C",
  },

  deleteConfirmBtn: {
    flex: 1,
    minHeight: verticalScale(46),
    borderRadius: moderateScale(14),
    backgroundColor: "#D9534F",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteConfirmText: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
