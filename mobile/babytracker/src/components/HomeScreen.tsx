
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchBabies } from "../store/slices/babiesSlice";
import { fetchTasks } from "../store/slices/tasksSlice";
import { updateTask } from "../../services/scheduleService";
import { getBabyGraphs } from "../../services/analyticsService";
import { colors } from "../theme/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";

const { width } = Dimensions.get("window");

type MetricType = "weight" | "height";

type ChartDataset = {
  data: number[];
  strokeWidth: number;
  color: (opacity: number) => string;
};

type MetricChartData = {
  labels: string[];
  datasets: ChartDataset[];
};

const defaultChartData: Record<MetricType, MetricChartData> = {
  weight: {
    labels: [],
    datasets: [
      {
        data: [],
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(116, 176, 244, ${opacity})`,
      },
    ],
  },
  height: {
    labels: [],
    datasets: [
      {
        data: [],
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(116, 176, 244, ${opacity})`,
      },
    ],
  },
};

const formatMonthYear = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

const formatWeekdayDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
  });

const formatChartLabel = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const makeChartData = (labels: string[], values: number[]): MetricChartData => ({
  labels,
  datasets: [
    {
      data: values,
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(116, 176, 244, ${opacity})`,
    },
  ],
});

const transformDbDataToChartData = (dbData: any): Record<MetricType, MetricChartData> => {
  const growthData = Array.isArray(dbData?.growth_over_time) ? dbData.growth_over_time : [];
  const sortedGrowth = [...growthData].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const weightPoints = sortedGrowth.filter(
    (point) => point.weight_kg !== null && point.weight_kg !== undefined
  );
  const heightPoints = sortedGrowth.filter(
    (point) => point.length_cm !== null && point.length_cm !== undefined
  );

  return {
    weight: makeChartData(
      weightPoints.map((point) => formatChartLabel(point.recorded_at)),
      weightPoints.map((point) => Number(point.weight_kg) * 2.20462)
    ),
    height: makeChartData(
      heightPoints.map((point) => formatChartLabel(point.recorded_at)),
      heightPoints.map((point) => Number(point.length_cm))
    ),
  };
};

const parseLocalDateTime = (value: string) => {
  const localDateTimeRegex = /^\s*(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?\s*$/;
  const match = value.match(localDateTimeRegex);
  if (!match) return null;

  const [,
    year,
    month,
    day,
    hour = "00",
    minute = "00",
    second = "00",
    milli = "0",
  ] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(milli.padEnd(3, "0"))
  );
};

const parseDateSafe = (value?: string | null) => {
  if (!value) return null;

  const raw = value.trim();
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const local = parseLocalDateTime(raw);
  if (local) return local;

  const normalized = raw.replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
};

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
  return remMonths === 0
    ? `${years} year${years === 1 ? "" : "s"} old`
    : `${years}y ${remMonths}m old`;
};

const getCountdownParts = (targetIso?: string | null) => {
  const target = parseDateSafe(targetIso);
  if (!target) return { hours: "0", minutes: "00", expired: true };

  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { hours: "0", minutes: "00", expired: true };

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    hours: String(hours),
    minutes: String(minutes).padStart(2, "0"),
    expired: false,
  };
};

const formatDisplayTime = (value?: string | null) => {
  const d = parseDateSafe(value);
  if (!d) return "--:--";
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatDisplayWeight = (value: number) => `${value.toFixed(1)} lbs`;
const formatDisplayHeight = (value: number) => `${value.toFixed(1)} cm`;

function AnimatedScaleButton({
  children,
  onPress,
  style,
  disabled = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      speed: 28,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 24,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale: pressAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        disabled={disabled}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function HorizontalChevronScroll({
  children,
  contentContainerStyle,
  style,
}: {
  children: React.ReactNode;
  contentContainerStyle?: any;
  style?: any;
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const isScrollable = contentWidth > containerWidth + 4;
  const showLeft = isScrollable && scrollX > 6;
  const showRight = isScrollable && scrollX < contentWidth - containerWidth - 6;

  return (
    <View
      style={[styles.horizontalScrollShell, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {showLeft && (
        <Ionicons
          name="chevron-back"
          size={moderateScale(18)}
          color="#7AA6D8"
          style={[styles.scrollChevron, styles.scrollChevronLeft]}
          pointerEvents="none"
        />
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        contentContainerStyle={[styles.horizontalScrollContent, contentContainerStyle]}
      >
        {children}
      </ScrollView>

      {showRight && (
        <Ionicons
          name="chevron-forward"
          size={moderateScale(18)}
          color="#7AA6D8"
          style={[styles.scrollChevron, styles.scrollChevronRight]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const today = new Date().toISOString().slice(0, 10);

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

  const [selectedMetric, setSelectedMetric] = useState<MetricType>("weight");
  const [metricData, setMetricData] = useState<Record<MetricType, MetricChartData>>(defaultChartData);
  const [loadingChartData, setLoadingChartData] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  const [countdownParts, setCountdownParts] = useState({ hours: "0", minutes: "00", expired: true });

  const swapAnim = useRef(new Animated.Value(1)).current;
  const completedFlashAnim = useRef(new Animated.Value(0)).current;
  const lastUpcomingIdRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch(fetchBabies());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchBabies());
    }, [dispatch])
  );

  useEffect(() => {
    if (!selectedBabyId && babies.length > 0) {
      setSelectedBabyId(babies[0].baby_id);
    }
  }, [babies, selectedBabyId]);

  const selectedBaby = useMemo(
    () => babies.find((baby: any) => baby.baby_id === selectedBabyId) ?? null,
    [babies, selectedBabyId]
  );

  useEffect(() => {
    if (selectedBabyId !== null) {
      dispatch(fetchTasks(selectedBabyId));
    }
  }, [dispatch, selectedBabyId]);

  useFocusEffect(
    useCallback(() => {
      if (selectedBabyId !== null) {
        dispatch(fetchTasks(selectedBabyId));
      }
    }, [dispatch, selectedBabyId])
  );

  useEffect(() => {
    let active = true;

    const loadGraphs = async () => {
      if (!selectedBabyId) {
        setMetricData(defaultChartData);
        setChartError(null);
        return;
      }

      setLoadingChartData(true);
      setChartError(null);

      try {
        const response = await getBabyGraphs(selectedBabyId);
        if (!active) return;

        if (response?.success && response.data) {
          setMetricData(transformDbDataToChartData(response.data));
        } else {
          setMetricData(defaultChartData);
          setChartError(response?.message || "Unable to load chart data.");
        }
      } catch {
        if (active) {
          setMetricData(defaultChartData);
          setChartError("Unable to load chart data.");
        }
      } finally {
        if (active) setLoadingChartData(false);
      }
    };

    loadGraphs();
    return () => {
      active = false;
    };
  }, [selectedBabyId]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const sortedTasks = useMemo(() => {
    const list = Array.isArray(tasks) ? [...tasks] : [];
    return list.sort((a: any, b: any) => {
      const aTime = parseDateSafe(a.due_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseDateSafe(b.due_at)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    return sortedTasks.filter((task: any) => task.status !== "done" && task.status !== "completed");
  }, [sortedTasks]);

  const upcomingTask = upcomingTasks[0] ?? null;

  useEffect(() => {
    if (!upcomingTask?.task_id) {
      lastUpcomingIdRef.current = null;
      return;
    }

    if (lastUpcomingIdRef.current === null) {
      lastUpcomingIdRef.current = upcomingTask.task_id;
      return;
    }

    if (lastUpcomingIdRef.current !== upcomingTask.task_id) {
      swapAnim.setValue(0);
      Animated.timing(swapAnim, {
        toValue: 1,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      lastUpcomingIdRef.current = upcomingTask.task_id;
    }
  }, [upcomingTask, swapAnim]);

  useEffect(() => {
    const tick = () => {
      setCountdownParts(getCountdownParts(upcomingTask?.due_at));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [upcomingTask]);

  const chartData = metricData[selectedMetric];
  const chartValues = chartData.datasets[0].data;
  const hasChartData = chartValues.length > 0 && chartData.labels.length > 0;
  const chartWidth = Math.max(width - scale(24), chartData.labels.length * scale(70));
  const latestChartValue = hasChartData ? chartValues[chartValues.length - 1] : 0;
  const averageChartValue = hasChartData
    ? chartValues.reduce((a, b) => a + b, 0) / chartValues.length
    : 0;
  const changeChartValue = hasChartData ? chartValues[chartValues.length - 1] - chartValues[0] : 0;
  const changeColor = hasChartData && chartValues[chartValues.length - 1] >= chartValues[0] ? "#4CAF50" : "#F44336";

  const handleCompleteTask = async (task: any) => {
    if (!selectedBabyId) return;

    const isCurrentlyDone = task?.status === "done" || task?.status === "completed";
    const nextStatus = isCurrentlyDone ? "pending" : "done";

    setSavingTaskId(task.task_id);

    if (!isCurrentlyDone) {
      Animated.sequence([
        Animated.timing(completedFlashAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.delay(180),
        Animated.timing(completedFlashAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }

    try {
      const res = await updateTask(selectedBabyId, task.task_id, { status: nextStatus });

      if (res?.success) {
        await dispatch(fetchTasks(selectedBabyId));
        setFeedback({
          type: "success",
          message: isCurrentlyDone ? "Task marked incomplete." : "Task completed.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res?.message || "Unable to update task.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Unable to update task." });
    } finally {
      setSavingTaskId(null);
    }
  };

  const timerDigits = `${countdownParts.hours}:${countdownParts.minutes}`.split("");

  const upcomingCardStyle = {
    backgroundColor: completedFlashAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#F7F7F7", "#8DBCF1"],
    }),
    borderColor: completedFlashAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["#A9A9A9", "#7FB2EF"],
    }),
  };

  const contentSwapStyle = {
    opacity: swapAnim,
    transform: [
      {
        translateX: swapAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-18, 0],
        }),
      },
    ],
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
          <View style={styles.headerDateControlWrap}>
            <View style={styles.headerDateTextWrap}>
              <Text style={styles.headerMonth}>{formatMonthYear(today)}</Text>
              <Text style={styles.headerSub}>{formatWeekdayDay(today)}</Text>
            </View>
          </View>

          <View style={styles.headerInfoBlock}>
            <Text style={styles.headerInfoTitle}>Homepage</Text>
            <Text style={styles.headerInfoSub}>Quick stats and your next task at a glance</Text>
          </View>
        </View>

        {babies.length > 1 && (
          <HorizontalChevronScroll contentContainerStyle={styles.babyPicker}>
            {babies.map((baby: any) => (
              <TouchableOpacity
                key={baby.baby_id}
                onPress={() => setSelectedBabyId(baby.baby_id)}
                style={[
                  styles.babyChip,
                  selectedBabyId === baby.baby_id && styles.babyChipActive,
                ]}
                activeOpacity={0.9}
              >
                <Text
                  style={[
                    styles.babyChipText,
                    selectedBabyId === baby.baby_id && styles.babyChipTextActive,
                  ]}
                >
                  {baby.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </HorizontalChevronScroll>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + verticalScale(110),
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsCard}>
          <View style={styles.sectionTopRow}>
            <Text style={styles.statsTitle}>Children&apos;s Statistics</Text>
            <TouchableOpacity
              onPress={() => navigation.getParent?.()?.navigate("StatisticsTab")}
              activeOpacity={0.85}
              style={styles.settingsButton}
            >
              <Ionicons name="settings" size={moderateScale(22)} color="#666666" />
            </TouchableOpacity>
          </View>

          <View style={styles.metricToggleRow}>
            <TouchableOpacity
              style={[styles.metricToggle, selectedMetric === "weight" && styles.metricToggleActive]}
              onPress={() => setSelectedMetric("weight")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.metricToggleText,
                  selectedMetric === "weight" && styles.metricToggleTextActive,
                ]}
              >
                Weight
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricToggle, selectedMetric === "height" && styles.metricToggleActive]}
              onPress={() => setSelectedMetric("height")}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.metricToggleText,
                  selectedMetric === "height" && styles.metricToggleTextActive,
                ]}
              >
                Height
              </Text>
            </TouchableOpacity>

            <View style={styles.selectedBabyPill}>
              <View style={styles.selectedBabyDot} />
              <Text style={styles.selectedBabyPillText}>{selectedBaby?.display_name || "Baby"}</Text>
            </View>
          </View>

          <Text style={styles.chartTitle}>
            {selectedMetric === "weight" ? "Weight (kg)" : "Height (cm)"}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContent}
          >
            {loadingChartData ? (
              <View style={[styles.chartEmptyState, { width: chartWidth, minHeight: verticalScale(200) }]}>
                <Text style={styles.chartEmptyStateText}>Loading chart data...</Text>
              </View>
            ) : hasChartData ? (
              <LineChart
                data={chartData}
                width={chartWidth}
                height={verticalScale(200)}
                chartConfig={{
                  backgroundColor: "#F7F7F7",
                  backgroundGradientFrom: "#F7F7F7",
                  backgroundGradientTo: "#F7F7F7",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  strokeWidth: 2,
                  propsForLabels: {
                    fontSize: 11,
                    fontFamily: "System",
                  },
                }}
                style={styles.chart}
                bezier
                withDots={true}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
              />
            ) : (
              <View style={[styles.chartEmptyState, { width: chartWidth, minHeight: verticalScale(200) }]}>
                <Text style={styles.chartEmptyStateText}>
                  {chartError ?? "No growth history available yet."}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.chartStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Latest</Text>
              <Text style={styles.statValue}>
                {selectedMetric === "weight"
                  ? formatDisplayWeight(latestChartValue)
                  : formatDisplayHeight(latestChartValue)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>
                {selectedMetric === "weight"
                  ? formatDisplayWeight(averageChartValue)
                  : formatDisplayHeight(averageChartValue)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Change</Text>
              <Text style={[styles.statValue, { color: changeColor }]}>
                {changeChartValue >= 0 ? "+" : ""}
                {changeChartValue.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.upcomingCard, upcomingCardStyle]}>
          <View style={styles.upcomingHeaderRow}>
            <Text style={styles.upcomingTitle}>Upcoming Events</Text>
            <View style={styles.upcomingTimePill}>
              <Text style={styles.upcomingTimePillText}>
                {upcomingTask ? formatDisplayTime(upcomingTask.due_at) : "--:--"}
              </Text>
            </View>
          </View>

          <Animated.View style={contentSwapStyle}>
            <Text style={styles.upcomingTaskLine}>
              {upcomingTask?.title || "No upcoming tasks"}
              {selectedBaby ? (
                <Text style={styles.upcomingTaskAccent}> {selectedBaby.display_name}</Text>
              ) : null}
            </Text>
          </Animated.View>

          <View style={styles.divider} />

          <Text style={styles.timeToTaskHeading}>Time to Task</Text>

          <View style={styles.timerAndActionRow}>
            <Animated.View style={[styles.timerRow, contentSwapStyle]}>
              {timerDigits.map((char, index) =>
                char === ":" ? (
                  <Text key={`colon-${index}`} style={styles.timerColon}>
                    :
                  </Text>
                ) : (
                  <View key={`digit-${index}`} style={styles.timerDigitBox}>
                    <Text style={styles.timerDigitText}>{char}</Text>
                  </View>
                )
              )}
            </Animated.View>

            <AnimatedScaleButton
              style={[
                styles.completeNowCircleWrap,
                (savingTaskId === upcomingTask?.task_id || !upcomingTask) && styles.completeNowCircleWrapDisabled,
              ]}
              disabled={!upcomingTask || savingTaskId === upcomingTask?.task_id}
              onPress={() => {
                if (upcomingTask) handleCompleteTask(upcomingTask);
              }}
            >
              <LinearGradient
                colors={["#B9D7F7", "#95B8DD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.completeNowCircle}
              >
                <Text style={styles.completeNowCircleText}>
                  {savingTaskId === upcomingTask?.task_id ? "Saving..." : "Complete\nNow"}
                </Text>
              </LinearGradient>
            </AnimatedScaleButton>
          </View>

          <Animated.View style={contentSwapStyle}>
            <View style={styles.upcomingMetaRow}>
              <Text style={styles.upcomingMetaText}>
                {selectedBaby ? `${selectedBaby.display_name} • ${getAgeLabel(selectedBaby.date_of_birth)}` : "No child selected"}
              </Text>
              {selectedBaby ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate("BabyDetail", { babyId: selectedBaby.baby_id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailsLink}>Details</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>

          {babiesLoading && <Text style={styles.helperText}>Loading children...</Text>}
          {babiesError && <Text style={styles.errorText}>Unable to load children.</Text>}
          {tasksLoading && <Text style={styles.helperText}>Loading tasks...</Text>}
          {tasksError && <Text style={styles.errorText}>Unable to load tasks.</Text>}
        </Animated.View>
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
    backgroundColor: "#ECECEC",
  },

  topShell: {
    paddingHorizontal: scale(12),
    paddingBottom: verticalScale(12),
    borderBottomLeftRadius: moderateScale(34),
    borderBottomRightRadius: moderateScale(34),
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12),
  },

  headerDateControlWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  headerDateChevronButton: {
    width: 0,
    height: 0,
  },

  headerDateTextWrap: {
    marginHorizontal: 0,
  },

  headerMonth: {
    fontSize: moderateScale(17),
    color: "#FFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowRadius: 2,
  },

  headerSub: {
    fontSize: moderateScale(13),
    color: "#EAF3FF",
  },

  headerInfoBlock: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: scale(8),
  },

  headerInfoTitle: {
    fontSize: moderateScale(18),
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowRadius: 2,
  },

  headerInfoSub: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(11.5),
    color: "#EAF3FF",
  },

  horizontalScrollShell: {
    marginTop: verticalScale(12),
    position: "relative",
  },

  horizontalScrollContent: {
    paddingHorizontal: scale(2),
    alignItems: "center",
  },

  scrollChevron: {
    position: "absolute",
    top: "50%",
    marginTop: -moderateScale(9),
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },

  scrollChevronLeft: {
    left: 0,
  },

  scrollChevronRight: {
    right: 0,
  },

  babyPicker: {
    paddingHorizontal: scale(22),
  },

  babyChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(18),
    backgroundColor: "rgba(255,255,255,0.26)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginRight: scale(8),
  },

  babyChipActive: {
    backgroundColor: "#FFFFFF",
  },

  babyChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#F6FBFF",
  },

  babyChipTextActive: {
    color: "#4F8DD4",
  },

  scrollContent: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(14),
  },

  statsCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: "#B0B0B0",
    marginBottom: verticalScale(18),
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  sectionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(12),
  },

  statsTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#616161",
  },

  settingsButton: {
    width: moderateScale(34),
    height: moderateScale(34),
    alignItems: "center",
    justifyContent: "center",
  },

  metricToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(8),
  },

  metricToggle: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(18),
    backgroundColor: "#D9D9D9",
  },

  metricToggleActive: {
    backgroundColor: "#8DBCF1",
  },

  metricToggleText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#333333",
  },

  metricToggleTextActive: {
    color: "#FFFFFF",
  },

  selectedBabyPill: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3E3E3",
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(9),
  },

  selectedBabyDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: "#65A7F2",
    marginRight: scale(8),
  },

  selectedBabyPillText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#5C9DF1",
  },

  chartLoadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(34),
  },

  chartScrollContent: {
    paddingRight: scale(10),
  },

  chart: {
    borderRadius: moderateScale(16),
    marginLeft: -scale(14),
  },
  chartTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#333333",
    marginBottom: verticalScale(12),
  },

  chartEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  chartEmptyStateText: {
    fontSize: moderateScale(16),
    color: "#666666",
    textAlign: "center",
  },

  chartStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: verticalScale(12),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },

  statItem: {
    alignItems: "center",
    flex: 1,
  },

  statLabel: {
    fontSize: moderateScale(11),
    color: "#999999",
    fontWeight: "500",
    marginBottom: verticalScale(2),
  },

  statValue: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: colors.primary,
  },

  upcomingCard: {
    borderRadius: moderateScale(24),
    borderWidth: 1,
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(12),
  },

  upcomingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
    gap: scale(10),
  },

  upcomingTitle: {
    fontSize: moderateScale(19),
    fontWeight: "800",
    color: "#616161",
    flexShrink: 1,
  },

  upcomingTimePill: {
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(9),
    backgroundColor: "#BDD7F5",
  },

  upcomingTimePillText: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#5B95DA",
  },

  upcomingTaskLine: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#5F5F5F",
    marginBottom: verticalScale(12),
  },

  upcomingTaskAccent: {
    color: "#63A3F1",
  },

  divider: {
    height: 1,
    backgroundColor: "#8D8D8D",
    marginBottom: verticalScale(12),
  },

  timeToTaskHeading: {
    fontSize: moderateScale(33),
    lineHeight: moderateScale(35),
    fontWeight: "800",
    color: "#616161",
    marginBottom: verticalScale(14),
    width: "100%",
  },

  timerAndActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
  },

  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  timerDigitBox: {
    width: scale(48),
    height: verticalScale(74),
    borderRadius: moderateScale(14),
    backgroundColor: "#F2F2F2",
    borderWidth: 1,
    borderColor: "#B6B6B6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(6),
  },

  timerDigitText: {
    fontSize: moderateScale(42),
    fontWeight: "800",
    color: "#666666",
    lineHeight: moderateScale(46),
  },

  timerColon: {
    fontSize: moderateScale(44),
    fontWeight: "800",
    color: "#666666",
    marginHorizontal: scale(4),
    marginTop: -verticalScale(4),
  },

  completeNowCircleWrap: {
    width: moderateScale(118),
    height: moderateScale(118),
    borderRadius: moderateScale(59),
    padding: moderateScale(4),
    backgroundColor: "#BBD8F6",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  completeNowCircleWrapDisabled: {
    opacity: 0.72,
  },

  completeNowCircle: {
    flex: 1,
    borderRadius: moderateScale(55),
    alignItems: "center",
    justifyContent: "center",
  },

  completeNowCircleText: {
    textAlign: "center",
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: moderateScale(22),
  },

  upcomingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(12),
    gap: scale(10),
  },

  upcomingMetaText: {
    fontSize: moderateScale(11.5),
    color: "#6A6A6A",
    fontWeight: "600",
  },

  detailsLink: {
    fontSize: moderateScale(12),
    color: "#63A3F1",
    fontWeight: "700",
  },

  helperText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    color: "#7D7D7D",
  },

  errorText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    color: colors.errorBorder,
  },

  feedbackBanner: {
    position: "absolute",
    left: scale(18),
    right: scale(18),
    bottom: verticalScale(96),
    backgroundColor: "#D1F7E0",
    borderRadius: moderateScale(16),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(12),
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  feedbackErrorBanner: {
    backgroundColor: "#FDE2E1",
  },

  feedbackText: {
    fontSize: moderateScale(13),
    color: "#3F3F3F",
    fontWeight: "600",
  },
});
