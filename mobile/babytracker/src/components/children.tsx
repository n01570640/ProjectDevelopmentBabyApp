import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NavBar from "./navBar";

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

type ChildProfile = {
  id: number;
  name: string;
  gender: "male" | "female";
  birthDate: string;
  heightCm: number;
  heightFt: string;
  weightKg: number;
  weightLbs: string;
  guardian: string;
  image: any;
};

const childrenData: ChildProfile[] = [
  {
    id: 1,
    name: "Charlie",
    gender: "male",
    birthDate: "October 14, 2024",
    heightCm: 35,
    heightFt: "1.78 ft",
    weightKg: 10.7,
    weightLbs: "22.5 lbs",
    guardian: "Layla Nguyen",
    image: require("../images/children/charlie.jpg"),
  },
  {
    id: 2,
    name: "Michael",
    gender: "male",
    birthDate: "May 8, 2024",
    heightCm: 55,
    heightFt: "2.87 ft",
    weightKg: 15.6,
    weightLbs: "33.2 lbs",
    guardian: "Layla Nguyen",
    image: require("../images/children/michael.png"),
  },
];

export default function Children({ navigation }: Props) {
  return (
    <View style={[styles.container, { backgroundColor: "#ffffff" }]}>
      <View style={styles.inner}>
        
        {/* Search Row */}
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

        {/* Card List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {childrenData.map((child) => (
            <View key={child.id} style={styles.card}>
              <Image
                source={child.image}
                style={styles.cardImage}
                resizeMode="cover"
              />

              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <View style={styles.nameLeft}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Ionicons
                      name={
                        child.gender === "male"
                          ? "male-outline"
                          : "female-outline"
                      }
                      size={moderateScale(20)}
                      color="#57a8f8"
                      style={styles.genderIcon}
                    />
                  </View>

                  <View style={styles.dateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={moderateScale(16)}
                      color="#606162"
                    />
                    <Text style={styles.dateText}>{child.birthDate}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Height: </Text>
                  <Text style={styles.detailValue}>
                    {child.heightCm}cm, {child.heightFt}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Weight: </Text>
                  <Text style={styles.detailValue}>
                    {child.weightKg} kg, {child.weightLbs}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Guardian: </Text>
                  <Text style={styles.detailValue}>{child.guardian}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.viewButtonTap}
                    onPress={() =>
                      navigation.navigate("ChildDetails", { id: child.id })
                    }
                  >
                    <View style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>View information</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("EditChild", { id: child.id })
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

        {/* Floating Add Button */}
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

      <NavBar navigation={navigation} activeTab="children" />
    </View>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingTop: verticalScale(40),
    paddingHorizontal: width * 0.05,
    paddingBottom: verticalScale(90),
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
    paddingBottom: verticalScale(40),
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
    bottom: verticalScale(110),
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
