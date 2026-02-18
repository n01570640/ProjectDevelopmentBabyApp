import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Baby, HistoryItem } from "../types/baby.types";

interface HistoryScreenProps {
  route: {
    params: {
      baby: Baby;
    };
  };
  navigation: any;
}

export default function HistoryScreen({
  route,
  navigation,
}: HistoryScreenProps) {
  const { baby } = route.params;

  // Demo history data
  const historyItems: HistoryItem[] = [
    {
      id: 1,
      icon: "water-outline",
      description: "Fed 120ml",
      timestamp: "08:30 AM",
      babyId: 0,
      type: "FEEDING",
    },
    {
      id: 2,
      icon: "moon-outline",
      description: "Nap",
      timestamp: "10:00 AM",
      babyId: 0,
      type: "FEEDING",
    },
    {
      id: 3,
      icon: "medical-outline",
      description: "Vaccination recorded",
      timestamp: "11:45 AM",
      babyId: 0,
      type: "FEEDING",
    },
    {
      id: 4,
      icon: "document-text-outline",
      description: "Care guideline added",
      timestamp: "02:30 PM",
      babyId: 0,
      type: "FEEDING",
    },
    {
      id: 5,
      icon: "water-outline",
      description: "Fed 90ml",
      timestamp: "03:15 PM",
      babyId: 0,
      type: "FEEDING",
    },
    {
      id: 6,
      icon: "shirt-outline",
      description: "Diaper change",
      timestamp: "04:00 PM",
      babyId: 0,
      type: "FEEDING",
    },
    {
      id: 7,
      icon: "musical-notes-outline",
      description: "Playtime",
      timestamp: "05:30 PM",
      babyId: 0,
      type: "FEEDING",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      <Text style={styles.babyName}>{baby.name}</Text>

      <ScrollView style={styles.timeline}>
        {historyItems.map((item) => (
          <View key={item.id} style={styles.timelineItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={24} color="#81b6eb" />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDescription}>{item.description}</Text>
              <Text style={styles.timelineTimestamp}>{item.timestamp}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  babyName: {
    fontSize: 18,
    color: "#999",
    fontWeight: "bold",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  timeline: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDescription: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
    fontWeight: "500",
  },
  timelineTimestamp: {
    fontSize: 14,
    color: "#999",
  },
});
