import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Landing from "./src/components/landing";
import Login from "./src/components/login";
import Register from "./src/components/register";
import Children from "./src/components/children"; // 👈 lowercase filename, default export is Children
import ProfileScreen from "./src/components/ProfileScreen";
import HistoryScreen from "./src/components/HistoryScreen";
import ScheduleScreen from "./src/components/ScheduleScreen";
import AddChildScreen from "./src/components/AddChildScreen";
import BabyDetailScreen from "./src/components/BabyDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
