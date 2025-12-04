import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../babytracker/screens/Homescreen';
import CreateUserScreen from '../babytracker/screens/createUserScreen'; // you created this earlier

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: "Baby Tracker" }}
        />

        <Stack.Screen 
          name="CreateUser" 
          component={CreateUserScreen}
          options={{ title: "Create User" }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
