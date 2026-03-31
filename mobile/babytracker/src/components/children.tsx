import React, { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchBabies } from "../store/slices/babiesSlice";
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
  blood_type: string | null;
  notes: string | null;
  created_at: string;
  access_role: string;
  can_edit_health: boolean;
  can_edit_activities: boolean;
  can_share: boolean;
  latest_growth: LatestGrowth | null;
  primary_caregiver_name: string | null;
};

type LayoutMode = 1 | 2 | 4;

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

  useEffect(() => {
    const inviteMessage = route?.params?.inviteMessage;
    if (inviteMessage) {
      setFeedback(inviteMessage);
      setTimeout(() => setFeedback(null), 3000);
      navigation.setParams({ inviteMessage: undefined });
    }
  }, [route?.params?.inviteMessage]);

  useEffect(() => {
    dispatch(fetchBabies());
  }, [dispatch]);

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

  const renderLargeCard = (baby: BabyProfile) => {
    return (
      <View key={baby.baby_id} style={styles.card}>
        <View style={styles.cardTopAccent} />

        <Image source={placeholderImage} style={styles.cardImage} />

        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <View style={styles.nameLeft}>
              <Text style={styles.childName}>{baby.display_name}</Text>
              {baby.sex && (
                <Ionicons
                  name={baby.sex === "male" ? "male-outline" : "female-outline"}
                  size={moderateScale(20)}
                  color="#5F8FC8"
                  style={styles.genderIcon}
                />
              )}
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
              onPress={() => navigation.navigate("EditChild", { id: baby.baby_id })}
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

    return (
      <View key={baby.baby_id} style={[styles.twoUpCard, { width: cardWidth }]}>
        <View style={styles.cardTopAccent} />

        <Image source={placeholderImage} style={styles.twoUpImage} />

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
              onPress={() => navigation.navigate("EditChild", { id: baby.baby_id })}
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

    return (
      <TouchableOpacity
        key={baby.baby_id}
        activeOpacity={0.9}
        style={[
          styles.compactCard,
          { width: cardWidth },
          isSelected && styles.compactCardSelected,
        ]}
        onPress={() =>
          setSelectedGridBabyId((prev) => (prev === baby.baby_id ? null : baby.baby_id))
        }
      >
        <View style={[styles.compactAccent, isSelected && styles.compactAccentSelected]} />

        <Image source={placeholderImage} style={styles.compactImage} />

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

      <Pressable
        style={styles.contentWrap}
        onPress={() => {
          if (layoutMode === 4 && selectedGridBabyId !== null) {
            setSelectedGridBabyId(null);
          }
        }}
      >
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
                name={getLayoutIcon(layoutMode)}
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
                  onPress={() =>
                    navigation.navigate("EditChild", { id: selectedGridBaby.baby_id })
                  }
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
            style={styles.fab}
            activeOpacity={0.9}
            onPress={() => navigation.navigate("AddChild")}
          >
            <View style={styles.fabInner}>
              <Ionicons name="add" size={moderateScale(30)} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </Pressable>
    </View>
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
    marginLeft: 4,
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
    right: width * 0.08,
    bottom: verticalScale(130),
  },

  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },

  feedbackSuccess: {
    backgroundColor: colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.successBorder,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(10),
  },

  feedbackSuccessText: {
    fontSize: moderateScale(13),
    fontWeight: "500" as const,
    color: colors.successDark,
  },

  feedbackError: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.errorBorder,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(10),
    marginBottom: verticalScale(10),
  },

  feedbackErrorText: {
    fontSize: moderateScale(13),
    fontWeight: "500" as const,
    color: colors.errorDark,
  },
});