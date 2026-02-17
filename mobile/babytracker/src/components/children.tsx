import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NavBar from "./navBar";
import { getBabies } from "../../services/babyService";

const { width, height } = Dimensions.get("window");

const guidelineBaseWidth = 360;
const guidelineBaseHeight = 800;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type Props = {
  navigation: any;
};

// =============================================================================
// OLD HARDCODED DATA - COMMENTED OUT (keeping for reference)
// =============================================================================
// type ChildProfile = {
//   id: number;
//   name: string;
//   gender: "male" | "female";
//   birthDate: string;
//   heightCm: number;
//   heightFt: string;
//   weightKg: number;
//   weightLbs: string;
//   guardian: string;
//   image: any;
// };

// const childrenData: ChildProfile[] = [
//   {
//     id: 1,
//     name: "Charlie",
//     gender: "male",
//     birthDate: "October 14, 2024",
//     heightCm: 35,
//     heightFt: "1.78 ft",
//     weightKg: 10.7,
//     weightLbs: "22.5 lbs",
//     guardian: "Layla Nguyen",
//     image: require("../images/children/charlie.jpg"),
//   },
//   {
//     id: 2,
//     name: "Michael",
//     gender: "male",
//     birthDate: "May 8, 2024",
//     heightCm: 55,
//     heightFt: "2.87 ft",
//     weightKg: 15.6,
//     weightLbs: "33.2 lbs",
//     guardian: "Layla Nguyen",
//     image: require("../images/children/michael.png"),
//   },
// ];
// =============================================================================

// NEW: Type matching API response (BabyWithDetailsDTO)
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

// Helper functions for unit conversion
const cmToFeet = (cm: number | null): string => {
  if (cm === null) return "N/A";
  return (cm / 30.48).toFixed(2) + " ft";
};

const kgToLbs = (kg: number | null): string => {
  if (kg === null) return "N/A";
  return (kg * 2.205).toFixed(1) + " lbs";
};

// Format date for display (e.g., "2024-10-14" -> "October 14, 2024")
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

// Placeholder image for babies without photos
const placeholderImage = require("../images/children/charlie.jpg");

export default function Children({ navigation }: Props) {
  // State for API data
  const [babies, setBabies] = useState<BabyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch babies on mount
  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBabies();

      if (response.success) {
        setBabies(response.data || []);
      } else {
        setError(response.message || "Failed to load children");
      }
    } catch (err: any) {
      console.error("Error fetching babies:", err);
      setError("Failed to load children. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* Search row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchLabel}>Search:</Text>
            <TextInput
              placeholder=""
              style={styles.searchInput}
              placeholderTextColor="#b2b8c3"
            />
          </View>

          <TouchableOpacity style={styles.menuButton} activeOpacity={0.8}>
            <Ionicons
              name="menu-outline"
              size={moderateScale(24)}
              color="#4f6175"
            />
          </TouchableOpacity>
        </View>

        {/* Loading state */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#81b6eb" />
            <Text style={styles.loadingText}>Loading children...</Text>
          </View>
        )}

        {/* Error state */}
        {!loading && error && (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchBabies}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && babies.length === 0 && (
          <View style={styles.centerContainer}>
            <Ionicons name="people-outline" size={48} color="#b2b8c3" />
            <Text style={styles.emptyText}>No children added yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first child
            </Text>
          </View>
        )}

        {/* Cards - Now using API data */}
        {!loading && !error && babies.length > 0 && (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {babies.map((baby) => (
              <View key={baby.baby_id} style={styles.card}>
                <Image source={placeholderImage} style={styles.cardImage} />

                <View style={styles.cardBody}>
                  {/* Name + date */}
                  <View style={styles.nameRow}>
                    <View style={styles.nameLeft}>
                      <Text style={styles.childName}>{baby.display_name}</Text>
                      {baby.sex && (
                        <Ionicons
                          name={
                            baby.sex === "male"
                              ? "male-outline"
                              : "female-outline"
                          }
                          size={moderateScale(20)}
                          color="#57a8f8"
                          style={styles.genderIcon}
                        />
                      )}
                    </View>

                    <View style={styles.dateRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={moderateScale(16)}
                        color="#606162"
                      />
                      <Text style={styles.dateText}>
                        {formatBirthDate(baby.date_of_birth)}
                      </Text>
                    </View>
                  </View>

                  {/* Details - Using latest_growth from API */}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Height: </Text>
                    <Text style={styles.detailValue}>
                      {baby.latest_growth?.length_cm
                        ? `${baby.latest_growth.length_cm}cm, ${cmToFeet(baby.latest_growth.length_cm)}`
                        : "Not recorded"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Weight: </Text>
                    <Text style={styles.detailValue}>
                      {baby.latest_growth?.weight_kg
                        ? `${baby.latest_growth.weight_kg} kg, ${kgToLbs(baby.latest_growth.weight_kg)}`
                        : "Not recorded"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guardian: </Text>
                    <Text style={styles.detailValue}>
                      {baby.primary_caregiver_name || "Not assigned"}
                    </Text>
                  </View>

                  {/* Buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={styles.viewButtonTap}
                      onPress={() =>
                        navigation.navigate("ChildDetails", { id: baby.baby_id })
                      }
                    >
                      <View style={styles.viewButton}>
                        <Text style={styles.viewButtonText}>
                          View information
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editButton}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate("EditChild", { id: baby.baby_id })
                      }
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
            ))}
          </ScrollView>
        )}

        {/* FAB */}
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

      {/* Baked-in navbar */}
      <NavBar navigation={navigation} activeTab="children" />
    </View>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  inner: {
    flex: 1,
    paddingTop: verticalScale(40),
    paddingHorizontal: width * 0.05,
    paddingBottom: verticalScale(110), // space above navbar
  },
  // Loading, Error, Empty states
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: moderateScale(16),
    color: "#606162",
  },
  errorText: {
    marginTop: 12,
    fontSize: moderateScale(16),
    color: "#ff6b6b",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#81b6eb",
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
    color: "#606162",
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 6,
    fontSize: moderateScale(14),
    color: "#b2b8c3",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchLabel: {
    fontSize: moderateScale(14),
    color: "#606162",
    marginRight: 6,
    fontWeight: "700",
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: "#2c2c2c",
  },
  menuButton: {
    marginLeft: 10,
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: verticalScale(60),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: CARD_RADIUS,
    marginBottom: verticalScale(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
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
    marginBottom: verticalScale(6),
  },
  nameLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  childName: {
    fontSize: moderateScale(22),
    color: "#606162",
    fontWeight: "700",
  },
  genderIcon: {
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 4,
    fontSize: moderateScale(13),
    color: "#606162",
  },
  detailRow: {
    flexDirection: "row",
    marginTop: verticalScale(2),
  },
  detailLabel: {
    fontSize: moderateScale(14),
    color: "#606162",
    fontWeight: "700",
  },
  detailValue: {
    fontSize: moderateScale(14),
    color: "#606162",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(12),
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
    backgroundColor: "#81b6eb",
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
  fab: {
    position: "absolute",
    right: width * 0.08,
    bottom: verticalScale(130),
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#81b6eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#81b6eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
});
