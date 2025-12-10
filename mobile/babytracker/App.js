import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Landing from "./src/components/landing";
import Login from "./src/components/login";
import Register from "./src/components/register";
import Children from "./src/components/children"; // 👈 add this

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
          options={{ headerShown: false }} // no default header, we use your custom nav
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
