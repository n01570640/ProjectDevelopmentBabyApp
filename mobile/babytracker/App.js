import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import Children from "./src/components/children"; // 👈 lowercase filename, default export is Children
import ProfileScreen from "./src/components/ProfileScreen";
import HistoryScreen from "./src/components/HistoryScreen";
import ScheduleScreen from "./src/components/ScheduleScreen";
import AddChildScreen from "./src/components/AddChildScreen";
import BabyDetailScreen from "./src/components/BabyDetailScreen";
import AcceptInvitationScreen from "./src/components/AcceptInvitationScreen";

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ["babytracker://"],
  config: {
    screens: {
      AcceptInvitation: "invitations/:token",
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen
            name="Landing"
            component={Landing}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={Register}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Children"
            component={Children}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddChild"
            component={AddChildScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BabyDetail"
            component={BabyDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AcceptInvitation"
            component={AcceptInvitationScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
