import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart, PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchTasks } from "../store/slices/tasksSlice";
import { fetchActivities } from "../store/slices/activitiesSlice";
import { getBabyGraphs } from "../../services/analyticsService";

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
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
      },
    ],
  },
  height: {
    labels: [],
    datasets: [
      {
        data: [],
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
      },
    ],
  },
};

const makeChartData = (
  labels: string[],
  values: number[],
  color: (opacity: number) => string
): MetricChartData => ({
  labels,
  datasets: [
    {
      data: values,
      strokeWidth: 3,
      color,
    },
  ],
});

const formatChartLabel = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

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
      weightPoints.map((point) => Number(point.weight_kg)),
      (opacity) => `rgba(255, 107, 107, ${opacity})`
    ),
    height: makeChartData(
      heightPoints.map((point) => formatChartLabel(point.recorded_at)),
      heightPoints.map((point) => Number(point.length_cm)),
      (opacity) => `rgba(74, 144, 226, ${opacity})`
    ),
  };
};

const getChartDataForMetric = (metric: MetricType, data: MetricChartData) => data;

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("weight");
  const [showBabySelector, setShowBabySelector] = useState(false);
  const [metricData, setMetricData] = useState<Record<MetricType, MetricChartData>>(defaultChartData);

  // Get data from Redux
  const { items: babies } = useAppSelector((state) => state.babies);
  const { items: tasks } = useAppSelector((state) => state.tasks);

  // Get the first baby or selected baby
  const [selectedBaby, setSelectedBaby] = useState<any>(null);
  const [loadingChartData, setLoadingChartData] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Set initial baby when babies load
  useEffect(() => {
    if (babies && babies.length > 0 && !selectedBaby) {
      setSelectedBaby(babies[0]);
    }
  }, [babies, selectedBaby]);

  // Handle case where selected baby is no longer in the list
  useEffect(() => {
    if (selectedBaby && babies && babies.length > 0) {
      const babyExists = babies.find((b: any) => b.baby_id === selectedBaby.baby_id);
      if (!babyExists) {
        setSelectedBaby(babies[0]);
      }
    }
  }, [babies, selectedBaby]);

  // Fetch tasks, activities, and analytics chart data when baby changes
  useEffect(() => {
    if (!selectedBaby?.baby_id) {
      return;
    }

    dispatch(fetchTasks(selectedBaby.baby_id));
    dispatch(fetchActivities(selectedBaby.baby_id));

    const fetchGraphData = async () => {
      setLoadingChartData(true);
      setChartError(null);

      const response = await getBabyGraphs(selectedBaby.baby_id);
      if (response?.success && response.data) {
        setMetricData(transformDbDataToChartData(response.data));
      } else {
        setMetricData(defaultChartData);
        setChartError(response?.message || "Unable to load chart data.");
      }

      setLoadingChartData(false);
    };

    fetchGraphData();
  }, [selectedBaby?.baby_id, dispatch]);

  // Refresh data every time the page/screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (selectedBaby?.baby_id) {
        dispatch(fetchTasks(selectedBaby.baby_id));
        dispatch(fetchActivities(selectedBaby.baby_id));
      }
    }, [selectedBaby?.baby_id, dispatch])
  );

  // Calculate task statistics
  const taskStats = {
    total: Array.isArray(tasks) ? tasks.length : 0,
    completed: Array.isArray(tasks)
      ? tasks.filter((t: any) => t.status === "completed" || t.status === "done").length
      : 0,
    incomplete: 0,
  };
  taskStats.incomplete = taskStats.total - taskStats.completed;

  const tasksDonutData = [
    {
      name: "Completed",
      tasks: taskStats.completed,
      color: "#4CAF50",
      legendFontColor: "#666666",
      legendFontSize: 11,
    },
    {
      name: "Incomplete",
      tasks: taskStats.incomplete,
      color: "#FF9800",
      legendFontColor: "#666666",
      legendFontSize: 11,
    },
  ];

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case "weight":
        return "Weight (kg)";
      case "height":
        return "Height (cm)";
      default:
        return "";
    }
  };

  const getMetricUnit = (metric: MetricType) => {
    switch (metric) {
      case "weight":
        return "kg";
      case "height":
        return "cm";
      default:
        return "";
    }
  };

  const filteredChartData = getChartDataForMetric(selectedMetric, metricData[selectedMetric]);
  const chartValues = filteredChartData.datasets[0].data;
  const hasChartData = chartValues.length > 0 && filteredChartData.labels.length > 0;
  const chartWidth = Math.max(width - scale(24), filteredChartData.labels.length * scale(70));
  const latestChartValue = hasChartData ? chartValues[chartValues.length - 1] : 0;
  const averageChartValue = hasChartData
    ? chartValues.reduce((a, b) => a + b, 0) / chartValues.length
    : 0;
  const changeChartValue = hasChartData ? latestChartValue - chartValues[0] : 0;
  const changeColor = hasChartData && chartValues[chartValues.length - 1] >= chartValues[0] ? "#4CAF50" : "#F44336";

  const currentDateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const createdDate = selectedBaby?.created_at
    ? new Date(selectedBaby.created_at)
    : selectedBaby?.date_of_birth
    ? new Date(selectedBaby.date_of_birth)
    : null;

  const weeksSinceAdded = createdDate
    ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
    : null;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + verticalScale(90),
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + verticalScale(12) }]}
      >
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSubtitle}>
          {selectedBaby ? `${selectedBaby.display_name}'s trends` : "Baby trends"}
        </Text>
        <Text style={styles.headerMeta}>
          {selectedBaby && weeksSinceAdded !== null
            ? `${weeksSinceAdded} week${weeksSinceAdded === 1 ? "" : "s"} since added`
            : "Added date unavailable"}
        </Text>
        <Text style={styles.headerMeta}>{currentDateLabel}</Text>
      </LinearGradient>

      {/* Baby Selector */}
      {babies && babies.length > 1 && (
        <View style={styles.babySelectorContainer}>
          <TouchableOpacity
            style={styles.babySelector}
            onPress={() => setShowBabySelector(true)}
          >
            <View style={styles.babySelectorContent}>
              <Ionicons
                name="person-circle-outline"
                size={moderateScale(20)}
                color={colors.primary || "#FF6B6B"}
              />
              <View>
                <Text style={styles.babySelectorText}>
                  {selectedBaby?.display_name || "Select Baby"}
                </Text>
                {selectedBaby?.date_of_birth && (
                  <Text style={styles.babySelectorSubtext}>
                    {new Date(selectedBaby.date_of_birth).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons
              name="chevron-down"
              size={moderateScale(16)}
              color="#666666"
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedMetric === "weight" && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedMetric("weight")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                selectedMetric === "weight" && styles.toggleButtonTextActive,
              ]}
            >
              Weight
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedMetric === "height" && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedMetric("height")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                selectedMetric === "height" && styles.toggleButtonTextActive,
              ]}
            >
              Height
            </Text>
          </TouchableOpacity>


        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{getMetricLabel(selectedMetric)}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContainer}
          >
            {loadingChartData ? (
              <View
                style={[
                  styles.emptyState,
                  { width: chartWidth, minHeight: verticalScale(200) },
                ]}
              >
                <Text style={styles.emptyStateText}>Loading chart data...</Text>
              </View>
            ) : hasChartData ? (
              <LineChart
                data={filteredChartData}
                width={chartWidth}
                height={verticalScale(200)}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
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
              <View
                style={[
                  styles.emptyState,
                  { width: chartWidth, minHeight: verticalScale(200) },
                ]}
              >
                <Text style={styles.emptyStateText}>
                  {chartError ?? "No growth history available yet."}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.chartStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Latest</Text>
              <Text style={styles.statValue}>
                {latestChartValue.toFixed(1)} {getMetricUnit(selectedMetric)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>
                {averageChartValue.toFixed(1)} {getMetricUnit(selectedMetric)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Change</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: changeColor,
                  },
                ]}
              >
                {changeChartValue >= 0 ? "+" : ""}
                {changeChartValue.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Task Progress Donut Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Task Progress</Text>

          <View style={styles.donutContainer}>
            <PieChart
              data={tasksDonutData}
              width={width - scale(48)}
              height={verticalScale(200)}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"tasks"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
            <View style={styles.donutLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
                <Text style={styles.legendLabel}>Completed</Text>
                <Text style={styles.legendValue}>{taskStats.completed}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#FF9800" }]} />
                <Text style={styles.legendLabel}>Incomplete</Text>
                <Text style={styles.legendValue}>{taskStats.incomplete}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: "#E3E3E3" }]} />
                <Text style={styles.legendLabel}>Total</Text>
                <Text style={styles.legendValue}>{taskStats.total}</Text>
              </View>
            </View>
          </View>

          <View style={styles.taskProgressBar}>
            <View style={styles.progressPercentage}>
              <Text style={styles.progressLabel}>Completion Rate</Text>
              <Text style={styles.progressPercent}>
                {taskStats.total > 0
                  ? Math.round((taskStats.completed / taskStats.total) * 100)
                  : 0}%
              </Text>
            </View>
            <View
              style={[
                styles.progressBarTrack,
                {
                  backgroundColor:
                    taskStats.total > 0
                      ? "rgba(76, 175, 80, 0.1)"
                      : "rgba(200, 200, 200, 0.2)",
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      taskStats.total > 0
                        ? (taskStats.completed / taskStats.total) * 100
                        : 0
                    }%`,
                    backgroundColor: "#4CAF50",
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Baby Selector Modal */}
      <Modal
        visible={showBabySelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBabySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(verticalScale(16), insets.bottom) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Baby</Text>
              <TouchableOpacity
                onPress={() => setShowBabySelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={moderateScale(24)} color="#666666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={babies}
              keyExtractor={(item) => item.baby_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.babyOption,
                    selectedBaby?.baby_id === item.baby_id && styles.babyOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedBaby(item);
                    setShowBabySelector(false);
                  }}
                >
                  <View style={styles.babyOptionContent}>
                    <Ionicons
                      name="person-circle-outline"
                      size={moderateScale(24)}
                      color={selectedBaby?.baby_id === item.baby_id ? colors.primary : "#666666"}
                    />
                    <View style={styles.babyOptionText}>
                      <Text style={styles.babyOptionName}>{item.display_name}</Text>
                      <Text style={styles.babyOptionDetails}>
                        {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString() : "No DOB"}
                      </Text>
                    </View>
                  </View>
                  {selectedBaby?.baby_id === item.baby_id && (
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(20)}
                      color={colors.primary || "#FF6B6B"}
                    />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    borderBottomLeftRadius: moderateScale(34),
    borderBottomRightRadius: moderateScale(34),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: verticalScale(2),
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: verticalScale(4),
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowRadius: 1,
    textShadowOffset: { width: 0, height: 1 },
  },
  headerMeta: {
    fontSize: moderateScale(11),
    color: "#F5F5F5",
    opacity: 0.95,
    marginTop: verticalScale(2),
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: scale(12),
    paddingBottom: verticalScale(24),
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: verticalScale(12),
    gap: scale(8),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(8),
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: colors.primary || "#FF6B6B",
    borderColor: colors.primary || "#FF6B6B",
  },
  toggleButtonText: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    color: "#666666",
  },
  toggleButtonTextActive: {
    color: "#FFFFFF",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: scale(12),
    marginBottom: verticalScale(12),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartScrollContainer: {
    minWidth: "100%",
  },
  chartTitle: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#333333",
    marginBottom: verticalScale(12),
  },
  chart: {
    borderRadius: 8,
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
    color: colors.primary || "#FF6B6B",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: verticalScale(300),
  },
  emptyStateText: {
    fontSize: moderateScale(16),
    color: colors.textSecondary || "#666666",
    textAlign: "center",
  },
  donutContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: verticalScale(12),
  },
  donutLegend: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: scale(12),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: verticalScale(6),
  },
  legendColor: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: 6,
    marginRight: scale(8),
  },
  legendLabel: {
    fontSize: moderateScale(11),
    color: "#666666",
    fontWeight: "500",
    flex: 1,
  },
  legendValue: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#333333",
    minWidth: scale(30),
    textAlign: "right",
  },
  taskProgressBar: {
    marginTop: verticalScale(16),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  progressPercentage: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  progressLabel: {
    fontSize: moderateScale(12),
    color: "#999999",
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#4CAF50",
  },
  progressBarTrack: {
    height: verticalScale(8),
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  babySelectorContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: scale(12),
    marginTop: verticalScale(12),
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  babySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(12),
  },
  babySelectorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  babySelectorText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#333333",
    marginLeft: scale(8),
  },
  babySelectorSubtext: {
    fontSize: moderateScale(12),
    color: "#666666",
    marginLeft: scale(8),
    marginTop: verticalScale(2),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: verticalScale(400),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: "#333333",
  },
  modalCloseButton: {
    padding: scale(4),
  },
  babyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  babyOptionSelected: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  babyOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  babyOptionText: {
    marginLeft: scale(12),
  },
  babyOptionName: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#333333",
  },
  babyOptionDetails: {
    fontSize: moderateScale(12),
    color: "#666666",
    marginTop: verticalScale(2),
  },
});
