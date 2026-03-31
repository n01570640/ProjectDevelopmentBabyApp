import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createActivity,
  createTask,
  createReminder,
} from "../../services/scheduleService";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchBabies } from "../store/slices/babiesSlice";
import { fetchActivities } from "../store/slices/activitiesSlice";
import { fetchTasks } from "../store/slices/tasksSlice";
import { fetchReminders } from "../store/slices/remindersSlice";
import { scale, verticalScale, moderateScale } from "../utils/responsive";
import { colors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

type EventType = "activity" | "task" | "reminder";
type TabMode = "schedule" | "calendar";

interface ScheduleEvent {
  id: number;
  type: EventType;
  title: string;
  description?: string;
  date: string;
  time?: string;
  raw: any;
}

interface MarkedDate {
  dots: { key: string; color: string }[];
  marked: boolean;
}

type Props = { navigation: any };

const COLORS = {
  activity: {
    dot: colors.activityDot,
    badge: colors.activityBadge ?? "#E9F3FF",
    text: colors.activityText,
    icon: "flash-outline",
  },
  task: {
    dot: colors.taskDot,
    badge: colors.taskBadge ?? "#FFF4E8",
    text: colors.taskText,
    icon: "checkmark-circle-outline",
  },
  reminder: {
    dot: colors.reminderDot,
    badge: colors.reminderBadge ?? "#F4EDFF",
    text: colors.reminderText,
    icon: "alarm-outline",
  },
} as const;

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseDateSafe = (value?: string | null) => {
  if (!value) return null;

  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;

  const normalized = value.replace(" ", "T");
  const d2 = new Date(normalized);
  if (!Number.isNaN(d2.getTime())) return d2;

  return null;
};

const toDateStr = (value?: string | null) => {
  const d = parseDateSafe(value);
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const toTimeStr = (value?: string | null) => {
  const d = parseDateSafe(value);
  if (!d) return "";
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const activityLabel = (type: string) =>
  ({
    feeding: "Feeding",
    sleep: "Sleep",
    diaper: "Diaper",
    play: "Play",
    bath: "Bath",
    other: "Other",
  }[type?.toLowerCase()] ?? type);

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

const toEventKey = (ev: ScheduleEvent) => `${ev.type}-${ev.id}`;

const getEventIso = (ev: ScheduleEvent) => {
  if (ev.type === "activity") return ev.raw?.start_time;
  if (ev.type === "task") return ev.raw?.due_at;
  return ev.raw?.due_at;
};

const getEventTimestamp = (ev: ScheduleEvent) => {
  const raw = getEventIso(ev);
  const d = parseDateSafe(raw);
  if (!d) return Number.MAX_SAFE_INTEGER;
  return d.getTime();
};

const getEventTimeState = (ev: ScheduleEvent) => {
  const ts = getEventTimestamp(ev);
  const now = Date.now();

  if (ts === Number.MAX_SAFE_INTEGER) return "future";
  if (Math.abs(ts - now) < 60000) return "now";
  return ts < now ? "past" : "future";
};

const getRelativeLabel = (ev: ScheduleEvent) => {
  const ts = getEventTimestamp(ev);
  if (ts === Number.MAX_SAFE_INTEGER) return "";

  const diffMs = ts - Date.now();
  if (diffMs < 0) return "";

  const absMin = Math.round(diffMs / 60000);
  if (absMin < 1) return "Now";
  if (absMin < 60) return `${absMin} minute${absMin === 1 ? "" : "s"}`;

  const hrs = Math.round(absMin / 60);
  return `${hrs} hour${hrs === 1 ? "" : "s"}`;
};

const getDisplayTitle = (ev: ScheduleEvent) =>
  ev.title || activityLabel(ev.raw?.activity_type || "");

const getTypeLabel = (type: EventType) =>
  type === "activity" ? "Activity" : type === "task" ? "Task" : "Reminder";

const isEventCompleted = (
  ev: ScheduleEvent | null,
  completedEventKeys: string[]
) => {
  if (!ev) return false;
  if (completedEventKeys.includes(toEventKey(ev))) return true;
  if (ev.type === "task" && ev.raw?.status === "done") return true;
  return false;
};

export default function ScheduleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const today = new Date().toISOString().slice(0, 10);

  const scrollRef = useRef<ScrollView>(null);
  const timelinePositionsRef = useRef<Record<string, { y: number; height: number }>>({});
  const [timelineViewportHeight, setTimelineViewportHeight] = useState(height * 0.7);
  const hasInitializedTodaySelection = useRef(false);

  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<TabMode>("schedule");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedBaby, setSelectedBaby] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<EventType>("activity");
  const [modalBaby, setModalBaby] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);

  const [deleteMode, setDeleteMode] = useState(false);
  const [hiddenEventKeys, setHiddenEventKeys] = useState<string[]>([]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [completedEventKeys, setCompletedEventKeys] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    activityType: "feeding",
    startTime: new Date(),
    endTime: null as Date | null,
    dueAt: new Date(),
    status: "pending",
  });

  const { items: babies } = useAppSelector((state) => state.babies);
  const { items: activities } = useAppSelector((state) => state.activities);
  const { items: tasks } = useAppSelector((state) => state.tasks);
  const { items: reminders } = useAppSelector((state) => state.reminders);

  useEffect(() => {
    dispatch(fetchBabies());
  }, [dispatch]);

  useEffect(() => {
    if (babies.length > 0 && !selectedBaby) setSelectedBaby(babies[0]);
  }, [babies, selectedBaby]);

  const loadEvents = useCallback(async () => {
    if (!selectedBaby) return;
    setLoading(true);
    try {
      const babyId = selectedBaby.baby_id;
      await Promise.all([
        dispatch(fetchActivities(babyId)),
        dispatch(fetchTasks(babyId)),
        dispatch(fetchReminders(babyId)),
      ]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, selectedBaby]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const events = useMemo(() => {
    const mapped: ScheduleEvent[] = [];

    (Array.isArray(activities) ? activities : []).forEach((a: any) => {
      const date = toDateStr(a.start_time);
      if (date) {
        mapped.push({
          id: a.activity_id,
          type: "activity",
          title: activityLabel(a.activity_type),
          description: a.notes ?? undefined,
          date,
          time: toTimeStr(a.start_time),
          raw: a,
        });
      }
    });

    (Array.isArray(tasks) ? tasks : []).forEach((t: any) => {
      const date = toDateStr(t.due_at);
      if (date) {
        mapped.push({
          id: t.task_id,
          type: "task",
          title: t.title,
          description: t.description ?? undefined,
          date,
          time: toTimeStr(t.due_at),
          raw: t,
        });
      }
    });

    (Array.isArray(reminders) ? reminders : []).forEach((r: any) => {
      const date = toDateStr(r.due_at);
      if (date) {
        mapped.push({
          id: r.reminder_id,
          type: "reminder",
          title: r.title,
          description: r.body ?? undefined,
          date,
          time: toTimeStr(r.due_at),
          raw: r,
        });
      }
    });

    return mapped
      .filter((ev) => !hiddenEventKeys.includes(toEventKey(ev)))
      .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
  }, [activities, tasks, reminders, hiddenEventKeys]);

  const markedDates = useMemo(() => {
    const result: Record<string, MarkedDate> = {};
    events.forEach((ev) => {
      if (!result[ev.date]) result[ev.date] = { dots: [], marked: true };
      if (!result[ev.date].dots.some((d) => d.key === ev.type)) {
        result[ev.date].dots.push({ key: ev.type, color: COLORS[ev.type].dot });
      }
    });
    return result;
  }, [events]);

  const dayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
  }, [events, selectedDate]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return dayEvents.find((ev) => toEventKey(ev) === selectedEventId) ?? null;
  }, [dayEvents, selectedEventId]);

  const nextUpcomingEventKey = useMemo(() => {
    const now = Date.now();
    const nextUpcoming = dayEvents.find((ev) => getEventTimestamp(ev) >= now);
    return nextUpcoming ? toEventKey(nextUpcoming) : null;
  }, [dayEvents]);

  const selectedEventTimingLabel = useMemo(() => {
    if (!selectedEvent) return "Future Event";

    if (isEventCompleted(selectedEvent, completedEventKeys)) return "Completed";
    if (toEventKey(selectedEvent) === nextUpcomingEventKey) return "Next Event";

    const state = getEventTimeState(selectedEvent);
    if (state === "past") return "Past Event";
    if (state === "now") return "Next Event";
    return "Future Event";
  }, [selectedEvent, completedEventKeys, nextUpcomingEventKey]);

  useEffect(() => {
    timelinePositionsRef.current = {};
  }, [selectedDate, mode, dayEvents.length, deleteMode]);

  useEffect(() => {
    if (!selectedEventId) return;
    if (!dayEvents.some((ev) => toEventKey(ev) === selectedEventId)) {
      setSelectedEventId(null);
    }
  }, [dayEvents, selectedEventId]);

  useEffect(() => {
    if (mode !== "schedule") return;
    if (selectedDate !== today) return;
    if (!dayEvents.length) return;
    if (hasInitializedTodaySelection.current) return;

    const now = Date.now();
    const nextUpcoming =
      dayEvents.find((ev) => getEventTimestamp(ev) >= now) ?? dayEvents[0];

    if (nextUpcoming) {
      const key = toEventKey(nextUpcoming);
      setSelectedEventId(key);
      hasInitializedTodaySelection.current = true;

      setTimeout(() => {
        const layout = timelinePositionsRef.current[key];
        if (layout) {
          const targetOffset = Math.max(
            0,
            layout.y - timelineViewportHeight / 2 + layout.height / 2
          );
          scrollRef.current?.scrollTo({ y: targetOffset, animated: true });
        }
      }, 120);
    }
  }, [mode, today, selectedDate, dayEvents, timelineViewportHeight]);

  const mergeDatePart = (existing: Date, picked: Date) => {
    const r = new Date(existing);
    r.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    return r;
  };

  const mergeTimePart = (existing: Date, picked: Date) => {
    const r = new Date(existing);
    r.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    return r;
  };

  const pickerValue = () => {
    if (pickerOpen?.startsWith("start")) return form.startTime;
    if (pickerOpen?.startsWith("end")) return form.endTime ?? form.startTime;
    return form.dueAt;
  };

  const handlePickerChange = (_e: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === "android") setPickerOpen(null);
    if (!picked) return;

    setForm((f) => {
      if (pickerOpen === "startDate") return { ...f, startTime: mergeDatePart(f.startTime, picked) };
      if (pickerOpen === "startTime") return { ...f, startTime: mergeTimePart(f.startTime, picked) };
      if (pickerOpen === "endDate") return { ...f, endTime: mergeDatePart(f.endTime ?? f.startTime, picked) };
      if (pickerOpen === "endTime") return { ...f, endTime: mergeTimePart(f.endTime ?? f.startTime, picked) };
      if (pickerOpen === "dueDate") return { ...f, dueAt: mergeDatePart(f.dueAt, picked) };
      if (pickerOpen === "dueTime") return { ...f, dueAt: mergeTimePart(f.dueAt, picked) };
      return f;
    });
  };

  const openModal = (type: EventType) => {
    if (!babies.length) {
      setFeedback({ type: "error", message: "No babies found. Add a baby from Profile first." });
      return;
    }

    const base = new Date(`${selectedDate}T09:00:00`);
    setModalType(type);
    setModalBaby(selectedBaby ?? babies[0] ?? null);
    setForm({
      title: "",
      description: "",
      activityType: "feeding",
      startTime: base,
      endTime: null,
      dueAt: base,
      status: "pending",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setFeedback(null);

    if (!modalBaby) {
      setFeedback({ type: "error", message: "Please select a baby first." });
      return;
    }

    if (!form.title.trim() && modalType !== "activity") {
      setFeedback({ type: "error", message: "Title is required." });
      return;
    }

    setSaving(true);

    try {
      const babyId = modalBaby.baby_id;

      if (modalType === "activity") {
        await createActivity(babyId, {
          baby_id: babyId,
          activity_type: form.activityType,
          start_time: form.startTime.toISOString(),
          end_time: form.endTime ? form.endTime.toISOString() : null,
          notes: form.description || null,
        });
      } else if (modalType === "task") {
        await createTask(babyId, {
          baby_id: babyId,
          title: form.title,
          description: form.description || null,
          due_at: form.dueAt.toISOString(),
          status: form.status,
        });
      } else {
        await createReminder(babyId, {
          baby_id: babyId,
          title: form.title,
          body: form.description || null,
          due_at: form.dueAt.toISOString(),
        });
      }

      setModalVisible(false);
      await loadEvents();
      setFeedback({ type: "success", message: "Event saved successfully." });

      const newDate =
        modalType === "activity"
          ? form.startTime.toISOString().slice(0, 10)
          : form.dueAt.toISOString().slice(0, 10);

      setSelectedDate(newDate);
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message ?? "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = (ev: ScheduleEvent) => {
    const key = toEventKey(ev);

    Alert.alert(
      "Delete event",
      `Remove "${getDisplayTitle(ev)}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setHiddenEventKeys((prev) => [...prev, key]);
            if (selectedEventId === key) setSelectedEventId(null);
            setFeedback({ type: "success", message: "Event removed from the schedule view." });
          },
        },
      ]
    );
  };

  const handleToggleComplete = (ev: ScheduleEvent) => {
    const key = toEventKey(ev);
    const willBeComplete = !completedEventKeys.includes(key);

    setCompletedEventKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

    setFeedback({
      type: "success",
      message: willBeComplete
        ? `${getDisplayTitle(ev)} marked complete.`
        : `${getDisplayTitle(ev)} marked incomplete.`,
    });
  };

  const toggleDeleteMode = () => {
    setDeleteMode((prev) => !prev);
  };

  const selectedIsCompleted = isEventCompleted(selectedEvent, completedEventKeys);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#8AB8E6", "#79ADDF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.topShell, { paddingTop: insets.top + verticalScale(8) }]}
      >
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            onPress={() => setMode("schedule")}
            style={[styles.segmentHalf, mode === "schedule" && styles.segmentHalfActive]}
          >
            <Text style={[styles.segmentLabel, mode === "schedule" && styles.segmentLabelActive]}>
              Daily Schedule
            </Text>
            <Ionicons
              name="list"
              size={moderateScale(18)}
              color={mode === "schedule" ? "#666" : "#B4B4B4"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("calendar")}
            style={[styles.segmentHalf, mode === "calendar" && styles.segmentHalfActive]}
          >
            <Text style={[styles.segmentLabel, mode === "calendar" && styles.segmentLabelActive]}>
              Calendar
            </Text>
            <Ionicons
              name="calendar-outline"
              size={moderateScale(18)}
              color={mode === "calendar" ? "#666" : "#B4B4B4"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerMonth}>{formatMonthYear(selectedDate)}</Text>
            <Text style={styles.headerSub}>{formatWeekdayDay(selectedDate)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.editButton, deleteMode && styles.editButtonActive]}
            onPress={toggleDeleteMode}
          >
            <Text style={[styles.editButtonText, deleteMode && styles.editButtonTextActive]}>
              {deleteMode ? "Done Deleting" : mode === "schedule" ? "Edit Schedule" : "Edit Calendar"}
            </Text>
            <Ionicons
              name={deleteMode ? "trash-outline" : "settings"}
              size={moderateScale(18)}
              color={deleteMode ? "#D9534F" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {babies.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.babyPicker}>
            {babies.map((b) => (
              <TouchableOpacity
                key={b.baby_id}
                onPress={() => setSelectedBaby(b)}
                style={[styles.babyChip, selectedBaby?.baby_id === b.baby_id && styles.babyChipActive]}
              >
                <Text
                  style={[
                    styles.babyChipText,
                    selectedBaby?.baby_id === b.baby_id && styles.babyChipTextActive,
                  ]}
                >
                  {b.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      {feedback && !modalVisible && (
        <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
          <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
            {feedback.message}
          </Text>
        </View>
      )}

      {mode === "calendar" ? (
        <ScrollView contentContainerStyle={styles.calendarScreen} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionTitlePill}>
            <Text style={styles.sectionTitleText}>{formatMonthYear(selectedDate)}</Text>
          </View>

          <View style={styles.calendarCard}>
            <Calendar
              style={styles.calendar}
              current={selectedDate}
              onDayPress={(d: any) => setSelectedDate(d.dateString)}
              markingType="multi-dot"
              markedDates={{
                ...markedDates,
                [selectedDate]: {
                  ...(markedDates[selectedDate] ?? { dots: [], marked: false }),
                  selected: true,
                  selectedColor: "#2487F0",
                },
              }}
              theme={{
                todayTextColor: colors.primaryDark,
                selectedDayBackgroundColor: "#2487F0",
                arrowColor: colors.primaryDark,
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "700",
                textDayFontWeight: "500",
              }}
            />
          </View>

          <View style={styles.calendarInfoRow}>
            <View style={styles.smallInfoPill}>
              <Text style={styles.smallInfoPillText}>Today</Text>
            </View>
            <View style={[styles.smallInfoPill, styles.smallInfoPillRight]}>
              <Text style={styles.smallInfoPillTextBlue}>{formatWeekdayDay(selectedDate)}</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primaryDark} style={{ marginTop: verticalScale(32) }} />
          ) : selectedEvent ? (
            <View style={styles.upcomingCard}>
              <Text style={styles.upcomingHeadline}>
                Upcoming event: <Text style={styles.upcomingHeadlineLight}>{getDisplayTitle(selectedEvent)}</Text>
              </Text>

              <View style={styles.upcomingMetaTypeRow}>
                <View style={styles.upcomingTypeWrap}>
                  <View
                    style={[
                      styles.typeDotSmall,
                      { backgroundColor: COLORS[selectedEvent.type].dot },
                    ]}
                  />
                  <Text style={styles.upcomingTypeText}>{getTypeLabel(selectedEvent.type)}</Text>
                </View>
              </View>

              <View style={styles.upcomingRowTop}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{selectedEvent.time || "--:--"}</Text>
                </View>
                <View style={styles.peopleWrap}>
                  <Ionicons name="people" size={moderateScale(22)} color="#2F2F2F" />
                  <Text style={styles.peopleCount}>1</Text>
                </View>
              </View>

              <View style={styles.upcomingBodyRow}>
                <View style={styles.instructionsWrap}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  <Text style={styles.instructionsText}>
                    {selectedEvent.description || "No instructions provided."}
                  </Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.completeButton,
                        isEventCompleted(selectedEvent, completedEventKeys) && styles.completeButtonDone,
                      ]}
                      onPress={() => handleToggleComplete(selectedEvent)}
                    >
                      <Text
                        style={[
                          styles.completeButtonText,
                          isEventCompleted(selectedEvent, completedEventKeys) && styles.completeButtonTextDone,
                        ]}
                      >
                        {isEventCompleted(selectedEvent, completedEventKeys) ? "Completed" : "Complete Task"}
                      </Text>
                    </TouchableOpacity>

                    <View
                      style={[
                        styles.clockCircle,
                        isEventCompleted(selectedEvent, completedEventKeys) && styles.clockCircleDone,
                      ]}
                    >
                      <Ionicons
                        name={
                          isEventCompleted(selectedEvent, completedEventKeys)
                            ? "checkmark-done-outline"
                            : "time-outline"
                        }
                        size={moderateScale(22)}
                        color={isEventCompleted(selectedEvent, completedEventKeys) ? "#4E97E8" : "#111"}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.mapWrap}>
                  <View style={styles.fakeMap}>
                    <Ionicons name="location" size={moderateScale(30)} color="#6A9FDB" />
                  </View>
                  <Text style={styles.mapAddress}>Add address here</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={moderateScale(44)} color="#BCD1E7" />
              <Text style={styles.emptyTitle}>No events on this day</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.scheduleLayer}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.timelineScreen}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onLayout={(e) => setTimelineViewportHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.timelineLine} />

            {dayEvents.map((ev, index) => {
              const key = toEventKey(ev);
              const isSelected = key === selectedEventId;
              const isDone = isEventCompleted(ev, completedEventKeys);
              const gapTop = index === 0 ? verticalScale(24) : verticalScale(44);

              return (
                <View
                  key={key}
                  style={[styles.timelineRow, { marginTop: gapTop }]}
                  onLayout={(e) => {
                    timelinePositionsRef.current[key] = {
                      y: e.nativeEvent.layout.y,
                      height: e.nativeEvent.layout.height,
                    };
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.dotWrap,
                      isSelected && styles.dotWrapSelected,
                      isDone && styles.dotWrapDone,
                    ]}
                    disabled={deleteMode}
                    onPress={() => {
                      if (deleteMode) return;
                      setSelectedEventId((prev) => (prev === key ? null : key));
                    }}
                  >
                    {isSelected ? (
                      isDone ? (
                        <Ionicons name="checkmark" size={moderateScale(18)} color="#fff" />
                      ) : (
                        <View style={styles.innerDot} />
                      )
                    ) : isDone ? (
                      <Ionicons name="checkmark" size={moderateScale(18)} color="#fff" />
                    ) : null}
                  </TouchableOpacity>

                  <View style={styles.timelineRightArea}>
                    {isSelected && selectedEvent && toEventKey(selectedEvent) === key ? (
                      <View style={styles.focusCardRow}>
                        <View style={styles.pointerWrap}>
                          <View style={[styles.pointer, selectedIsCompleted && styles.pointerComplete]} />
                        </View>

                        <View style={[styles.focusCard, selectedIsCompleted && styles.focusCardComplete]}>
                          {deleteMode && (
                            <TouchableOpacity
                              style={styles.deleteBadgeFloating}
                              onPress={() => handleDeleteEvent(ev)}
                            >
                              <Ionicons name="close" size={moderateScale(14)} color="#fff" />
                            </TouchableOpacity>
                          )}

                          <View
                            style={[
                              styles.focusHeaderRow,
                              selectedIsCompleted && styles.focusHeaderRowComplete,
                            ]}
                          >
                            <View
                              style={[
                                styles.nextEventPill,
                                selectedIsCompleted && styles.nextEventPillComplete,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.nextEventPillText,
                                  selectedIsCompleted && styles.nextEventPillTextComplete,
                                ]}
                              >
                                {selectedEventTimingLabel}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.focusTime,
                                selectedIsCompleted && styles.focusTimeComplete,
                              ]}
                            >
                              {selectedEvent.time || "--:--"}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.focusTitle,
                              selectedIsCompleted && styles.focusTitleComplete,
                            ]}
                          >
                            {getDisplayTitle(selectedEvent)}
                          </Text>

                          <Text
                            style={[
                              styles.focusDescription,
                              selectedIsCompleted && styles.focusDescriptionComplete,
                            ]}
                          >
                            {selectedEvent.description || "No extra instructions for this event."}
                          </Text>

                          <View style={styles.focusMetaRowLower}>
                            <View style={styles.focusTypeWrap}>
                              <View
                                style={[
                                  styles.typeDot,
                                  { backgroundColor: COLORS[selectedEvent.type].dot },
                                ]}
                              />
                              <Text style={styles.focusTypeText}>
                                {getTypeLabel(selectedEvent.type)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.focusFooterRow}>
                            <TouchableOpacity
                              style={[
                                styles.completeButton,
                                selectedIsCompleted && styles.completeButtonDone,
                              ]}
                              onPress={() => handleToggleComplete(selectedEvent)}
                            >
                              <Text
                                style={[
                                  styles.completeButtonText,
                                  selectedIsCompleted && styles.completeButtonTextDone,
                                ]}
                              >
                                {selectedIsCompleted ? "Completed" : "Complete Task"}
                              </Text>
                            </TouchableOpacity>

                            <View
                              style={[
                                styles.clockCircle,
                                selectedIsCompleted && styles.clockCircleDone,
                              ]}
                            >
                              <Ionicons
                                name={selectedIsCompleted ? "checkmark-done-outline" : "time-outline"}
                                size={moderateScale(22)}
                                color={selectedIsCompleted ? "#4E97E8" : "#111"}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.eventStripRow}>
                          <TouchableOpacity
                            style={[
                              styles.eventStrip,
                              isDone && styles.eventStripDone,
                              deleteMode && styles.eventStripDeleteMode,
                            ]}
                            activeOpacity={deleteMode ? 1 : 0.8}
                            onPress={() => {
                              if (deleteMode) return;
                              setSelectedEventId((prev) => (prev === key ? null : key));
                            }}
                          >
                            <View
                              style={[
                                styles.eventTitleCell,
                                styles.eventTitleCellExpanded,
                                isDone && styles.eventTitleCellDone,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.eventStripText,
                                  isDone && styles.eventStripTextDone,
                                ]}
                                numberOfLines={1}
                              >
                                {getDisplayTitle(ev)}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.eventTimeCell,
                                styles.eventTimeCellRight,
                                isDone && styles.eventTimeCellDone,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.eventStripText,
                                  isDone && styles.eventStripTextDone,
                                ]}
                              >
                                {ev.time || "--:--"}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.stripMetaRow}>
                          <View style={styles.stripTypeWrap}>
                            <View
                              style={[
                                styles.typeDotSmall,
                                { backgroundColor: COLORS[ev.type].dot },
                              ]}
                            />
                            <Text style={styles.stripTypeText}>
                              {getTypeLabel(ev.type)}
                            </Text>
                          </View>

                          {isDone && (
                            <Text style={[styles.statusText, styles.statusTextDone]}>
                              Completed
                            </Text>
                          )}

                          {deleteMode && (
                            <TouchableOpacity
                              style={styles.deleteInlineButton}
                              onPress={() => handleDeleteEvent(ev)}
                            >
                              <Ionicons name="close-circle" size={moderateScale(24)} color="#E35D5B" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {!deleteMode && (() => {
                          const relativeLabel = getRelativeLabel(ev);
                          const timeState = getEventTimeState(ev);

                          if (timeState === "past") {
                            return (
                              <View style={styles.relativeRow}>
                                <Text style={styles.relativeLabelPassed}>Passed</Text>
                                <Ionicons
                                  name="checkmark-done-outline"
                                  size={moderateScale(18)}
                                  color="#8A8A8A"
                                />
                              </View>
                            );
                          }

                          if (!relativeLabel) return null;

                          return (
                            <View style={styles.relativeRow}>
                              <Text style={styles.relativeLabel}>{relativeLabel}</Text>
                              <Ionicons name="time-outline" size={moderateScale(18)} color="#777" />
                            </View>
                          );
                        })()}
                      </>
                    )}
                  </View>
                </View>
              );
            })}

            <View style={{ height: verticalScale(160) }} />
          </ScrollView>

          {showTypeMenu && (
            <View
              style={[
                styles.floatingTypeMenu,
                { bottom: insets.bottom + verticalScale(158) },
              ]}
            >
              {(["activity", "task", "reminder"] as EventType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.floatingTypeOption}
                  onPress={() => {
                    setShowTypeMenu(false);
                    openModal(t);
                  }}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.typeDotSmall,
                      { backgroundColor: COLORS[t].dot, marginRight: scale(8) },
                    ]}
                  />
                  <Ionicons
                    name={COLORS[t].icon as any}
                    size={moderateScale(16)}
                    color={COLORS[t].dot}
                  />
                  <Text style={styles.floatingTypeOptionText}>
                    {getTypeLabel(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.floatingManualButton,
              { bottom: insets.bottom + verticalScale(18) },
            ]}
            onPress={() => setShowTypeMenu((prev) => !prev)}
          >
            <Ionicons
              name={showTypeMenu ? "close" : "add"}
              size={moderateScale(24)}
              color="#fff"
            />
            <Text style={styles.floatingManualButtonText}>
              {showTypeMenu ? "Close" : "Add Manual Event"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <AddEventModal
        visible={modalVisible}
        type={modalType}
        form={form}
        saving={saving}
        selectedDate={selectedDate}
        babies={babies}
        modalBaby={modalBaby}
        feedback={modalVisible ? feedback : null}
        onSelectBaby={(b) => setModalBaby(b)}
        onClose={() => {
          setModalVisible(false);
          setFeedback(null);
        }}
        onSave={handleSave}
        onChange={(key, val) => setForm((f) => ({ ...f, [key]: val }))}
        onChangeDate={(key, date) => setForm((f) => ({ ...f, [key]: date }))}
        onOpenPicker={(key) => setPickerOpen(key)}
      />

      {pickerOpen !== null && (
        <DateTimePicker
          value={pickerValue()}
          mode={pickerOpen.endsWith("Time") ? "time" : "date"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

interface ModalProps {
  visible: boolean;
  type: EventType;
  form: any;
  saving: boolean;
  selectedDate: string;
  babies: any[];
  modalBaby: any;
  feedback: { type: "success" | "error"; message: string } | null;
  onSelectBaby: (b: any) => void;
  onClose: () => void;
  onSave: () => void;
  onChange: (key: string, val: string) => void;
  onChangeDate: (key: string, date: Date | null) => void;
  onOpenPicker: (key: string) => void;
}

function AddEventModal({
  visible,
  type,
  form,
  saving,
  selectedDate,
  babies,
  modalBaby,
  feedback,
  onSelectBaby,
  onClose,
  onSave,
  onChange,
  onChangeDate,
  onOpenPicker,
}: ModalProps) {
  const c = COLORS[type];
  const activityTypes = ["feeding", "sleep", "diaper", "play", "bath", "other"];

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const typeTitle =
    type === "activity"
      ? "Add Activity"
      : type === "task"
      ? "Add Task"
      : "Add Reminder";

  const typeSubtitle =
    type === "activity"
      ? "Log a baby activity for the selected day"
      : type === "task"
      ? "Create a manual task for the schedule"
      : "Create a reminder for the selected day";

  const DtRow = ({
    label,
    value,
    dk,
    tk,
    required,
  }: {
    label: string;
    value: Date;
    dk: string;
    tk: string;
    required?: boolean;
  }) => (
    <View style={styles.modalSectionCard}>
      <Text style={styles.modalSectionLabel}>
        {label}
        {required ? <Text style={styles.requiredStar}> *</Text> : null}
      </Text>

      <View style={styles.modalDtRow}>
        <TouchableOpacity
          style={styles.modalDtBtn}
          onPress={() => onOpenPicker(dk)}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={16} color="#5F8FC8" />
          <Text style={styles.modalDtBtnText}>{fmtDate(value)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modalDtBtn}
          onPress={() => onOpenPicker(tk)}
          activeOpacity={0.85}
        >
          <Ionicons name="time-outline" size={16} color="#5F8FC8" />
          <Text style={styles.modalDtBtnText}>{fmtTime(value)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <LinearGradient
            colors={["#8DBCF1", "#79ADDF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHero}
          >
            <View style={styles.modalHeroCompactRow}>
              <View style={styles.modalHeroLeft}>
                <View style={styles.modalHeroIconWrap}>
                  <Ionicons name={c.icon as any} size={22} color="#FFFFFF" />
                </View>

                <View style={styles.modalHeroTextWrap}>
                  <Text style={styles.modalHeroTitleCompact}>{typeTitle}</Text>
                  <Text style={styles.modalHeroSubtitleCompact}>{typeSubtitle}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.modalCloseButtonCompact}>
                <Ionicons name="close" size={22} color="#5F6E7E" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {feedback && (
              <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
                <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
                  {feedback.message}
                </Text>
              </View>
            )}

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>
                Select Baby <Text style={styles.requiredStar}>*</Text>
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.modalChipRow}>
                  {babies.map((b) => {
                    const active = modalBaby?.baby_id === b.baby_id;
                    return (
                      <TouchableOpacity
                        key={b.baby_id}
                        onPress={() => onSelectBaby(b)}
                        activeOpacity={0.85}
                        style={[
                          styles.modalBabyChip,
                          active && styles.modalBabyChipActive,
                        ]}
                      >
                        <Ionicons
                          name="person-circle-outline"
                          size={15}
                          color={active ? "#FFFFFF" : "#5F8FC8"}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.modalBabyChipText,
                            active && styles.modalBabyChipTextActive,
                          ]}
                        >
                          {b.display_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {type === "activity" ? (
              <>
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionLabel}>
                    Activity Type <Text style={styles.requiredStar}>*</Text>
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.modalChipRow}>
                      {activityTypes.map((at) => {
                        const active = form.activityType === at;
                        return (
                          <TouchableOpacity
                            key={at}
                            onPress={() => onChange("activityType", at)}
                            activeOpacity={0.85}
                            style={[
                              styles.modalTypeChip,
                              active && styles.modalTypeChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.modalTypeChipText,
                                active && styles.modalTypeChipTextActive,
                              ]}
                            >
                              {at.charAt(0).toUpperCase() + at.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <DtRow
                  label="Start Time"
                  required
                  value={form.startTime}
                  dk="startDate"
                  tk="startTime"
                />

                <View style={styles.modalSectionCard}>
                  <View style={styles.endTimeHeaderRow}>
                    <Text style={styles.modalSectionLabel}>End Time</Text>

                    {form.endTime ? (
                      <TouchableOpacity
                        onPress={() => onChangeDate("endTime", null)}
                        style={styles.clearBtn}
                      >
                        <Text style={styles.clearBtnText}>Clear</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => onChangeDate("endTime", new Date(form.startTime))}
                        style={[styles.clearBtn, { borderColor: "#8DBCF1" }]}
                      >
                        <Text style={[styles.clearBtnText, { color: "#5F8FC8" }]}>
                          + Add end time
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {form.endTime && (
                    <View style={styles.modalDtRow}>
                      <TouchableOpacity
                        style={styles.modalDtBtn}
                        onPress={() => onOpenPicker("endDate")}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="calendar-outline" size={16} color="#5F8FC8" />
                        <Text style={styles.modalDtBtnText}>{fmtDate(form.endTime)}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalDtBtn}
                        onPress={() => onOpenPicker("endTime")}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="time-outline" size={16} color="#5F8FC8" />
                        <Text style={styles.modalDtBtnText}>{fmtTime(form.endTime)}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionLabel}>
                    Title <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    value={form.title}
                    onChangeText={(v) => onChange("title", v)}
                    placeholder="Enter title..."
                    placeholderTextColor="#9AA8B6"
                    style={styles.modalInput}
                  />
                </View>

                <DtRow
                  label="Due Date & Time"
                  required
                  value={form.dueAt}
                  dk="dueDate"
                  tk="dueTime"
                />
              </>
            )}

            <View style={styles.modalSectionCard}>
              <Text style={styles.modalSectionLabel}>
                {type === "activity" ? "Notes" : "Description"}
              </Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => onChange("description", v)}
                placeholder={type === "activity" ? "Any notes..." : "More details..."}
                placeholderTextColor="#9AA8B6"
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.modalInputMultiline]}
              />
            </View>

            {type === "task" && (
              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionLabel}>Status</Text>
                <View style={styles.modalChipWrap}>
                  {["pending", "in_progress", "done"].map((s) => {
                    const active = form.status === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => onChange("status", s)}
                        activeOpacity={0.85}
                        style={[
                          styles.modalTypeChip,
                          active && styles.modalTypeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalTypeChipText,
                            active && styles.modalTypeChipTextActive,
                          ]}
                        >
                          {s.replace("_", " ")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn} activeOpacity={0.85}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSave}
              disabled={saving || !modalBaby}
              activeOpacity={0.85}
              style={[
                styles.modalSaveBtn,
                (!modalBaby || saving) && styles.modalSaveBtnDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },

  topShell: {
    paddingHorizontal: scale(10),
    paddingBottom: verticalScale(12),
    borderBottomLeftRadius: moderateScale(34),
    borderBottomRightRadius: moderateScale(34),
  },

  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#A4A4A4",
    overflow: "hidden",
    alignSelf: "center",
    width: "92%",
    maxWidth: 470,
    marginTop: verticalScale(6),
  },

  segmentHalf: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
    paddingVertical: verticalScale(12),
    backgroundColor: "#EFEFEF",
  },

  segmentHalfActive: {
    backgroundColor: "#FFFFFF",
  },

  segmentLabel: {
    fontSize: moderateScale(14),
    color: "#A3A3A3",
    fontWeight: "800",
  },

  segmentLabelActive: {
    color: "#555",
  },

  headerRow: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
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

  editButton: {
    backgroundColor: "#EAEAEA",
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },

  editButtonActive: {
    backgroundColor: "#FFF2F1",
    borderWidth: 1,
    borderColor: "#F1B3AF",
  },

  editButtonText: {
    fontSize: moderateScale(13),
    color: "#666",
    fontWeight: "700",
  },

  editButtonTextActive: {
    color: "#D9534F",
  },

  babyPicker: {
    paddingTop: verticalScale(10),
    paddingHorizontal: scale(10),
  },

  babyChip: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(20),
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    marginRight: scale(8),
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  babyChipActive: {
    backgroundColor: "#FFFFFF",
  },

  babyChipText: {
    fontSize: moderateScale(12),
    color: "#FFF",
    fontWeight: "700",
  },

  babyChipTextActive: {
    color: colors.primaryDark,
  },

  calendarScreen: {
    paddingBottom: verticalScale(32),
  },

  sectionTitlePill: {
    marginTop: verticalScale(18),
    marginLeft: 0,
    backgroundColor: "#89B9ED",
    borderTopRightRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(18),
    alignSelf: "flex-start",
    maxWidth: width * 0.82,
  },

  sectionTitleText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: moderateScale(24),
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowRadius: 2,
  },

  calendarCard: {
    marginHorizontal: scale(10),
    marginTop: verticalScale(6),
    borderRadius: moderateScale(10),
    overflow: "hidden",
    backgroundColor: "#FFF",
  },

  calendar: {
    paddingBottom: verticalScale(6),
  },

  calendarInfoRow: {
    marginTop: verticalScale(16),
    marginLeft: 0,
    marginRight: scale(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: scale(10),
  },

  smallInfoPill: {
    backgroundColor: "#89B9ED",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
  },

  smallInfoPillRight: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: "#B9D2EF",
  },

  smallInfoPillText: {
    color: "#FFF",
    fontSize: moderateScale(21),
    fontWeight: "900",
  },

  smallInfoPillTextBlue: {
    color: "#4F8DD4",
    fontSize: moderateScale(18),
    fontWeight: "800",
  },

  upcomingCard: {
    marginHorizontal: scale(10),
    marginTop: verticalScale(18),
  },

  upcomingHeadline: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#555",
  },

  upcomingHeadlineLight: {
    fontWeight: "500",
    color: "#666",
  },

  upcomingMetaTypeRow: {
    marginTop: verticalScale(10),
  },

  upcomingTypeWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF4FA",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
  },

  upcomingTypeText: {
    marginLeft: scale(5),
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#5F6E7E",
  },

  upcomingRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
    marginTop: verticalScale(14),
  },

  timeBadge: {
    backgroundColor: "#B9D2EF",
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },

  timeBadgeText: {
    fontSize: moderateScale(17),
    fontWeight: "900",
    color: "#4F8DD4",
  },

  peopleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },

  peopleCount: {
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#333",
  },

  upcomingBodyRow: {
    flexDirection: width < 390 ? "column" : "row",
    gap: scale(16),
    marginTop: verticalScale(10),
  },

  instructionsWrap: {
    flex: 1,
  },

  instructionsTitle: {
    fontSize: moderateScale(16),
    fontWeight: "900",
    color: "#555",
    marginBottom: verticalScale(6),
  },

  instructionsText: {
    fontSize: moderateScale(13),
    color: "#555",
    lineHeight: moderateScale(20),
  },

  actionRow: {
    marginTop: verticalScale(14),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(16),
  },

  completeButton: {
    backgroundColor: "#8DBCF1",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(26),
  },

  completeButtonDone: {
    backgroundColor: "#7FB2EF",
  },

  completeButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: moderateScale(12),
  },

  completeButtonTextDone: {
    color: "#FFFFFF",
  },

  clockCircle: {
    width: moderateScale(46),
    height: moderateScale(46),
    borderRadius: moderateScale(23),
    backgroundColor: "#E7E7E7",
    alignItems: "center",
    justifyContent: "center",
  },

  clockCircleDone: {
    backgroundColor: "#EAF3FF",
  },

  mapWrap: {
    width: width < 390 ? "100%" : scale(170),
    alignItems: "center",
  },

  fakeMap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: moderateScale(14),
    backgroundColor: "#C8E1F6",
    borderWidth: 3,
    borderColor: "#83AEDD",
    alignItems: "center",
    justifyContent: "center",
  },

  mapAddress: {
    textAlign: "center",
    marginTop: verticalScale(8),
    fontSize: moderateScale(11),
    color: "#666",
    lineHeight: moderateScale(17),
  },

  scheduleLayer: {
    flex: 1,
  },

  timelineScreen: {
    paddingBottom: verticalScale(220),
    paddingHorizontal: scale(8),
    paddingTop: verticalScale(180),
  },

  timelineLine: {
    position: "absolute",
    left: scale(56),
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#73ADF0",
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dotWrap: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#5A6470",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: scale(32),
    zIndex: 2,
  },

  dotWrapSelected: {
    backgroundColor: "#73ADF0",
    borderWidth: 2,
    borderColor: "#73ADF0",
  },

  dotWrapDone: {
    backgroundColor: "#8DBCF1",
    borderColor: "#8DBCF1",
  },

  innerDot: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: "#5A6470",
  },

  timelineRightArea: {
    flex: 1,
    paddingLeft: scale(8),
    paddingRight: scale(8),
  },

  eventStripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
  },

  eventStrip: {
    flexDirection: "row",
    borderRadius: moderateScale(14),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#AFAFAF",
    minHeight: verticalScale(42),
    maxWidth: width < 370 ? width * 0.62 : width * 0.5,
    backgroundColor: "#FFFFFF",
  },

  eventStripDeleteMode: {
    opacity: 0.95,
  },

  eventStripDone: {
    backgroundColor: "#8DBCF1",
    borderColor: "#77ACEB",
  },

  eventTimeCell: {
    paddingHorizontal: scale(10),
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#B8B8B8",
    minWidth: scale(95),
  },

  eventTimeCellRight: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: "#B8B8B8",
    alignItems: "center",
  },

  eventTimeCellDone: {
    borderRightColor: "rgba(255,255,255,0.5)",
    borderLeftColor: "rgba(255,255,255,0.5)",
  },

  eventTitleCell: {
    paddingHorizontal: scale(10),
    justifyContent: "center",
    flexShrink: 1,
  },

  eventTitleCellExpanded: {
    flex: 1,
  },

  eventTitleCellDone: {
    backgroundColor: "#7FB2EF",
  },

  eventStripText: {
    fontSize: moderateScale(13),
    color: "#666",
    fontWeight: "500",
  },

  eventStripTextDone: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  statusText: {
    fontSize: moderateScale(12),
    color: "#5D9EF0",
    fontWeight: "700",
  },

  statusTextDone: {
    color: "#5D9EF0",
    fontWeight: "800",
  },

  deleteInlineButton: {
    marginLeft: scale(2),
  },

  focusCardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: verticalScale(-10),
  },

  pointerWrap: {
    width: scale(20),
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginRight: scale(2),
    paddingTop: verticalScale(16),
  },

  pointer: {
    width: 0,
    height: 0,
    borderTopWidth: moderateScale(10),
    borderBottomWidth: moderateScale(10),
    borderRightWidth: moderateScale(18),
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: "#D6D6D6",
  },

  pointerComplete: {
    borderRightColor: "#BFD9FA",
  },

  focusCard: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#B2B2B2",
    overflow: "hidden",
    position: "relative",
  },

  focusCardComplete: {
    backgroundColor: "#EEF6FF",
    borderColor: "#A9CCF6",
  },

  focusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#C8C8C8",
  },

  focusHeaderRowComplete: {
    borderBottomColor: "#BDD6F6",
    backgroundColor: "#E8F2FF",
  },

  nextEventPill: {
    backgroundColor: "#89B9ED",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(12),
    borderTopRightRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    maxWidth: "60%",
  },

  nextEventPillComplete: {
    backgroundColor: "#7FB2EF",
  },

  nextEventPillText: {
    fontSize: moderateScale(16),
    color: "#FFF",
    fontWeight: "900",
  },

  nextEventPillTextComplete: {
    color: "#FFFFFF",
  },

  focusTime: {
    paddingHorizontal: scale(14),
    fontSize: moderateScale(14),
    color: "#666",
  },

  focusTimeComplete: {
    color: "#4F8DD4",
    fontWeight: "700",
  },

  focusMetaRowLower: {
    marginTop: verticalScale(10),
    marginHorizontal: scale(16),
  },

  focusTypeWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF4FA",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
  },

  focusTypeText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#5F6E7E",
    marginLeft: scale(6),
  },

  focusTitle: {
    fontSize: moderateScale(17),
    fontWeight: "900",
    color: "#555",
    marginHorizontal: scale(16),
    marginTop: verticalScale(14),
  },

  focusTitleComplete: {
    color: "#4A82C5",
  },

  focusDescription: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
    color: "#555",
    marginHorizontal: scale(16),
    marginTop: verticalScale(8),
  },

  focusDescriptionComplete: {
    color: "#5E7EA6",
  },

  focusFooterRow: {
    marginTop: verticalScale(14),
    marginBottom: verticalScale(14),
    marginHorizontal: scale(16),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  deleteBadgeFloating: {
    position: "absolute",
    top: verticalScale(10),
    right: scale(10),
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "#E35D5B",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },

  stripMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: verticalScale(8),
    marginLeft: scale(12),
    gap: scale(10),
  },

  stripTypeWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F6FA",
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
  },

  stripTypeText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#5F6E7E",
    marginLeft: scale(5),
  },

  typeDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
  },

  typeDotSmall: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },

  relativeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginTop: verticalScale(10),
    marginLeft: scale(12),
  },

  relativeLabel: {
    fontSize: moderateScale(13),
    color: "#7B6A57",
  },

  relativeLabelPassed: {
    fontSize: moderateScale(13),
    color: "#8A8A8A",
    fontWeight: "700",
  },

  floatingManualButton: {
    position: "absolute",
    right: scale(14),
    backgroundColor: "#8DBCF1",
    borderRadius: moderateScale(36),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(15),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    zIndex: 30,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: scale(65),
  },

  floatingManualButtonText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: moderateScale(12),
  },

  floatingTypeMenu: {
    position: "absolute",
    right: scale(14),
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(18),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(8),
    zIndex: 29,
    elevation: 11,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    minWidth: scale(170),
  },

  floatingTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
  },

  floatingTypeOptionText: {
    marginLeft: scale(8),
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#5A6470",
  },

  emptyState: {
    alignItems: "center",
    marginTop: verticalScale(36),
    paddingHorizontal: scale(24),
  },

  emptyTitle: {
    fontSize: moderateScale(16),
    color: "#8FAACA",
    fontWeight: "700",
    marginTop: verticalScale(10),
  },

  feedbackSuccess: {
    backgroundColor: colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.successBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: scale(10),
    marginTop: verticalScale(10),
  },

  feedbackSuccessText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.successDark,
  },

  feedbackError: {
    backgroundColor: colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.errorBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: scale(10),
    marginTop: verticalScale(10),
  },

  feedbackErrorText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.errorDark,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.36)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#EEF4F8",
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    overflow: "hidden",
    maxHeight: height * 0.88,
  },

  modalHero: {
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(12),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
  },

  modalHeroCompactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12),
  },

  modalHeroLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  modalHeroTextWrap: {
    marginLeft: scale(12),
    flex: 1,
  },

  modalHeroIconWrap: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCloseButtonCompact: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "#F3F6F9",
    alignItems: "center",
    justifyContent: "center",
  },

  modalHeroTitleCompact: {
    fontSize: moderateScale(22),
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.14)",
    textShadowRadius: 2,
  },

  modalHeroSubtitleCompact: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(12),
    color: "#EEF6FF",
    lineHeight: moderateScale(16),
  },

  modalScrollContent: {
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(12),
  },

  modalSectionCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#C8D3DD",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(12),
  },

  modalSectionLabel: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#555555",
    marginBottom: verticalScale(8),
  },

  requiredStar: {
    color: "#E35D5B",
  },

  modalChipRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  modalChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  modalBabyChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF5FC",
    borderWidth: 1,
    borderColor: "#BFD2E6",
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    marginRight: scale(8),
  },

  modalBabyChipActive: {
    backgroundColor: "#8DBCF1",
    borderColor: "#8DBCF1",
  },

  modalBabyChipText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#5F8FC8",
  },

  modalBabyChipTextActive: {
    color: "#FFFFFF",
  },

  modalTypeChip: {
    backgroundColor: "#F2F6FA",
    borderWidth: 1,
    borderColor: "#C3D1DE",
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    marginRight: scale(8),
    marginBottom: verticalScale(8),
  },

  modalTypeChipActive: {
    backgroundColor: "#8DBCF1",
    borderColor: "#8DBCF1",
  },

  modalTypeChipText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#5F6E7E",
    textTransform: "capitalize",
  },

  modalTypeChipTextActive: {
    color: "#FFFFFF",
  },

  modalInput: {
    minHeight: verticalScale(46),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#C8D3DD",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(12),
    fontSize: moderateScale(14),
    color: "#444444",
  },

  modalInputMultiline: {
    minHeight: verticalScale(96),
    paddingTop: verticalScale(12),
    textAlignVertical: "top",
  },

  modalDtRow: {
    flexDirection: "row",
    gap: scale(8),
  },

  modalDtBtn: {
    flex: 1,
    minHeight: verticalScale(44),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "#BDD0E3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: scale(10),
    flexDirection: "row",
    alignItems: "center",
  },

  modalDtBtnText: {
    marginLeft: scale(6),
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#5F6E7E",
    flexShrink: 1,
  },

  endTimeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(6),
  },

  clearBtn: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(3),
  },

  clearBtnText: {
    fontSize: moderateScale(11),
    color: "#aaa",
    fontWeight: "600",
  },

  modalFooter: {
    flexDirection: "row",
    gap: scale(10),
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(18),
    backgroundColor: "#EEF4F8",
  },

  modalCancelBtn: {
    flex: 1,
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#E6EBF0",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#66717C",
  },

  modalSaveBtn: {
    flex: 1.35,
    minHeight: verticalScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: "#8DBCF1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },

  modalSaveBtnDisabled: {
    backgroundColor: "#B8C7D6",
  },

  modalSaveBtnText: {
    fontSize: moderateScale(14),
    fontWeight: "900",
    color: "#FFFFFF",
  },
});