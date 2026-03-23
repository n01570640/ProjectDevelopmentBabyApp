import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const guidelineBaseWidth = 360;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type TabKey = "home" | "tasks" | "schedule" | "stats" | "children" | "profile";

type Props = {
  navigation: any;
  activeTab: TabKey;
};

export default function NavBar({ navigation, activeTab }: Props) {
  const insets = useSafeAreaInsets(); //account for andriod systems bar
  const handlePress = (tab: TabKey) => {
    switch (tab) {
      case "home":
        navigation.navigate("Children");
        break;
      case "tasks":
        navigation.navigate("Children");
        break;
      case "schedule":
        navigation.navigate("Schedule");
        break;
      case "stats":
        navigation.navigate("Children");
        break;
      case "children":
        navigation.navigate("Children");
        break;
      case "profile":
        navigation.navigate("Profile");
        break;
      default:
        break;
    }
  };

  const renderTab = (tab: TabKey, iconName: any, label: string) => {
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        key={tab}
        onPress={() => handlePress(tab)}
        activeOpacity={0.85}
        style={[
          styles.tabButton,
          isActive ? styles.tabButtonActive : styles.tabButtonInactive,
          !isActive && styles.tabButtonIconOnly,
        ]}
      >
        <Ionicons
          name={iconName}
          size={moderateScale(20)}
          color={isActive ? "#ffffff" : "#444444"}
        />
        {isActive && <Text style={styles.tabLabel}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#f2fcff", "#e7f3ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.navBackground , { height: NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}
    >
      <View style={styles.navInner}>
        {renderTab("home", "home-outline", "Home")}
        {renderTab("children", "people-outline", "Babies")}
        {renderTab("schedule", "calendar-outline", "Schedule")}
        {renderTab("profile", "person-circle-outline", "Profile")}
      </View>
    </LinearGradient>
  );
}

const NAV_HEIGHT = 80;

const styles = StyleSheet.create({
  navBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: NAV_HEIGHT,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  navInner: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100, // canva-style round rect
    height: 46,
    paddingHorizontal: 18,
  },
  tabButtonIconOnly: {
    width: 46,
    paddingHorizontal: 0,
  },
  tabButtonInactive: {
    backgroundColor: "#dddddd", // grey icon-only buttons
  },
  tabButtonActive: {
    backgroundColor: "#81b6eb", // blue popped-out pill
    shadowColor: "#81b6eb",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 4,
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    color: "#ffffff",
    fontWeight: "700",
  },
});
