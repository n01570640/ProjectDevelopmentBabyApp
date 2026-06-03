import React, { useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "../utils/responsive";
import { colors } from "../theme/colors";

type TabConfig = {
  routeName: string;
  icon: string;
  label: string;
};

const TABS: TabConfig[] = [
  { routeName: "HomeTab", icon: "home-outline", label: "Home" },
  { routeName: "BabiesTab", icon: "people-outline", label: "Babies" },
  { routeName: "ScheduleTab", icon: "calendar-outline", label: "Schedule" },
  { routeName: "StatisticsTab", icon: "stats-chart-outline", label: "Statistics" },
  { routeName: "ProfileTab", icon: "person-circle-outline", label: "Profile" },
];

const NAV_HEIGHT = 80;
const TAB_HEIGHT = 46;
const INACTIVE_WIDTH = 46;
const ACTIVE_WIDTH = 118;

function AnimatedTab({
  tab,
  index,
  activeRouteName,
  onPress,
}: {
  tab: TabConfig;
  index: number;
  activeRouteName: string;
  onPress: (routeName: string) => void;
}) {
  const isActive = tab.routeName !== "" && activeRouteName === tab.routeName;
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isActive ? 1 : 0,
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, isActive]);

  const labelPadding = moderateScale(8);
  const estimatedLabelWidth = moderateScale(8) * tab.label.length;
  const activeWidthMinimums: Record<string, number> = {
    HomeTab: 98,
    BabiesTab: 108,
    ScheduleTab: 118,
    StatisticsTab: 98,
    ProfileTab: 98,
  };
  const minimumActiveWidth = activeWidthMinimums[tab.routeName] ?? ACTIVE_WIDTH;
  const targetActiveWidth = Math.max(
    minimumActiveWidth,
    40 + estimatedLabelWidth + labelPadding
  );
  const animatedWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [INACTIVE_WIDTH, targetActiveWidth],
  });

  const labelOpacity = anim.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });

  const labelWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, estimatedLabelWidth + labelPadding],
  });

  const labelMarginLeft = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, labelPadding],
  });

  const labelTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <TouchableOpacity
      key={`tab-${index}`}
      onPress={() => onPress(tab.routeName)}
      activeOpacity={0.85}
    >
      <Animated.View
        style={[
          styles.tabButton,
          isActive ? styles.tabButtonActive : styles.tabButtonInactive,
          { width: animatedWidth },
        ]}
      >
        <Animated.View
          style={[
            styles.tabContent,
            isActive ? styles.tabContentActive : styles.tabContentInactive,
          ]}
        >
          <Ionicons
            name={tab.icon as any}
            size={moderateScale(20)}
            color={isActive ? "#ffffff" : "#444444"}
          />

          <Animated.View
            style={[
              styles.labelWrap,
              {
                width: labelWidth,
                marginLeft: labelMarginLeft,
                opacity: labelOpacity,
                transform: [{ translateX: labelTranslateX }],
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.tabLabel} numberOfLines={1}>
              {tab.label}
            </Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routeNames[state.index];

  const handlePress = (routeName: string) => {
    if (routeName) navigation.navigate(routeName);
  };

  return (
    <LinearGradient
      colors={["#f2fcff", "#e7f3ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.navBackground,
        {
          height: NAV_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.navInner}>
        {TABS.map((tab, i) => (
          <AnimatedTab
            key={`tab-${i}`}
            tab={tab}
            index={i}
            activeRouteName={activeRouteName}
            onPress={handlePress}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  navBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
    height: TAB_HEIGHT,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  tabContentInactive: {
    justifyContent: "center",
  },
  tabContentActive: {
    justifyContent: "flex-start",
    paddingLeft: 12,
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
  labelWrap: {
    overflow: "hidden",
  },
  tabLabel: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(18),
    color: "#ffffff",
    fontWeight: "700",
  },
});