import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Baby } from "../types/baby.types";
import { getBabyTimeline } from "../../services/timelineService";

interface TimelineItem {
  id: number;
  category: "activity" | "growth" | "vaccination" | "symptom" | "medication";
  description: string;
  detail: string | null;
  occurred_at: string;
}

interface HistoryScreenProps {
  route: {
    params: {
      baby: Baby;
    };
  };
  navigation: any;
}

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  feeding: "water-outline",
  sleep: "moon-outline",
  diaper: "shirt-outline",
  play: "musical-notes-outline",
  bath: "water-outline",
  activity: "ellipsis-horizontal-circle-outline",
  growth: "trending-up-outline",
  vaccination: "medical-outline",
  symptom: "thermometer-outline",
  medication: "medkit-outline",
};

function getIcon(item: TimelineItem): keyof typeof Ionicons.glyphMap {
  if (item.category === "activity") {
    return ICON_MAP[item.description.toLowerCase()] ?? ICON_MAP.activity;
  }
  return ICON_MAP[item.category] ?? ICON_MAP.activity;
}

function formatLabel(item: TimelineItem): string {
  const base =
    item.description.charAt(0).toUpperCase() + item.description.slice(1);
  if (item.detail) return `${base} — ${item.detail}`;
  return base;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;

  const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${date}, ${time}`;
}

export default function HistoryScreen({
  route,
  navigation,
}: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const { baby } = route.params;

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const res = await getBabyTimeline(baby.id);
      if (cancelled) return;

      if (res?.success) {
        setItems(res.data?.items ?? []);
      } else {
        setError(res?.message ?? "Failed to load timeline");
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [baby.id]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
      </View>

      <Text style={styles.babyName}>{baby.name}</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#81b6eb"
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.emptyText}>No history recorded yet.</Text>
      ) : (
        <ScrollView style={styles.timeline}>
          {items.map((item) => (
            <View key={`${item.category}-${item.id}`} style={styles.timelineItem}>
              <View style={styles.iconContainer}>
                <Ionicons name={getIcon(item) as any} size={24} color="#81b6eb" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDescription}>
                  {formatLabel(item)}
                </Text>
                <Text style={styles.timelineTimestamp}>
                  {formatTimestamp(item.occurred_at)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  errorText: {
    textAlign: "center",
    color: "#e74c3c",
    marginTop: 40,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 16,
  },
});
