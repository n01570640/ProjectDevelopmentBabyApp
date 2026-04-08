import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { store } from "./src/store";
import * as Notifications from "expo-notifications";

// Show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import Landing from "./src/components/landing";
import Login from "./src/components/login";
import Register from "./src/components/register";
import Children from "./src/components/children";
import ProfileScreen from "./src/components/ProfileScreen";
import HistoryScreen from "./src/components/HistoryScreen";
import ScheduleScreen from "./src/components/ScheduleScreen";
import StatisticsScreen from "./src/components/StatisticsScreen";
import AddChildScreen from "./src/components/AddChildScreen";
import BabyDetailScreen from "./src/components/BabyDetailScreen";
import AcceptInvitationScreen from "./src/components/AcceptInvitationScreen";
import CustomTabBar from "./src/components/navBar";
import ProfileHomeScreen from "./src/components/ProfileHomeScreen"; //import


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const linking = {
  prefixes: ["babytracker://"],
  config: {
    screens: {
      AcceptInvitation: "invitations/:token",
    },
  },
};

const screenOptions = { headerShown: false };

// ── Tab stacks (screens within each tab) ────────────────────────

function ChildrenStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ChildrenHome" component={Children} />
      <Stack.Screen name="BabyDetail" component={BabyDetailScreen} />
      <Stack.Screen name="AddChild" component={AddChildScreen} />
    </Stack.Navigator>
  );
}

function ScheduleStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ScheduleHome" component={ScheduleScreen} />
    </Stack.Navigator>
  );
}

function StatisticsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="StatisticsHome" component={StatisticsScreen} />
    </Stack.Navigator>
  );
}

//changed to add new profile home
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="BabyDetail" component={BabyDetailScreen} />
      <Stack.Screen name="AddChild" component={AddChildScreen} />
    </Stack.Navigator>
  );
}

// ── Main tabs (bottom tab navigator) ────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={screenOptions}
    >
      <Tab.Screen name="ChildrenTab" component={ChildrenStack} />
      <Tab.Screen name="ScheduleTab" component={ScheduleStack} />
      <Tab.Screen name="StatisticsTab" component={StatisticsStack} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} />
    </Tab.Navigator>
  );
}

// ── Root navigator (auth + main app) ────────────────────────────

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator initialRouteName="Landing" screenOptions={screenOptions}>
            <Stack.Screen name="Landing" component={Landing} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={Register} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="AcceptInvitation" component={AcceptInvitationScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}
