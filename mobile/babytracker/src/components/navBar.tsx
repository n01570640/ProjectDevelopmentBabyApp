import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { scale, moderateScale } from "../utils/responsive";
import { colors } from '../theme/colors';

type TabConfig = {
  routeName: string;
  icon: string;
  label: string;
};

const TABS: TabConfig[] = [
  { routeName: "ChildrenTab", icon: "people-outline", label: "Babies" },
  { routeName: "ScheduleTab", icon: "calendar-outline", label: "Schedule" },
  { routeName: "StatisticsTab", icon: "stats-chart-outline", label: "Statistics" },
  { routeName: "ProfileTab", icon: "person-circle-outline", label: "Profile" },
];

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routeNames[state.index];

  const handlePress = (routeName: string) => {
    if (routeName) navigation.navigate(routeName);
  };

  const renderTab = (tab: TabConfig, index: number) => {
    const isActive = tab.routeName !== "" && activeRouteName === tab.routeName;

    return (
      <TouchableOpacity
        key={`tab-${index}`}
        onPress={() => handlePress(tab.routeName)}
        activeOpacity={0.85}
        style={[
          styles.tabButton,
          isActive ? styles.tabButtonActive : styles.tabButtonInactive,
          !isActive && styles.tabButtonIconOnly,
        ]}
      >
        <Ionicons
          name={tab.icon as any}
          size={moderateScale(20)}
          color={isActive ? "#ffffff" : "#444444"}
        />
        {isActive && <Text style={styles.tabLabel}>{tab.label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={["#f2fcff", "#e7f3ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.navBackground, { height: NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}
    >
      <View style={styles.navInner}>
        {TABS.map((tab, i) => renderTab(tab, i))}
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
    borderRadius: 100,
    height: 46,
    paddingHorizontal: 18,
  },
  tabButtonIconOnly: {
    width: 46,
    paddingHorizontal: 0,
  },
  tabButtonInactive: {
    backgroundColor: colors.inactive,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
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
