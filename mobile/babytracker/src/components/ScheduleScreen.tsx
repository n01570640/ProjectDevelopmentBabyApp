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
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
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

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

type OverrideMap = Record<
  string,
  Partial<ScheduleEvent> & {
    raw?: any;
  }
>;

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

const CALENDAR_SECTION_META = {
  activity: {
    title: "Activities",
    icon: "flash-outline",
    header: "#86B5E7",
    border: "#6CA9EA",
    completedBg: "#8DBCF1",
  },
  task: {
    title: "Tasks",
    icon: "checkmark-circle-outline",
    header: "#F2B652",
    border: "#F0AD42",
    completedBg: "#F6C86C",
  },
  reminder: {
    title: "Reminders",
    icon: "alarm-outline",
    header: "#7BCB96",
    border: "#63B980",
    completedBg: "#8FD5A7",
  },
} as const;

const hexToRgba = (hex: string, alpha: number) => {
  const cleaned = hex.replace('#', '');
  const normalized = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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

const shiftDateString = (date: string, deltaDays: number) => {
  const base = new Date(`${date}T12:00:00`);
  base.setDate(base.getDate() + deltaDays);
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
};

const formatShortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
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

const animateSelection = () => {
  LayoutAnimation.configureNext({
    duration: 280,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
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
  const [displayDate, setDisplayDate] = useState(today);
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
  const [calendarExpandedKeys, setCalendarExpandedKeys] = useState<string[]>([]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [eventOverrides, setEventOverrides] = useState<OverrideMap>({});

  const dateHeaderOpacity = useRef(new Animated.Value(1)).current;
  const dateHeaderTranslateX = useRef(new Animated.Value(0)).current;
  const dateHeaderTranslateY = useRef(new Animated.Value(0)).current;

  const [form, setForm] = useState({
    title: "",
    description: "",
    activityType: "feeding",
    startTime: new Date(),
    endTime: null as Date | null,
    dueAt: new Date(),
    status: "pending",
  });

  const contentOpacityAnim = useRef(new Animated.Value(1)).current;
  const [contentTransitioning, setContentTransitioning] = useState(false);
  const transitionTokenRef = useRef(0);
  const didMountContentTransitionRef = useRef(false);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);


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

  useEffect(() => {
    if (!selectedBaby) return;

    if (!didMountContentTransitionRef.current) {
      didMountContentTransitionRef.current = true;
      return;
    }

    runSceneRefreshTransition();
  }, [selectedDate, selectedBaby?.baby_id, runSceneRefreshTransition]);


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
      .map((ev) => {
        const key = toEventKey(ev);
        const override = eventOverrides[key];
        return override
          ? {
              ...ev,
              ...override,
              raw: {
                ...ev.raw,
                ...(override.raw ?? {}),
              },
            }
          : ev;
      })
      .filter((ev) => !hiddenEventKeys.includes(toEventKey(ev)))
      .sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
  }, [activities, tasks, reminders, hiddenEventKeys, eventOverrides]);

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

  const calendarSections = useMemo(
    () =>
      (["activity", "task", "reminder"] as EventType[])
        .map((type) => ({
          type,
          events: dayEvents.filter((ev) => ev.type === type),
        }))
        .filter((section) => section.events.length > 0),
    [dayEvents]
  );

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return dayEvents.find((ev) => toEventKey(ev) === selectedEventId) ?? null;
  }, [dayEvents, selectedEventId]);

  const nextUpcomingEventKey = useMemo(() => {
    const now = Date.now();
    const nextUpcoming = dayEvents.find(
      (ev) => getEventTimestamp(ev) >= now && !isEventCompleted(ev, completedEventKeys)
    );
    return nextUpcoming ? toEventKey(nextUpcoming) : null;
  }, [dayEvents, completedEventKeys]);

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
    setCalendarExpandedKeys([]);
  }, [selectedDate, selectedBaby?.baby_id]);

  useEffect(() => {
    if (mode !== "schedule") return;
    if (selectedDate !== today) return;
    if (!dayEvents.length) return;
    if (hasInitializedTodaySelection.current) return;

    const now = Date.now();
    const nextUpcoming =
      dayEvents.find(
        (ev) => getEventTimestamp(ev) >= now && !isEventCompleted(ev, completedEventKeys)
      ) ??
      dayEvents.find((ev) => !isEventCompleted(ev, completedEventKeys)) ??
      dayEvents[0];

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
  }, [mode, today, selectedDate, dayEvents, timelineViewportHeight, completedEventKeys]);

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

  const openEditModal = (ev: ScheduleEvent) => {
    setEditingEvent(ev);
    setModalType(ev.type);
    setModalBaby(selectedBaby ?? babies[0] ?? null);

    const startIso = ev.type === "activity" ? ev.raw?.start_time : ev.raw?.due_at;
    const endIso = ev.type === "activity" ? ev.raw?.end_time : null;
    const baseDate = parseDateSafe(startIso) ?? new Date(`${selectedDate}T09:00:00`);

    setForm({
      title: ev.type === "activity" ? "" : ev.title ?? "",
      description: ev.type === "activity" ? ev.raw?.notes ?? "" : ev.description ?? "",
      activityType: ev.type === "activity" ? ev.raw?.activity_type ?? "feeding" : "feeding",
      startTime: baseDate,
      endTime: endIso ? parseDateSafe(endIso) : null,
      dueAt: baseDate,
      status: ev.type === "task" ? ev.raw?.status ?? "pending" : "pending",
    });

    setEditModalVisible(true);
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

  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    setSaving(true);
    try {
      const key = toEventKey(editingEvent);

      if (editingEvent.type === "activity") {
        const startIso = form.startTime.toISOString();
        const endIso = form.endTime ? form.endTime.toISOString() : null;

        setEventOverrides((prev) => ({
          ...prev,
          [key]: {
            title: activityLabel(form.activityType),
            description: form.description || undefined,
            date: toDateStr(startIso),
            time: toTimeStr(startIso),
            raw: {
              ...editingEvent.raw,
              activity_type: form.activityType,
              start_time: startIso,
              end_time: endIso,
              notes: form.description || null,
            },
          },
        }));
      } else if (editingEvent.type === "task") {
        const dueIso = form.dueAt.toISOString();

        setEventOverrides((prev) => ({
          ...prev,
          [key]: {
            title: form.title,
            description: form.description || undefined,
            date: toDateStr(dueIso),
            time: toTimeStr(dueIso),
            raw: {
              ...editingEvent.raw,
              title: form.title,
              description: form.description || null,
              due_at: dueIso,
              status: form.status,
            },
          },
        }));
      } else {
        const dueIso = form.dueAt.toISOString();

        setEventOverrides((prev) => ({
          ...prev,
          [key]: {
            title: form.title,
            description: form.description || undefined,
            date: toDateStr(dueIso),
            time: toTimeStr(dueIso),
            raw: {
              ...editingEvent.raw,
              title: form.title,
              body: form.description || null,
              due_at: dueIso,
            },
          },
        }));
      }

      animateSelection();
      setEditModalVisible(false);
      setFeedback({ type: "success", message: "Event updated in the current schedule view." });
    } catch (e: any) {
      setFeedback({ type: "error", message: e?.message ?? "Failed to update event." });
    } finally {
      setSaving(false);
      setEditingEvent(null);
    }
  };


  const runSceneRefreshTransition = useCallback(
    async (work?: () => Promise<void> | void) => {
      const myToken = Date.now();
      transitionTokenRef.current = myToken;

      Animated.timing(contentOpacityAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(async () => {
        if (transitionTokenRef.current !== myToken) return;
        setContentTransitioning(true);

        if (work) {
          await Promise.resolve(work());
        } else {
          await new Promise((resolve) => setTimeout(resolve, 180));
        }

        if (transitionTokenRef.current !== myToken) return;
        setContentTransitioning(false);

        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    },
    [contentOpacityAnim]
  );

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
            animateSelection();
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
    LayoutAnimation.configureNext({
      duration: 1000,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setDeleteMode((prev) => !prev);
  };

  const handleSelectEvent = (key: string) => {
    animateSelection();
    setSelectedEventId((prev) => (prev === key ? null : key));
  };

  const animateDateHeaderChange = (
    nextDate: string,
    direction: "left" | "right" | "up" | "down"
  ) => {
    if (nextDate === selectedDate) return;

    animateSelection();
    hasInitializedTodaySelection.current = false;
    setSelectedEventId(null);

    const outX = direction === "right" ? 18 : direction === "left" ? -18 : 0;
    const outY = direction === "down" ? 18 : direction === "up" ? -18 : 0;
    const inX = direction === "right" ? -18 : direction === "left" ? 18 : 0;
    const inY = direction === "down" ? -18 : direction === "up" ? 18 : 0;

    Animated.parallel([
      Animated.timing(dateHeaderOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dateHeaderTranslateX, {
        toValue: outX,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dateHeaderTranslateY, {
        toValue: outY,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayDate(nextDate);
      setSelectedDate(nextDate);

      dateHeaderTranslateX.setValue(inX);
      dateHeaderTranslateY.setValue(inY);

      Animated.parallel([
        Animated.timing(dateHeaderOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dateHeaderTranslateX, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dateHeaderTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const changeSelectedDate = (deltaDays: number) => {
    const nextDate = shiftDateString(selectedDate, deltaDays);
    animateDateHeaderChange(nextDate, deltaDays > 0 ? "right" : "left");
  };

  const handleCalendarDateChange = (nextDate: string) => {
    if (nextDate === selectedDate) return;
    const direction = new Date(`${nextDate}T12:00:00`).getTime() >= new Date(`${selectedDate}T12:00:00`).getTime()
      ? "down"
      : "up";
    animateDateHeaderChange(nextDate, direction);
  };

  const toggleCalendarExpanded = (key: string) => {
    LayoutAnimation.configureNext({
      duration: 320,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.82,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setCalendarExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectedIsCompleted = isEventCompleted(selectedEvent, completedEventKeys);
  const modeAnim = useRef(new Animated.Value(mode === "schedule" ? 0 : 1)).current;
  const editModeAnim = useRef(new Animated.Value(deleteMode ? 1 : 0)).current;
  const [showEditIcons, setShowEditIcons] = useState(deleteMode);

  useEffect(() => {
    if (deleteMode) {
      setShowEditIcons(true);
    }

    Animated.timing(editModeAnim, {
      toValue: deleteMode ? 1 : 0,
      duration: 1000,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!deleteMode) {
        setShowEditIcons(false);
      }
    });
  }, [deleteMode, editModeAnim]);

  useEffect(() => {
    Animated.timing(modeAnim, {
      toValue: mode === "schedule" ? 0 : 1,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, modeAnim]);

  const scheduleScreenAnimatedStyle = {
    opacity: modeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateX: modeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -24],
        }),
      },
    ],
  };

  const calendarScreenAnimatedStyle = {
    opacity: modeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateX: modeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };

  const segmentIndicatorStyle = {
    transform: [
      {
        translateX: modeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, width * 0.46],
        }),
      },
    ],
  };

  const scheduleTabContentStyle = {
    transform: [
      {
        translateY: modeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [verticalScale(-2), verticalScale(2)],
        }),
      },
    ],
  };

  const calendarTabContentStyle = {
    transform: [
      {
        translateY: modeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [verticalScale(2), verticalScale(-2)],
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
        <View style={styles.segmentedControl}>
          <Animated.View style={[styles.segmentIndicator, segmentIndicatorStyle]} />

          <TouchableOpacity
            onPress={() => setMode("schedule")}
            style={styles.segmentHalf}
            activeOpacity={0.9}
          >
            <Animated.View style={[styles.segmentTabContent, scheduleTabContentStyle]}>
              <Text style={[styles.segmentLabel, mode === "schedule" && styles.segmentLabelActive]}>
                Daily Schedule
              </Text>
              <Ionicons
                name="list"
                size={moderateScale(18)}
                color={mode === "schedule" ? "#4F8DD4" : "#B4B4B4"}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("calendar")}
            style={styles.segmentHalf}
            activeOpacity={0.9}
          >
            <Animated.View style={[styles.segmentTabContent, calendarTabContentStyle]}>
              <Text style={[styles.segmentLabel, mode === "calendar" && styles.segmentLabelActive]}>
                Calendar
              </Text>
              <Ionicons
                name="calendar-outline"
                size={moderateScale(18)}
                color={mode === "calendar" ? "#4F8DD4" : "#B4B4B4"}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerDateControlWrap}>
            <TouchableOpacity
              style={styles.headerDateChevronButton}
              onPress={() => changeSelectedDate(-1)}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={moderateScale(18)} color="#EAF3FF" />
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.headerDateTextWrap,
                {
                  opacity: dateHeaderOpacity,
                  transform: [
                    { translateX: dateHeaderTranslateX },
                    { translateY: dateHeaderTranslateY },
                  ],
                },
              ]}
            >
              <Text style={styles.headerMonth}>{formatMonthYear(displayDate)}</Text>
              <Text style={styles.headerSub}>{formatWeekdayDay(displayDate)}</Text>
            </Animated.View>

            <TouchableOpacity
              style={styles.headerDateChevronButton}
              onPress={() => changeSelectedDate(1)}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-forward" size={moderateScale(18)} color="#EAF3FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActionsCol}>
            <TouchableOpacity
              style={[styles.editButton, deleteMode && styles.editButtonActive]}
              onPress={toggleDeleteMode}
            >
              <Text style={[styles.editButtonText, deleteMode && styles.editButtonTextActive]}>
                {deleteMode ? "Done Editing" : mode === "schedule" ? "Edit Schedule" : "Edit Calendar"}
              </Text>
              <Ionicons
                name={deleteMode ? "create-outline" : "settings"}
                size={moderateScale(18)}
                color={deleteMode ? "#4F8DD4" : "#666"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {babies.length > 1 && (
          <HorizontalChevronScroll contentContainerStyle={styles.babyPicker}>
            {babies.map((b) => (
              <TouchableOpacity
                key={b.baby_id}
                onPress={() => {
                  if (selectedBaby?.baby_id === b.baby_id) return;
                  setSelectedBaby(b);
                }}
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
          </HorizontalChevronScroll>
        )}
      </LinearGradient>

      {feedback && !modalVisible && !editModalVisible && (
        <View style={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
          <Text style={feedback.type === "success" ? styles.feedbackSuccessText : styles.feedbackErrorText}>
            {feedback.message}
          </Text>
        </View>
      )}

      <View style={styles.modeContent}>
      <Animated.View style={[styles.sceneContentFadeLayer, { opacity: contentOpacityAnim }]}>
      <Animated.View style={[styles.modeScene, styles.calendarScene, calendarScreenAnimatedStyle]} pointerEvents={mode === "calendar" ? "auto" : "none"}>
        <ScrollView
          contentContainerStyle={[
            styles.calendarScreen,
            { paddingBottom: insets.bottom + verticalScale(118) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.calendarCard}>
            <Calendar
              style={styles.calendar}
              current={selectedDate}
              onDayPress={(d: any) => handleCalendarDateChange(d.dateString)}
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

          {loading ? (
            <ActivityIndicator size="large" color={colors.primaryDark} style={{ marginTop: verticalScale(32) }} />
          ) : calendarSections.length > 0 ? (
            <View style={styles.calendarAgendaWrap}>
              {calendarSections.map((section) => (
                <CalendarEventSection
                  key={section.type}
                  type={section.type}
                  events={section.events}
                  selectedBabyName={selectedBaby?.display_name || "Baby"}
                  deleteMode={deleteMode}
                  completedEventKeys={completedEventKeys}
                  expandedKeys={calendarExpandedKeys}
                  onToggleExpanded={toggleCalendarExpanded}
                  onToggleComplete={handleToggleComplete}
                  onEdit={openEditModal}
                  onDelete={handleDeleteEvent}
                  editModeAnim={editModeAnim}
                  showEditIcons={showEditIcons}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={moderateScale(44)} color="#BCD1E7" />
              <Text style={styles.emptyTitle}>No events on this day</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.modeScene, styles.scheduleScene, scheduleScreenAnimatedStyle]} pointerEvents={mode === "schedule" ? "auto" : "none"}>
        <View style={styles.scheduleLayer}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.timelineScreen,
              { paddingBottom: insets.bottom + verticalScale(122) },
              dayEvents.length === 0 && styles.timelineScreenEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={dayEvents.length > 0}
            bounces={dayEvents.length > 0}
            scrollEventThrottle={16}
            onLayout={(e) => setTimelineViewportHeight(e.nativeEvent.layout.height)}
          >
            {dayEvents.length > 0 && (
              <>
                <AnimatedTimelineRail />
                <View style={styles.dayBoundaryStartWrap} pointerEvents="none">
                  <View style={styles.dayBoundaryRow}>
                    <Ionicons name="sunny-outline" size={moderateScale(22)} color="rgba(113, 145, 181, 0.62)" />
                    <Text style={styles.dayBoundaryText}>Start of the day</Text>
                  </View>
                </View>
              </>
            )}

            {dayEvents.length === 0 ? (
              <View style={styles.emptyScheduleWrap}>
                <Ionicons name="time-outline" size={moderateScale(42)} color="#AFC7E4" />
                <Text style={styles.emptyScheduleTitle}>No events yet for this day</Text>
                <Text style={styles.emptyScheduleText}>
                  No events are happening yet. Create one to start building the day.
                </Text>
              </View>
            ) : (
              dayEvents.map((ev, index) => {
                const key = toEventKey(ev);
                return (
                  <TimelineEventRow
                    key={key}
                    ev={ev}
                    index={index}
                    deleteMode={deleteMode}
                    isSelected={key === selectedEventId}
                    isDone={isEventCompleted(ev, completedEventKeys)}
                    selectedEvent={selectedEvent}
                    selectedEventTimingLabel={selectedEventTimingLabel}
                    selectedIsCompleted={selectedIsCompleted}
                    completedEventKeys={completedEventKeys}
                    isNextUpcoming={key === nextUpcomingEventKey}
                    onSelectEvent={handleSelectEvent}
                    onEdit={openEditModal}
                    onDelete={handleDeleteEvent}
                    onToggleComplete={handleToggleComplete}
                    editModeAnim={editModeAnim}
                    showEditIcons={showEditIcons}
                    onMeasure={(layout) => {
                      timelinePositionsRef.current[key] = layout;
                    }}
                  />
                );
              })
            )}

            {dayEvents.length > 0 && (
              <View style={styles.dayBoundaryEndWrap} pointerEvents="none">
                <View style={styles.dayBoundaryRow}>
                  <Ionicons name="moon-outline" size={moderateScale(22)} color="rgba(113, 145, 181, 0.62)" />
                  <Text style={styles.dayBoundaryText}>End of the day</Text>
                </View>
              </View>
            )}

            <View style={{ height: insets.bottom + verticalScale(72) }} />
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
              size={moderateScale(20)}
              color="#fff"
            />
            <Text style={styles.floatingManualButtonText}>
              {showTypeMenu ? "Close" : "Add Manual Event"}
            </Text>
          </TouchableOpacity>

        </View>
      </Animated.View>
      </Animated.View>

      {contentTransitioning && (
        <View style={styles.sceneLoadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      )}
      </View>

      <AddEventModal
        visible={modalVisible}
        type={modalType}
        form={form}
        saving={saving}
        selectedDate={selectedDate}
        babies={babies}
        modalBaby={modalBaby}
        feedback={modalVisible ? feedback : null}
        modeLabel="Create"
        saveLabel="Save Event"
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

      <AddEventModal
        visible={editModalVisible}
        type={modalType}
        form={form}
        saving={saving}
        selectedDate={selectedDate}
        babies={babies}
        modalBaby={modalBaby}
        feedback={editModalVisible ? feedback : null}
        modeLabel="Edit"
        saveLabel="Update Event"
        onSelectBaby={(b) => setModalBaby(b)}
        onClose={() => {
          setEditModalVisible(false);
          setFeedback(null);
          setEditingEvent(null);
        }}
        onSave={handleSaveEdit}
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


function AnimatedScaleButton({
  children,
  onPress,
  style,
  activeOpacity = 0.9,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  activeOpacity?: number;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.94,
      speed: 28,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      speed: 24,
      bounciness: 7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale: pressAnim }] }]}> 
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

function CalendarChevronIcon({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) {
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            }),
          },
        ],
      }}
    >
      <Ionicons name="chevron-down" size={moderateScale(20)} color={color} />
    </Animated.View>
  );
}

function CalendarExpandedBody({
  expanded,
  isCompleted,
  description,
  onToggleComplete,
}: {
  expanded: boolean;
  isCompleted: boolean;
  description: string;
  onToggleComplete: () => void;
}) {
  const bodyAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bodyAnim, {
      toValue: expanded ? 1 : 0,
      duration: expanded ? 260 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [expanded, bodyAnim]);

  return (
    <Animated.View
      pointerEvents={expanded ? 'auto' : 'none'}
      style={[
        styles.calendarExpandedBodyWrap,
        {
          maxHeight: bodyAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, verticalScale(140)],
          }),
          opacity: bodyAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.calendarExpandedBody,
          {
            transform: [
              {
                translateY: bodyAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-verticalScale(8), 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.calendarDescriptionText, isCompleted && styles.calendarDescriptionTextCompleted]}>
          {description}
        </Text>

        <AnimatedScaleButton
          style={[
            styles.calendarCompleteButton,
            isCompleted && styles.calendarCompleteButtonDone,
            { backgroundColor: isCompleted ? hexToRgba('#FFFFFF', 0.22) : '#D9D9D9' },
          ]}
          onPress={onToggleComplete}
        >
          <View style={styles.calendarCompleteButtonInner}>
            <Ionicons
              name="checkmark"
              size={moderateScale(24)}
              color={isCompleted ? '#FFFFFF' : '#111111'}
            />
          </View>
        </AnimatedScaleButton>
      </Animated.View>
    </Animated.View>
  );
}

function AnimatedTimelineRail() {
  const endAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(endAnim, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [endAnim]);

  const topTranslateY = endAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, verticalScale(14)],
  });

  const bottomTranslateY = endAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -verticalScale(14)],
  });

  return (
    <View style={styles.timelineRailWrap} pointerEvents="none">
      <Animated.View style={[styles.timelineFadeTop, { transform: [{ translateY: topTranslateY }] }]}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <View
            key={`top-${idx}`}
            style={[
              styles.timelineFadeDot,
              { opacity: 0.18 + idx * 0.08 },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.timelineLineSolid}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <Ionicons
            key={`chev-${idx}`}
            name="chevron-down"
            size={moderateScale(8)}
            color="rgba(255,255,255,0.55)"
            style={styles.timelineLineChevron}
          />
        ))}
      </View>

      <Animated.View style={[styles.timelineFadeBottom, { transform: [{ translateY: bottomTranslateY }] }]}>
        {Array.from({ length: 16 }).map((_, idx) => (
          <View
            key={`bottom-${idx}`}
            style={[
              styles.timelineFadeDot,
              { opacity: 0.74 - idx * 0.08 },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function TimelineEventRow({
  ev,
  index,
  deleteMode,
  isSelected,
  isDone,
  selectedEvent,
  selectedEventTimingLabel,
  selectedIsCompleted,
  completedEventKeys,
  isNextUpcoming,
  onSelectEvent,
  onEdit,
  onDelete,
  onToggleComplete,
  editModeAnim,
  showEditIcons,
  onMeasure,
}: {
  ev: ScheduleEvent;
  index: number;
  deleteMode: boolean;
  isSelected: boolean;
  isDone: boolean;
  selectedEvent: ScheduleEvent | null;
  selectedEventTimingLabel: string;
  selectedIsCompleted: boolean;
  completedEventKeys: string[];
  isNextUpcoming: boolean;
  onSelectEvent: (key: string) => void;
  onEdit: (ev: ScheduleEvent) => void;
  onDelete: (ev: ScheduleEvent) => void;
  onToggleComplete: (ev: ScheduleEvent) => void;
  editModeAnim: Animated.Value;
  showEditIcons: boolean;
  onMeasure: (layout: { y: number; height: number }) => void;
}) {
  const key = toEventKey(ev);
  const gapTop = index === 0 ? verticalScale(24) : verticalScale(44);
  const anim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const nextPulseAnim = useRef(new Animated.Value(0.55)).current;
  const nextPulseScale = nextPulseAnim.interpolate({
    inputRange: [0.4, 0.92],
    outputRange: [0.85, 1.25],
  });

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isSelected ? 1 : 0,
      duration: 390,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, isSelected]);

  useEffect(() => {
    if (!isNextUpcoming || isDone) {
      nextPulseAnim.stopAnimation();
      nextPulseAnim.setValue(0.55);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nextPulseAnim, {
          toValue: 0.92,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nextPulseAnim, {
          toValue: 0.4,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [isNextUpcoming, isSelected, nextPulseAnim]);

  const displayEvent = isSelected && selectedEvent && toEventKey(selectedEvent) === key ? selectedEvent : ev;
  const animatedCardStyle = {
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };



  const topEditIconsStyle = {
    opacity: editModeAnim,
    transform: [
      {
        translateY: editModeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-12, 0],
        }),
      },
    ],
  };

  const inlineEditIconsStyle = {
    opacity: editModeAnim,
    transform: [
      {
        translateY: editModeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <View
      style={[styles.timelineRow, { marginTop: gapTop }]}
      onLayout={(e) => {
        onMeasure({
          y: e.nativeEvent.layout.y,
          height: e.nativeEvent.layout.height,
        });
      }}
    >
      <TouchableOpacity
        style={[
          styles.dotWrap,
          isSelected && styles.dotWrapSelected,
          isDone && styles.dotWrapDone,
          isNextUpcoming && !isDone && styles.dotWrapUpcoming,
        ]}
        disabled={deleteMode}
        onPress={() => {
          if (deleteMode) return;
          onSelectEvent(key);
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

        {isNextUpcoming && !isDone && (
          <View style={styles.upcomingDotPulseWrap}>
            <Animated.View
              style={[
                styles.upcomingDotPulse,
                {
                  opacity: nextPulseAnim,
                  transform: [{ scale: nextPulseScale }],
                },
              ]}
            />
            <View
              style={[
                styles.upcomingDotCore,
                isSelected && styles.upcomingDotCoreSelected,
              ]}
            />
          </View>
        )}
      </TouchableOpacity>

      <Animated.View style={[styles.timelineRightArea, animatedCardStyle]}>
        {isSelected && displayEvent ? (
          <View style={styles.focusCardRow}>
            <View style={styles.pointerWrap}>
              <View style={[styles.pointer, selectedIsCompleted && styles.pointerComplete]} />
            </View>

            <View style={[styles.focusCard, selectedIsCompleted && styles.focusCardComplete]}>
              {showEditIcons && (
                <Animated.View pointerEvents={deleteMode ? "auto" : "none"} style={[styles.editDeleteFloatingRow, topEditIconsStyle]}>
                  <TouchableOpacity style={styles.editActionButton} onPress={() => onEdit(ev)}>
                    <Ionicons name="create-outline" size={moderateScale(20)} color="#6B9FDE" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteActionButton} onPress={() => onDelete(ev)}>
                    <Ionicons name="close-circle" size={moderateScale(24)} color="#E35D5B" />
                  </TouchableOpacity>
                </Animated.View>
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
                  {displayEvent.time || "--:--"}
                </Text>
              </View>

              <Text
                style={[
                  styles.focusTitle,
                  selectedIsCompleted && styles.focusTitleComplete,
                ]}
              >
                {getDisplayTitle(displayEvent)}
              </Text>

              <Text
                style={[
                  styles.focusDescription,
                  selectedIsCompleted && styles.focusDescriptionComplete,
                ]}
              >
                {displayEvent.description || "No extra instructions for this event."}
              </Text>

              <View style={styles.focusMetaRowLower}>
                <View style={styles.focusTypeWrap}>
                  <View
                    style={[
                      styles.typeDot,
                      { backgroundColor: COLORS[displayEvent.type].dot },
                    ]}
                  />
                  <Text style={styles.focusTypeText}>{getTypeLabel(displayEvent.type)}</Text>
                </View>
              </View>

              <View style={styles.focusFooterRow}>
                <AnimatedScaleButton
                  style={[
                    styles.completeButton,
                    selectedIsCompleted && styles.completeButtonDone,
                  ]}
                  onPress={() => onToggleComplete(displayEvent)}
                >
                  <View style={styles.completeButtonInner}>
                    <Text
                      style={[
                        styles.completeButtonText,
                        selectedIsCompleted && styles.completeButtonTextDone,
                      ]}
                    >
                      {selectedIsCompleted ? "Completed" : "Complete Task"}
                    </Text>
                  </View>
                </AnimatedScaleButton>

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
                  onSelectEvent(key);
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
                    style={[styles.eventStripText, isDone && styles.eventStripTextDone]}
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
                  <Text style={[styles.eventStripText, isDone && styles.eventStripTextDone]}>
                    {ev.time || "--:--"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.stripMetaRow}>
              <View style={styles.stripTypeWrap}>
                <View style={[styles.typeDotSmall, { backgroundColor: COLORS[ev.type].dot }]} />
                <Text style={styles.stripTypeText}>{getTypeLabel(ev.type)}</Text>
              </View>

              {isDone && <Text style={[styles.statusText, styles.statusTextDone]}>Completed</Text>}

              {showEditIcons && (
                <Animated.View pointerEvents={deleteMode ? "auto" : "none"} style={[styles.inlineEditDeleteRow, inlineEditIconsStyle]}>
                  <TouchableOpacity style={styles.editActionButton} onPress={() => onEdit(ev)}>
                    <Ionicons name="create-outline" size={moderateScale(20)} color="#6B9FDE" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteActionButton} onPress={() => onDelete(ev)}>
                    <Ionicons name="close-circle" size={moderateScale(24)} color="#E35D5B" />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            {(() => {
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
      </Animated.View>
    </View>
  );
}


function FadingCellText({
  text,
  width,
  color,
  fontSize,
  fontWeight,
  expanded,
  fadeColor = "#F3F3F3",
}: {
  text: string;
  width: number | string;
  color: string;
  fontSize: number;
  fontWeight: any;
  expanded?: boolean;
  fadeColor?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [currentShift, setCurrentShift] = useState(0);
  const shouldAnimate = expanded && text.length > 14;
  const distance = Math.max(0, (text.length - 14) * scale(5.5));

  useEffect(() => {
    const id = anim.addListener(({ value }) => setCurrentShift(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    if (!shouldAnimate) {
      anim.stopAnimation();
      anim.setValue(0);
      setCurrentShift(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(anim, {
          toValue: -distance,
          duration: 2600,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
      ])
    );

    loop.start();
    return () => {
      loop.stop();
      anim.setValue(0);
      setCurrentShift(0);
    };
  }, [anim, shouldAnimate, text, distance]);

  const showRightFade = text.length > 14 && !expanded;
  const showLeftFade = false;

  return (
    <View style={[styles.fadeTextWrap, { width }]}>
      <Animated.Text
        numberOfLines={1}
        style={{
          color,
          fontSize,
          fontWeight,
          width: "100%",
          transform: [{ translateX: anim }],
        }}
      >
        {text}
      </Animated.Text>

      {showLeftFade && (
        <LinearGradient
          pointerEvents="none"
          colors={[fadeColor, hexToRgba(fadeColor, 0)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fadeTextOverlay, styles.fadeTextOverlayLeft]}
        />
      )}

      {showRightFade && (
        <LinearGradient
          pointerEvents="none"
          colors={[hexToRgba(fadeColor, 0), fadeColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fadeTextOverlay, styles.fadeTextOverlayRight]}
        />
      )}
    </View>
  );
}

function CalendarEventSection({
  type,
  events,
  selectedBabyName,
  deleteMode,
  completedEventKeys,
  expandedKeys,
  onToggleExpanded,
  onToggleComplete,
  onEdit,
  onDelete,
  editModeAnim,
  showEditIcons,
}: {
  type: EventType;
  events: ScheduleEvent[];
  selectedBabyName: string;
  deleteMode: boolean;
  completedEventKeys: string[];
  expandedKeys: string[];
  onToggleExpanded: (key: string) => void;
  onToggleComplete: (ev: ScheduleEvent) => void;
  onEdit: (ev: ScheduleEvent) => void;
  onDelete: (ev: ScheduleEvent) => void;
  editModeAnim: Animated.Value;
  showEditIcons: boolean;
}) {
  const completeAnims = useRef<Record<string, Animated.Value>>({}).current;
  const meta = CALENDAR_SECTION_META[type];
  const isActivity = type === "activity";
  const titleWidth = isActivity ? (width < 390 ? scale(150) : scale(180)) : (width < 390 ? scale(174) : scale(206));
  const nameWidth = isActivity ? scale(92) : scale(84);

  return (
    <View style={styles.calendarSectionWrap}>
      <LinearGradient
        colors={[meta.header, meta.header]}
        style={styles.calendarSectionHeader}
      >
        <Text style={styles.calendarSectionHeaderText}>{meta.title}</Text>
        <View style={styles.calendarSectionHeaderRight}>
          <Text style={styles.calendarSectionCountText}>{events.length}</Text>
          <Ionicons name={meta.icon as any} size={moderateScale(20)} color="#FFFFFF" />
        </View>
      </LinearGradient>

      {events.map((ev) => {
        const key = toEventKey(ev);
        const expanded = expandedKeys.includes(key);
        const isCompleted = isEventCompleted(ev, completedEventKeys);
        const completedBg = meta.completedBg;
        const panelBg = isCompleted ? completedBg : "#F3F3F3";
        const lineColor = isCompleted ? hexToRgba("#FFFFFF", 0.55) : meta.border;
        const calendarActionsStyle = {
          opacity: editModeAnim,
          transform: [
            {
              translateY: editModeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-10, 0],
              }),
            },
          ],
        };
        const completeAnim = completeAnims[key] || (completeAnims[key] = new Animated.Value(1));

        return (
          <Animated.View
            key={key}
            style={[
              styles.calendarItemWrap,
              deleteMode && styles.calendarItemWrapEditMode,
              {
                transform: [
                  {
                    translateY: editModeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {showEditIcons && (
              <Animated.View pointerEvents={deleteMode ? "auto" : "none"} style={[styles.calendarItemActions, calendarActionsStyle]}>
                <TouchableOpacity style={styles.editActionButton} onPress={() => onEdit(ev)}>
                  <Ionicons name="create-outline" size={moderateScale(20)} color="#6B9FDE" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteActionButton} onPress={() => onDelete(ev)}>
                  <Ionicons name="close-circle" size={moderateScale(24)} color="#E35D5B" />
                </TouchableOpacity>
              </Animated.View>
            )}

            <View
              style={[
                styles.calendarEventCard,
                { borderColor: lineColor, backgroundColor: panelBg },
                expanded && styles.calendarEventCardExpanded,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => onToggleExpanded(key)}
                style={[styles.calendarEventTopRow, { borderBottomColor: expanded ? lineColor : "transparent" }]}
              >
                <View
                  style={[
                    styles.calendarTitleCell,
                    !isActivity && styles.calendarTitleCellWide,
                    { borderRightColor: lineColor },
                  ]}
                >
                  <FadingCellText
                    text={getDisplayTitle(ev)}
                    width="100%"
                    color={isCompleted ? '#FFFFFF' : '#5A5A5A'}
                    fontSize={moderateScale(13)}
                    fontWeight="700"
                    expanded={expanded}
                    fadeColor={panelBg}
                  />
                </View>

                <View
                  style={[
                    styles.calendarNameCell,
                    !isActivity && styles.calendarNameCellCompact,
                    { borderRightColor: lineColor },
                  ]}
                >
                  <FadingCellText
                    text={selectedBabyName}
                    width="100%"
                    color={isCompleted ? '#FFFFFF' : '#737373'}
                    fontSize={moderateScale(13)}
                    fontWeight="400"
                    expanded={expanded}
                    fadeColor={panelBg}
                  />
                </View>

                <View style={styles.calendarTimeCell}>
                  <Ionicons name="time-outline" size={moderateScale(16)} color={isCompleted ? '#FFFFFF' : '#6D6D6D'} />
                  <Text style={[styles.calendarTimeText, isCompleted && styles.calendarTimeTextCompleted]}>
                    {ev.time || '--:--'}
                  </Text>
                </View>

                <View style={styles.calendarChevronCell}>
                  <CalendarChevronIcon
                    expanded={expanded}
                    color={isCompleted ? "#FFFFFF" : meta.border}
                  />
                </View>
              </TouchableOpacity>

              <CalendarExpandedBody
                expanded={expanded}
                isCompleted={isCompleted}
                description={ev.description || 'No extra description provided for this event.'}
                onToggleComplete={() => onToggleComplete(ev)}
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
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
        contentContainerStyle={[
          styles.horizontalScrollContent,
          contentContainerStyle,
        ]}
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


interface ModalProps {
  visible: boolean;
  type: EventType;
  form: any;
  saving: boolean;
  selectedDate: string;
  babies: any[];
  modalBaby: any;
  feedback: { type: "success" | "error"; message: string } | null;
  modeLabel?: string;
  saveLabel?: string;
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
  babies,
  modalBaby,
  feedback,
  modeLabel = "Create",
  saveLabel = "Save Event",
  onSelectBaby,
  onClose,
  onSave,
  onChange,
  onChangeDate,
  onOpenPicker,
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const c = COLORS[type];
  const activityTypes = ["feeding", "sleep", "diaper", "play", "bath", "other"];

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const typeTitle =
    type === "activity"
      ? `${modeLabel} Activity`
      : type === "task"
      ? `${modeLabel} Task`
      : `${modeLabel} Reminder`;

  const typeSubtitle =
    modeLabel === "Edit"
      ? "Update the selected event using the same layout as creation"
      : type === "activity"
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
            style={{ flexShrink: 1 }}
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

              <HorizontalChevronScroll>
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
              </HorizontalChevronScroll>
            </View>

            {type === "activity" ? (
              <>
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionLabel}>
                    Activity Type <Text style={styles.requiredStar}>*</Text>
                  </Text>

                  <HorizontalChevronScroll>
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
                  </HorizontalChevronScroll>
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

          <View style={[styles.modalFooter, { paddingBottom: Math.max(verticalScale(18), insets.bottom) }]}>
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
                <Text style={styles.modalSaveBtnText}>{saveLabel}</Text>
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
    position: "relative",
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

  segmentIndicator: {
    position: "absolute",
    left: scale(2),
    top: scale(2),
    bottom: scale(2),
    width: "49%",
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    shadowColor: "rgba(79,141,212,0.25)",
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  segmentHalf: {
    width: "50%",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(12),
    backgroundColor: "transparent",
  },

  segmentTabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },

  segmentLabel: {
    fontSize: moderateScale(14),
    color: "#A3A3A3",
    fontWeight: "800",
  },

  segmentLabelActive: {
    color: "#4F8DD4",
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

  headerActionsCol: {
    alignItems: "flex-end",
    gap: verticalScale(8),
  },

  headerDateControlWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  headerDateChevronButton: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    alignItems: "center",
    justifyContent: "center",
  },

  headerDateTextWrap: {
    minWidth: 0,
    marginHorizontal: scale(2),
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
    backgroundColor: "#DCEEFF",
    borderWidth: 1,
    borderColor: "#9FC8F2",
  },

  editButtonText: {
    fontSize: moderateScale(13),
    color: "#666",
    fontWeight: "700",
  },

  editButtonTextActive: {
    color: "#4F8DD4",
  },

  babyPicker: {
    paddingTop: verticalScale(10),
    paddingHorizontal: scale(26),
  },

  horizontalScrollShell: {
    position: "relative",
    overflow: "hidden",
  },

  horizontalScrollContent: {
    paddingHorizontal: scale(26),
  },

  scrollChevron: {
    position: "absolute",
    top: "50%",
    marginTop: -moderateScale(9),
    zIndex: 3,
    backgroundColor: "rgba(243,247,252,0.92)",
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(2),
  },

  scrollChevronLeft: {
    left: scale(6),
  },

  scrollChevronRight: {
    right: scale(6),
  },

  modeContent: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  sceneContentFadeLayer: {
    flex: 1,
  },

  sceneLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(243,243,243,0.18)",
    zIndex: 40,
  },

  modeScene: {
    flex: 1,
  },

  calendarScene: {
    ...StyleSheet.absoluteFillObject,
  },

  scheduleScene: {
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: moderateScale(26),
    minWidth: scale(128),
  },

  completeButtonInner: {
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(26),
    alignItems: "center",
    justifyContent: "center",
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
    paddingBottom: verticalScale(104),
    paddingHorizontal: scale(8),
    paddingTop: verticalScale(112),
  },

  timelineScreenEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(140),
  },

  timelineRailWrap: {
    position: "absolute",
    left: scale(56),
    top: 0,
    bottom: 0,
    width: 8,
    alignItems: "center",
    overflow: "hidden",
  },

  timelineFadeTop: {
    width: 8,
    paddingTop: verticalScale(8),
    alignItems: "center",
    gap: verticalScale(5),
  },

  timelineFadeBottom: {
    width: 8,
    paddingBottom: verticalScale(28),
    alignItems: "center",
    gap: verticalScale(5),
    marginTop: "auto",
  },

  timelineFadeDot: {
    width: 4,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#73ADF0",
  },

  dayBoundaryStartWrap: {
    marginTop: verticalScale(6),
    marginLeft: scale(92),
    marginRight: scale(12),
    marginBottom: verticalScale(12),
    alignItems: "center",
  },

  dayBoundaryEndWrap: {
    marginTop: verticalScale(18),
    marginLeft: scale(92),
    marginRight: scale(12),
    marginBottom: verticalScale(10),
    alignItems: "center",
  },

  dayBoundaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },

  dayBoundaryText: {
    fontSize: moderateScale(24),
    color: "rgba(113, 145, 181, 0.58)",
    fontWeight: "600",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  timelineLineSolid: {
    flex: 1,
    width: 4,
    backgroundColor: "#73ADF0",
    borderRadius: 4,
    marginVertical: verticalScale(8),
    alignItems: "center",
    justifyContent: "space-evenly",
    overflow: "hidden",
  },

  timelineLineChevron: {
    marginVertical: verticalScale(1),
    opacity: 0.55,
  },

  emptyScheduleWrap: {
    marginTop: 0,
    marginHorizontal: scale(24),
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#D5E3F5",
    borderRadius: moderateScale(18),
    paddingVertical: verticalScale(28),
    paddingHorizontal: scale(22),
    alignItems: "center",
  },

  emptyScheduleTitle: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(18),
    color: "#7098C7",
    fontWeight: "800",
    textAlign: "center",
  },

  emptyScheduleText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
    color: "#7C90AA",
    textAlign: "center",
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

  dotWrapUpcoming: {
    backgroundColor: "#5A6470",
  },

  upcomingDotPulseWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },

  upcomingDotPulse: {
    position: "absolute",
    width: moderateScale(14),
    height: moderateScale(14),
    borderRadius: moderateScale(7),
    backgroundColor: "rgba(115,173,240,0.42)",
  },

  upcomingDotCore: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#73ADF0",
  },

  upcomingDotCoreSelected: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
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

  inlineEditDeleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },

  editActionButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
  },

  deleteActionButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    alignItems: "center",
    justifyContent: "center",
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

  completeFillOverlayBubble: {
    position: "absolute",
    right: scale(6),
    bottom: verticalScale(6),
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: "#8DBCF1",
    zIndex: 0,
  },

  completeFillOverlayBubbleLarge: {
    right: scale(16),
    bottom: verticalScale(14),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
  },

  focusCard: {
    flex: 1,
    backgroundColor: "#F6F6F6",
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: "#B2B2B2",
    overflow: "visible",
    position: "relative",
  },

  focusCardComplete: {
    backgroundColor: "#EEF6FF",
    borderColor: "#A9CCF6",
  },

  editDeleteFloatingRow: {
    position: "absolute",
    top: verticalScale(-40),
    right: scale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    zIndex: 8,
  },


  focusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#C8C8C8",
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    overflow: "hidden",
  },

  focusHeaderRowComplete: {
    borderBottomColor: "#BDD6F6",
    backgroundColor: "#E8F2FF",
  },

  nextEventPill: {
    // Manually adjust the blue Next/Future event pill horizontal position here.
    backgroundColor: "#89B9ED",
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(16),
    maxWidth: "60%",
    marginLeft: scale(-10),
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


  calendarAgendaWrap: {
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(10),
  },

  calendarSectionWrap: {
    marginBottom: verticalScale(12),
  },

  calendarSectionHeader: {
    minHeight: verticalScale(48),
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: verticalScale(8),
  },

  calendarSectionHeaderText: {
    color: "#FFFFFF",
    fontSize: moderateScale(22),
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.14)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },

  calendarSectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },

  calendarSectionCountText: {
    color: "#FFFFFF",
    fontSize: moderateScale(14),
    fontWeight: "800",
  },

  calendarItemWrap: {
    paddingTop: verticalScale(20),
    marginBottom: verticalScale(13),
  },

  calendarItemWrapEditMode: {},

  calendarItemActions: {
    position: "absolute",
    top: verticalScale(-11),
    right: scale(12),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    zIndex: 3,
  },

  calendarEventCard: {
    borderWidth: 1.5,
    borderRadius: moderateScale(16),
    overflow: "hidden",
  },

  calendarEventCardExpanded: {
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  calendarEventTopRow: {
    minHeight: verticalScale(50),
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 1,
  },

  calendarTitleCell: {
    flex: 1.35,
    justifyContent: "center",
    paddingLeft: scale(12),
    paddingRight: scale(8),
    borderRightWidth: 1.5,
    overflow: "hidden",
  },

  calendarTitleCellWide: {
    flex: 1.62,
    paddingRight: scale(6),
  },

  calendarNameCell: {
    width: scale(108),
    justifyContent: "center",
    paddingLeft: scale(8),
    paddingRight: scale(6),
    borderRightWidth: 1.5,
    overflow: "hidden",
  },

  calendarNameCellCompact: {
    width: scale(94),
    paddingLeft: scale(7),
    paddingRight: scale(5),
  },

  calendarTimeCell: {
    width: scale(100),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(3),
    paddingLeft: scale(1),
    paddingRight: scale(1),
  },

  calendarTimeText: {
    color: "#6D6D6D",
    fontSize: moderateScale(13),
    fontWeight: "500",
  },

  calendarTimeTextCompleted: {
    color: "#FFFFFF",
  },

  calendarChevronCell: {
    width: scale(28),
    alignItems: "center",
    justifyContent: "center",
    paddingRight: scale(0),
  },

  calendarExpandedBodyWrap: {
    overflow: "hidden",
  },

  calendarExpandedBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(10),
  },

  calendarDescriptionText: {
    flex: 1,
    color: "#5A5A5A",
    fontSize: moderateScale(13),
    lineHeight: moderateScale(19),
    paddingRight: scale(6),
  },

  calendarDescriptionTextCompleted: {
    color: "#FFFFFF",
  },

  calendarCompleteButton: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    flexShrink: 0,
  },

  calendarCompleteButtonInner: {
    flex: 1,
    borderRadius: moderateScale(27),
    alignItems: "center",
    justifyContent: "center",
  },

  calendarCompleteButtonDone: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },

  fadeTextWrap: {
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },

  fadeTextOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: scale(26),
  },

  fadeTextOverlayLeft: {
    left: 0,
  },

  fadeTextOverlayRight: {
    right: 0,
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
    maxHeight: height * 0.82,
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
    gap: scale(8),
  },

  modalBabyChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: "#C8D3DD",
    backgroundColor: "#FFFFFF",
    marginRight: scale(8),
  },

  modalBabyChipActive: {
    backgroundColor: "#7FB2EF",
    borderColor: "#7FB2EF",
  },

  modalBabyChipText: {
    fontSize: moderateScale(12),
    color: "#5F6E7E",
    fontWeight: "700",
  },

  modalBabyChipTextActive: {
    color: "#FFFFFF",
  },

  modalTypeChip: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(18),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8D3DD",
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
  },

  modalTypeChipTextActive: {
    color: "#FFFFFF",
  },

  modalChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  modalDtRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    flexWrap: "wrap",
  },

  modalDtBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8D3DD",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
  },

  modalDtBtnText: {
    fontSize: moderateScale(12),
    color: "#5F6E7E",
    fontWeight: "700",
  },

  endTimeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(12),
  },

  clearBtn: {
    borderWidth: 1,
    borderColor: "#E5B6B2",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    backgroundColor: "#FFF",
  },

  clearBtnText: {
    color: "#D66A61",
    fontWeight: "700",
    fontSize: moderateScale(11),
  },

  modalInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8D3DD",
    borderRadius: moderateScale(14),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(13),
    color: "#465463",
  },

  modalInputMultiline: {
    minHeight: verticalScale(96),
    textAlignVertical: "top",
  },

  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(10),
    backgroundColor: "#EEF4F8",
  },

  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C8D3DD",
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(13),
  },

  modalCancelBtnText: {
    color: "#5F6E7E",
    fontWeight: "800",
    fontSize: moderateScale(13),
  },

  modalSaveBtn: {
    flex: 1.2,
    backgroundColor: "#8DBCF1",
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(13),
  },

  modalSaveBtnDisabled: {
    opacity: 0.6,
  },

  modalSaveBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: moderateScale(13),
  },
});