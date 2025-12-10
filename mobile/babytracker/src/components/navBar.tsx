import React from "react";
import { View, TouchableOpacity, StyleSheet, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const guidelineBaseWidth = 360;
const scale = (size: number) => (width / guidelineBaseWidth) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

type TabKey = "home" | "list" | "stats" | "children" | "settings";

type Props = {
  navigation: any;
  activeTab: TabKey;
};

export default function Navbar({ navigation, activeTab }: Props) {
  const goTo = (tab: TabKey) => {
    if (tab === "home") navigation.navigate("Home");
    if (tab === "list") navigation.navigate("Tasks");
    if (tab === "stats") navigation.navigate("Stats");
    if (tab === "children") navigation.navigate("Children");
    if (tab === "settings") navigation.navigate("Settings");
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.8}
          onPress={() => goTo("home")}
        >
          <Ionicons
            name="home-outline"
            size={moderateScale(22)}
            color="#4f6175"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.8}
          onPress={() => goTo("list")}
        >
          <Ionicons
            name="list-outline"
            size={moderateScale(22)}
            color="#4f6175"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.8}
          onPress={() => goTo("stats")}
        >
          <Ionicons
            name="bar-chart-outline"
            size={moderateScale(22)}
            color="#4f6175"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.childrenButtonTap}
          activeOpacity={0.9}
          onPress={() => goTo("children")}
        >
          <LinearGradient
            colors={
              activeTab === "children"
                ? ["#8ec6ff", "#81b6eb"]
                : ["#ffffff", "#ffffff"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.childrenButton,
              activeTab !== "children" && styles.childrenButtonInactive,
            ]}
          >
            <Ionicons
              name="people-outline"
              size={moderateScale(18)}
              color={activeTab === "children" ? "#ffffff" : "#4f6175"}
            />
            <Text
              style={[
                styles.childrenLabel,
                activeTab !== "children" && styles.childrenLabelInactive,
              ]}
            >
              Children
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.8}
          onPress={() => goTo("settings")}
        >
          <Ionicons
            name="settings-outline"
            size={moderateScale(22)}
            color="#4f6175"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const NAV_HEIGHT = 70;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: width * 0.94,
    height: NAV_HEIGHT,
    borderRadius: 28,
    backgroundColor: "#e7f3ff",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  childrenButtonTap: {
    flex: 1,
    marginHorizontal: 6,
  },
  childrenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 24,
    shadowColor: "#81b6eb",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  childrenButtonInactive: {
    shadowOpacity: 0,
    elevation: 0,
  },
  childrenLabel: {
    marginLeft: 8,
    fontSize: moderateScale(14),
    color: "#ffffff",
    fontFamily: "Quicksand",
    fontWeight: "700",
  },
  childrenLabelInactive: {
    color: "#4f6175",
  },
});
