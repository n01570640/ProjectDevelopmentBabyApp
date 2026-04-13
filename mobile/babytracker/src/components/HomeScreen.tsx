import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchBabies } from "../store/slices/babiesSlice";
import { fetchTasks } from "../store/slices/tasksSlice";
import { updateTask } from "../../services/scheduleService";
import { colors } from "../theme/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

const formatDate = (value?: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items: babies, loading: babiesLoading, error: babiesError } = useAppSelector(
    (state: any) => state.babies
  );
  const { items: tasks, loading: tasksLoading, error: tasksError } = useAppSelector(
    (state: any) => state.tasks
  );

  const [selectedBabyId, setSelectedBabyId] = useState<number | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchBabies());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedBabyId && babies.length > 0) {
      setSelectedBabyId(babies[0].baby_id);
    }
  }, [babies, selectedBabyId]);

  useEffect(() => {
    if (selectedBabyId !== null) {
      dispatch(fetchTasks(selectedBabyId));
    }
  }, [dispatch, selectedBabyId]);

  const selectedBaby = useMemo(
    () => babies.find((baby: any) => baby.baby_id === selectedBabyId) ?? null,
    [babies, selectedBabyId]
  );

  const getAgeLabel = (dateString?: string) => {
    if (!dateString) return "Age unavailable";
    const dob = new Date(dateString);
    if (Number.isNaN(dob.getTime())) return "Age unavailable";

    const now = new Date();
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) months -= 1;
    if (months < 0) months = 0;

    if (months < 24) {
      return `${months} month${months === 1 ? "" : "s"} old`;
    }

    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (remMonths === 0) return `${years} year${years === 1 ? "" : "s"} old`;
    return `${years}y ${remMonths}m old`;
  };

  const babyTasks = useMemo(() => {
    if (!selectedBaby) return [];
    return tasks || [];
  }, [selectedBaby, tasks]);

  const handleSelectBaby = (babyId: number) => {
    setSelectedBabyId(babyId);
    dispatch(fetchTasks(babyId));
  };

  const handleCompleteTask = async (task: any) => {
    if (!selectedBabyId) return;
    setSavingTaskId(task.task_id);
    try {
      const res = await updateTask(selectedBabyId, task.task_id, {
        status: "done",
      });
      if (res?.success) {
        dispatch(fetchTasks(selectedBabyId));
        setFeedback({ type: "success", message: "Task completed." });
      } else {
        setFeedback({ type: "error", message: res?.message || "Unable to complete task." });
      }
    } catch (error) {
      setFeedback({ type: "error", message: "Unable to complete task." });
    } finally {
      setSavingTaskId(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#8AB8E6", "#79ADDF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topShell, { paddingTop: insets.top + verticalScale(8) }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerMonth}>Home</Text>
            <Text style={styles.headerSub}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Children and Tasks</Text>
          </View>

          <View style={styles.babyRow}>
            {babiesLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : babiesError ? (
              <Text style={styles.errorText}>Unable to load babies.</Text>
            ) : babies.length === 0 ? (
              <Text style={styles.emptyText}>No children found. Add one from the profile tab.</Text>
            ) : (
              babies.map((baby: any) => {
                const isActive = baby.baby_id === selectedBabyId;
                return (
                  <TouchableOpacity
                    key={baby.baby_id}
                    style={[styles.babyButton, isActive && styles.babyButtonActive]}
                    activeOpacity={0.86}
                    onPress={() => handleSelectBaby(baby.baby_id)}
                  >
                    <Text style={[styles.babyButtonLabel, isActive && styles.babyButtonLabelActive]}
                      numberOfLines={1}
                    >
                      {baby.display_name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current child</Text>
            {selectedBaby ? (
              <TouchableOpacity
                style={styles.sectionAction}
                onPress={() => navigation.navigate("BabyDetail", { babyId: selectedBaby.baby_id })}
              >
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionActionText}>Details</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedBaby ? (
            <View style={styles.childInfoCard}>
              <Text style={styles.childName}>{selectedBaby.display_name}</Text>
              <Text style={styles.childMeta}>Born {selectedBaby.date_of_birth}</Text>
              <Text style={styles.childMeta}>Age: {getAgeLabel(selectedBaby.date_of_birth)}</Text>
              <Text style={styles.childMeta}>Guardian: {selectedBaby.primary_caregiver_name || "Unknown"}</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>Select a child to see details and tasks.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Scheduled tasks</Text>
          </View>

          {tasksLoading ? (
            <View style={styles.taskLoadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.taskLoadingText}>Loading tasks...</Text>
            </View>
          ) : tasksError ? (
            <Text style={styles.errorText}>Unable to load tasks.</Text>
          ) : babyTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks for this child yet. Create tasks from the schedule page.</Text>
          ) : (
            babyTasks.map((task: any) => {
              const completed = task.status === "done" || task.status === "completed";
              return (
                <View key={task.task_id} style={styles.taskRow}>
                  <View style={styles.taskBody}>
                    <Text style={styles.taskTitle}>{task.title || task.description || "Untitled task"}</Text>
                    <Text style={styles.taskMeta}>{formatDate(task.due_at)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      completed && styles.completeButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => !completed && handleCompleteTask(task)}
                    disabled={completed || savingTaskId === task.task_id}
                  >
                    <Text style={styles.completeButtonText}>
                      {completed ? "Done" : savingTaskId === task.task_id ? "Saving..." : "Complete"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: verticalScale(80) }} />
      </ScrollView>

      {feedback ? (
        <View style={[styles.feedbackBanner, feedback.type === "error" && styles.feedbackErrorBanner]}>
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topShell: {
    paddingHorizontal: scale(10),
    paddingBottom: verticalScale(12),
    borderBottomLeftRadius: moderateScale(34),
    borderBottomRightRadius: moderateScale(34),
  },
  headerRow: {
    justifyContent: "space-between",
  },
  headerMonth: {
    fontSize: moderateScale(18),
    color: "#FFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowRadius: 2,
  },
  headerSub: {
    fontSize: moderateScale(14),
    color: "#EAF3FF",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: verticalScale(30),
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: "#F8FBFF",
    padding: scale(18),
    marginBottom: verticalScale(18),
  },
  heroHeader: {
    marginBottom: verticalScale(16),
  },
  heroTitle: {
    fontSize: moderateScale(28),
    fontWeight: "800",
    color: colors.textPrimary,
  },
  heroSubtitle: {
    fontSize: moderateScale(14),
    color: colors.textMuted,
    marginTop: verticalScale(6),
    lineHeight: 20,
  },
  babyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  babyButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    borderWidth: 1,
    borderColor: colors.inactive,
    minWidth: scale(100),
    marginRight: scale(8),
    marginBottom: verticalScale(10),
  },
  babyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  babyButtonLabel: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: moderateScale(14),
  },
  babyButtonLabelActive: {
    color: "#fff",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: scale(18),
    marginBottom: verticalScale(18),
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(14),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionActionText: {
    marginLeft: scale(6),
    color: colors.primary,
    fontWeight: "700",
  },
  childInfoCard: {
    padding: scale(14),
    borderRadius: 20,
    backgroundColor: "#F4F8FF",
  },
  childName: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: colors.textPrimary,
  },
  childMeta: {
    marginTop: verticalScale(6),
    color: colors.textMuted,
    fontSize: moderateScale(13),
  },
  taskLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  taskLoadingText: {
    marginLeft: scale(10),
    color: colors.textMuted,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(12),
    backgroundColor: "#F9FBFF",
    padding: scale(14),
    borderRadius: 18,
  },
  taskBody: {
    flex: 1,
    marginRight: scale(10),
  },
  taskTitle: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: colors.textPrimary,
  },
  taskMeta: {
    marginTop: verticalScale(4),
    color: colors.textMuted,
    fontSize: moderateScale(12),
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonDisabled: {
    backgroundColor: colors.inactive,
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: moderateScale(12),
  },
  feedbackBanner: {
    position: "absolute",
    bottom: verticalScale(100),
    left: scale(20),
    right: scale(20),
    backgroundColor: "#D1F7E0",
    borderRadius: 16,
    padding: scale(12),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  feedbackErrorBanner: {
    backgroundColor: "#FDE2E1",
  },
  feedbackText: {
    color: colors.textPrimary,
    fontSize: moderateScale(13),
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: moderateScale(13),
    lineHeight: 20,
  },
  errorText: {
    color: colors.errorBorder,
    fontSize: moderateScale(13),
  },
});
