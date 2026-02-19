import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator, Dimensions, Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NavBar from "./navBar";
import {
  getActivities, getTasks, getReminders,
  createActivity, createTask, createReminder,
} from "../../services/scheduleService";
import { getBabies } from "../../services/babyService";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const { width, height } = Dimensions.get("window");
const scale = (s: number) => (width / 360) * s;
const verticalScale = (s: number) => (height / 800) * s;
const moderateScale = (s: number, f = 0.5) => s + (scale(s) - s) * f;

const COLORS = {
  activity: { dot: "#4A90D9", badge: "#EAF3FB", text: "#1A5C96", icon: "flash-outline" },
  task:     { dot: "#F5A623", badge: "#FEF5E7", text: "#9A6100", icon: "checkmark-circle-outline" },
  reminder: { dot: "#7ED321", badge: "#EEF8E6", text: "#3E7A00", icon: "alarm-outline" },
} as const;

type EventType = "activity" | "task" | "reminder";

interface ScheduleEvent {
  id: number;
  type: EventType;
  title: string;
  description?: string;
  date: string;
  time?: string;
  raw: any;
}
interface MarkedDate { dots: { key: string; color: string }[]; marked: boolean; }
type Props = { navigation: any };

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const toDateStr = (iso?: string | null) => iso ? iso.slice(0, 10) : "";
const toTimeStr = (iso?: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const activityLabel = (type: string) =>
  ({ feeding:"Feeding", sleep:"Sleep", diaper:"Diaper", play:"Play", bath:"Bath", other:"Other" }[type?.toLowerCase()] ?? type);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ScheduleScreen({ navigation }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate]   = useState(today);
  const [events, setEvents]               = useState<ScheduleEvent[]>([]);
  const [markedDates, setMarkedDates]     = useState<Record<string, MarkedDate>>({});
  const [loading, setLoading]             = useState(false);
  const [babies, setBabies]               = useState<any[]>([]);
  const [selectedBaby, setSelectedBaby]   = useState<any>(null);

  // Modal state
  const [modalVisible, setModalVisible]   = useState(false);
  const [modalType, setModalType]         = useState<EventType>("activity");
  const [modalBaby, setModalBaby]         = useState<any>(null);
  const [saving, setSaving]               = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", activityType: "feeding",
    startTime: new Date(), endTime: null as Date | null,
    dueAt: new Date(), status: "pending",
  });

  // DateTimePicker state — lives at parent so it renders OUTSIDE the Modal
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);

  // Load babies
  useEffect(() => {
    (async () => {
      const res = await getBabies();
      const list = Array.isArray(res?.data) ? res.data : [];
      setBabies(list);
      if (list.length > 0) setSelectedBaby(list[0]);
    })();
  }, []);

  // Load events for selected baby
  const loadEvents = useCallback(async () => {
    if (!selectedBaby) return;
    setLoading(true);
    try {
      const babyId = selectedBaby.baby_id;
      const [actRes, taskRes, remRes] = await Promise.all([
        getActivities(babyId), getTasks(babyId), getReminders(babyId),
      ]);
      const mapped: ScheduleEvent[] = [];
      (Array.isArray(actRes?.data) ? actRes.data : []).forEach((a: any) => {
        const date = toDateStr(a.start_time);
        if (date) mapped.push({ id: a.activity_id, type: "activity", title: activityLabel(a.activity_type), description: a.notes ?? undefined, date, time: toTimeStr(a.start_time), raw: a });
      });
      (Array.isArray(taskRes?.data) ? taskRes.data : []).forEach((t: any) => {
        const date = toDateStr(t.due_at);
        if (date) mapped.push({ id: t.task_id, type: "task", title: t.title, description: t.description ?? undefined, date, time: toTimeStr(t.due_at), raw: t });
      });
      (Array.isArray(remRes?.data) ? remRes.data : []).forEach((r: any) => {
        const date = toDateStr(r.due_at);
        if (date) mapped.push({ id: r.reminder_id, type: "reminder", title: r.title, description: r.body ?? undefined, date, time: toTimeStr(r.due_at), raw: r });
      });
      setEvents(mapped);
      const result: Record<string, MarkedDate> = {};
      mapped.forEach((ev) => {
        if (!result[ev.date]) result[ev.date] = { dots: [], marked: true };
        if (!result[ev.date].dots.some(d => d.key === ev.type))
          result[ev.date].dots.push({ key: ev.type, color: COLORS[ev.type].dot });
      });
      setMarkedDates(result);
    } catch (e) { console.error("Failed to load schedule:", e); }
    finally { setLoading(false); }
  }, [selectedBaby]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const dayEvents = events.filter(e => e.date === selectedDate).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  // DateTimePicker helpers
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
    if (pickerOpen?.startsWith("end"))   return form.endTime ?? form.startTime;
    return form.dueAt;
  };
  const handlePickerChange = (_e: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === "android") setPickerOpen(null);
    if (!picked) return;
    setForm(f => {
      if (pickerOpen === "startDate") return { ...f, startTime: mergeDatePart(f.startTime, picked) };
      if (pickerOpen === "startTime") return { ...f, startTime: mergeTimePart(f.startTime, picked) };
      if (pickerOpen === "endDate")   return { ...f, endTime:   mergeDatePart(f.endTime ?? f.startTime, picked) };
      if (pickerOpen === "endTime")   return { ...f, endTime:   mergeTimePart(f.endTime ?? f.startTime, picked) };
      if (pickerOpen === "dueDate")   return { ...f, dueAt:     mergeDatePart(f.dueAt, picked) };
      if (pickerOpen === "dueTime")   return { ...f, dueAt:     mergeTimePart(f.dueAt, picked) };
      return f;
    });
  };

  // Open modal
  const openModal = (type: EventType) => {
    if (!babies.length) {
      Alert.alert("No Babies", "Add a baby from Profile first.");
      return;
    }
    const base = new Date(`${selectedDate}T09:00:00`);
    setModalType(type);
    setModalBaby(null);
    setForm({ title: "", description: "", activityType: "feeding", startTime: base, endTime: null, dueAt: base, status: "pending" });
    setModalVisible(true);
  };

  // Save event
  const handleSave = async () => {
    if (!modalBaby) { Alert.alert("Select a Baby", "Please select a baby first."); return; }
    if (!form.title.trim() && modalType !== "activity") { Alert.alert("Validation", "Title is required."); return; }
    setSaving(true);
    try {
      const babyId = modalBaby.baby_id;
      if (modalType === "activity") {
        await createActivity(babyId, {
          baby_id: babyId, activity_type: form.activityType,
          start_time: form.startTime.toISOString(),
          end_time: form.endTime ? form.endTime.toISOString() : null,
          notes: form.description || null,
        });
      } else if (modalType === "task") {
        await createTask(babyId, {
          baby_id: babyId, title: form.title,
          description: form.description || null,
          due_at: form.dueAt.toISOString(), status: form.status,
        });
      } else {
        await createReminder(babyId, {
          baby_id: babyId, title: form.title,
          body: form.description || null,
          due_at: form.dueAt.toISOString(),
        });
      }
      setModalVisible(false);
      if (selectedBaby?.baby_id === babyId) await loadEvents();
      else setSelectedBaby(modalBaby);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save.");
    } finally { setSaving(false); }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#c9e8f9", "#e8f4fd"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        {babies.length > 1 && (
          <>
            <Text style={styles.viewingLabel}>Viewing calendar for:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.babyPicker}>
              {babies.map(b => (
                <TouchableOpacity key={b.baby_id} onPress={() => setSelectedBaby(b)}
                  style={[styles.babyChip, selectedBaby?.baby_id === b.baby_id && styles.babyChipActive]}>
                  <Text style={[styles.babyChipText, selectedBaby?.baby_id === b.baby_id && styles.babyChipTextActive]}>
                    {b.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
        {babies.length === 1 && (
          <View style={styles.singleBabyRow}>
            <Ionicons name="person-circle-outline" size={16} color="#4A90D9" />
            <Text style={styles.singleBabyText}>{selectedBaby?.display_name}</Text>
          </View>
        )}
        {babies.length === 0 && (
          <Text style={styles.noBabyWarning}>⚠ No babies added yet. Go to Profile to add one.</Text>
        )}
      </LinearGradient>

      {/* Legend */}
      <View style={styles.legend}>
        {(["activity", "task", "reminder"] as EventType[]).map(t => (
          <View key={t} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS[t].dot }]} />
            <Text style={styles.legendLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Calendar */}
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
              selectedColor: "#4A90D9",
            },
          }}
          theme={{
            todayTextColor: "#4A90D9",
            selectedDayBackgroundColor: "#4A90D9",
            arrowColor: "#4A90D9",
            dotColor: "#4A90D9",
          }}
        />

        {/* Add buttons */}
        <View style={styles.addRow}>
          {(["activity", "task", "reminder"] as EventType[]).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => openModal(t)}
              style={[styles.addBtn, { borderColor: COLORS[t].dot }, !babies.length && styles.addBtnDisabled]}
              disabled={!babies.length}
            >
              <Ionicons name={COLORS[t].icon as any} size={15} color={babies.length ? COLORS[t].dot : "#bbb"} />
              <Text style={[styles.addBtnText, { color: babies.length ? COLORS[t].text : "#bbb" }]}>
                + {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {!babies.length && (
          <View style={styles.noBabyHint}>
            <Ionicons name="information-circle-outline" size={16} color="#aaa" />
            <Text style={styles.noBabyHintText}>Go to Profile → Add Baby to get started.</Text>
          </View>
        )}

        {/* Day events */}
        <Text style={styles.dayHeader}>
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4A90D9" style={{ marginTop: verticalScale(24) }} />
        ) : dayEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={moderateScale(48)} color="#c0d4e8" />
            <Text style={styles.emptyText}>No events on this day</Text>
            <Text style={styles.emptySubText}>Tap a button above to add an activity, task, or reminder.</Text>
          </View>
        ) : (
          dayEvents.map((ev, idx) => <EventCard key={`${ev.type}-${ev.id}-${idx}`} event={ev} />)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add-Event Modal */}
      <AddEventModal
        visible={modalVisible}
        type={modalType}
        form={form}
        saving={saving}
        selectedDate={selectedDate}
        babies={babies}
        modalBaby={modalBaby}
        onSelectBaby={b => setModalBaby(b)}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onChange={(key, val) => setForm(f => ({ ...f, [key]: val }))}
        onChangeDate={(key, date) => setForm(f => ({ ...f, [key]: date }))}
        onOpenPicker={key => setPickerOpen(key)}
      />

      {/* Native DateTimePicker — rendered OUTSIDE Modal so it works on Android */}
      {pickerOpen !== null && (
        <DateTimePicker
          value={pickerValue()}
          mode={pickerOpen.endsWith("Time") ? "time" : "date"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}

      <NavBar navigation={navigation} activeTab="schedule" />
    </View>
  );
}

// ─── EVENT CARD ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: ScheduleEvent }) {
  const c = COLORS[event.type];
  return (
    <View style={[styles.card, { borderLeftColor: c.dot, backgroundColor: c.badge }]}>
      <View style={styles.cardIcon}>
        <Ionicons name={c.icon as any} size={moderateScale(18)} color={c.dot} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{event.title}</Text>
        {event.description ? <Text style={styles.cardDesc}>{event.description}</Text> : null}
        {event.time ? (
          <Text style={styles.cardTime}>
            <Ionicons name="time-outline" size={11} color="#888" /> {event.time}
          </Text>
        ) : null}
      </View>
      <View style={[styles.cardBadge, { backgroundColor: c.dot }]}>
        <Text style={styles.cardBadgeText}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Text>
      </View>
    </View>
  );
}

// ─── ADD EVENT MODAL ─────────────────────────────────────────────────────────
interface ModalProps {
  visible: boolean; type: EventType; form: any; saving: boolean;
  selectedDate: string; babies: any[]; modalBaby: any;
  onSelectBaby: (b: any) => void; onClose: () => void; onSave: () => void;
  onChange: (key: string, val: string) => void;
  onChangeDate: (key: string, date: Date | null) => void;
  onOpenPicker: (key: string) => void;
}

function AddEventModal({
  visible, type, form, saving, selectedDate, babies, modalBaby,
  onSelectBaby, onClose, onSave, onChange, onChangeDate, onOpenPicker,
}: ModalProps) {
  const c = COLORS[type];
  const activityTypes = ["feeding", "sleep", "diaper", "play", "bath", "other"];
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // Reusable date+time row — calls onOpenPicker which triggers parent-level picker
  const DtRow = ({ label, value, dk, tk, required }: { label: string; value: Date; dk: string; tk: string; required?: boolean }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}{required ? <Text style={styles.requiredStar}> *</Text> : <Text style={{ color: "#888" }}> (optional)</Text>}</Text>
      <View style={styles.dtRow}>
        <TouchableOpacity style={[styles.dtBtn, { borderColor: c.dot }]} onPress={() => onOpenPicker(dk)}>
          <Ionicons name="calendar-outline" size={14} color={c.dot} />
          <Text style={[styles.dtBtnText, { color: c.dot }]}>{fmtDate(value)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dtBtn, { borderColor: c.dot }]} onPress={() => onOpenPicker(tk)}>
          <Ionicons name="time-outline" size={14} color={c.dot} />
          <Text style={[styles.dtBtnText, { color: c.dot }]}>{fmtTime(value)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: c.dot }]}>
            <Ionicons name={c.icon as any} size={22} color={c.dot} />
            <Text style={[styles.modalTitle, { color: c.text }]}>{"  "}Add {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalDate}>
              📅{"  "}{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </Text>

            {/* Step 1 — Select baby */}
            <View style={styles.fieldGroup}>
              <View style={styles.babyStepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: c.dot }]}><Text style={styles.stepBadgeText}>1</Text></View>
                <Text style={[styles.fieldLabel, { marginBottom: 0, marginLeft: 8 }]}>Select Baby <Text style={styles.requiredStar}>*</Text></Text>
              </View>
              {babies.length === 0 ? (
                <View style={styles.noBabyModalHint}>
                  <Ionicons name="alert-circle-outline" size={18} color="#F5A623" />
                  <Text style={styles.noBabyModalText}>No babies found. Add a baby from Profile first.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row" }}>
                    {babies.map(b => (
                      <TouchableOpacity key={b.baby_id} onPress={() => onSelectBaby(b)}
                        style={[styles.babySelectChip, modalBaby?.baby_id === b.baby_id && { backgroundColor: c.dot, borderColor: c.dot }]}>
                        <Ionicons name="person-circle-outline" size={14} color={modalBaby?.baby_id === b.baby_id ? "#fff" : c.dot} style={{ marginRight: 4 }} />
                        <Text style={[styles.babySelectChipText, { color: c.dot }, modalBaby?.baby_id === b.baby_id && { color: "#fff" }]}>
                          {b.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
              {babies.length > 0 && !modalBaby && <Text style={styles.selectBabyPrompt}>👆 Tap a baby above to continue</Text>}
            </View>

            {/* Step 2 — Event details (shown after baby selected) */}
            {modalBaby && (
              <>
                <View style={styles.babyStepHeader}>
                  <View style={[styles.stepBadge, { backgroundColor: c.dot }]}><Text style={styles.stepBadgeText}>2</Text></View>
                  <Text style={[styles.fieldLabel, { marginBottom: 0, marginLeft: 8 }]}>Event Details</Text>
                </View>
                <View style={styles.selectedBabyConfirm}>
                  <Ionicons name="checkmark-circle" size={14} color={c.dot} />
                  <Text style={[styles.selectedBabyConfirmText, { color: c.text }]}>For: {modalBaby.display_name}</Text>
                </View>

                {/* ACTIVITY fields */}
                {type === "activity" && (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Activity Type <Text style={styles.requiredStar}>*</Text></Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: "row" }}>
                          {activityTypes.map(at => (
                            <TouchableOpacity key={at} onPress={() => onChange("activityType", at)}
                              style={[styles.chip, form.activityType === at && { backgroundColor: c.dot, borderColor: c.dot }]}>
                              <Text style={[styles.chipText, form.activityType === at && { color: "#fff" }]}>
                                {at.charAt(0).toUpperCase() + at.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                    <DtRow label="Start Time" required value={form.startTime} dk="startDate" tk="startTime" />
                    {/* Optional end time */}
                    <View style={styles.fieldGroup}>
                      <View style={styles.endTimeHeaderRow}>
                        <Text style={styles.fieldLabel}>End Time</Text>
                        {form.endTime ? (
                          <TouchableOpacity onPress={() => onChangeDate("endTime", null)} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>Clear</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity onPress={() => onChangeDate("endTime", new Date(form.startTime))}
                            style={[styles.clearBtn, { borderColor: c.dot }]}>
                            <Text style={[styles.clearBtnText, { color: c.dot }]}>+ Add end time</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {form.endTime && (
                        <View style={styles.dtRow}>
                          <TouchableOpacity style={[styles.dtBtn, { borderColor: c.dot }]} onPress={() => onOpenPicker("endDate")}>
                            <Ionicons name="calendar-outline" size={14} color={c.dot} />
                            <Text style={[styles.dtBtnText, { color: c.dot }]}>{fmtDate(form.endTime)}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.dtBtn, { borderColor: c.dot }]} onPress={() => onOpenPicker("endTime")}>
                            <Ionicons name="time-outline" size={14} color={c.dot} />
                            <Text style={[styles.dtBtnText, { color: c.dot }]}>{fmtTime(form.endTime)}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </>
                )}

                {/* TASK / REMINDER fields */}
                {type !== "activity" && (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Title <Text style={styles.requiredStar}>*</Text></Text>
                      <TextInput value={form.title} onChangeText={v => onChange("title", v)} placeholder="Enter title..." style={styles.input} />
                    </View>
                    <DtRow label="Due Date & Time" required value={form.dueAt} dk="dueDate" tk="dueTime" />
                  </>
                )}

                {/* Notes / description — all types */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{type === "activity" ? "Notes (optional)" : "Description (optional)"}</Text>
                  <TextInput
                    value={form.description} onChangeText={v => onChange("description", v)}
                    placeholder={type === "activity" ? "Any notes..." : "More details..."}
                    multiline numberOfLines={3} style={[styles.input, styles.inputMultiline]}
                  />
                </View>

                {/* Task status */}
                {type === "task" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {["pending", "in_progress", "done"].map(s => (
                        <TouchableOpacity key={s} onPress={() => onChange("status", s)}
                          style={[styles.chip, form.status === s && { backgroundColor: c.dot, borderColor: c.dot }]}>
                          <Text style={[styles.chipText, form.status === s && { color: "#fff" }]}>{s.replace("_", " ")}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} disabled={saving || !modalBaby}
              style={[styles.saveBtn, { backgroundColor: modalBaby ? c.dot : "#ccc" }]}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>{modalBaby ? "Save" : "Select a Baby"}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc" },
  header: {
    paddingTop: Platform.OS === "android" ? verticalScale(40) : verticalScale(54),
    paddingBottom: verticalScale(14), paddingHorizontal: scale(20),
  },
  headerTitle: { fontSize: moderateScale(26), fontWeight: "800", color: "#1a3d5c", marginBottom: verticalScale(6) },
  viewingLabel: { fontSize: moderateScale(11), color: "#5a82a8", fontWeight: "600", marginBottom: verticalScale(4), textTransform: "uppercase", letterSpacing: 0.5 },
  babyPicker: { flexDirection: "row", marginTop: verticalScale(2) },
  babyChip: { paddingHorizontal: scale(14), paddingVertical: verticalScale(6), borderRadius: 20, borderWidth: 1.5, borderColor: "#4A90D9", marginRight: scale(8), backgroundColor: "#fff" },
  babyChipActive: { backgroundColor: "#4A90D9" },
  babyChipText: { fontSize: moderateScale(13), color: "#4A90D9", fontWeight: "600" },
  babyChipTextActive: { color: "#fff" },
  singleBabyRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: verticalScale(2) },
  singleBabyText: { fontSize: moderateScale(13), color: "#4A90D9", fontWeight: "600" },
  noBabyWarning: { fontSize: moderateScale(13), color: "#e07b00", fontWeight: "600", marginTop: verticalScale(4) },
  legend: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: scale(18), paddingVertical: verticalScale(8), backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eaeaea" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: scale(5) },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: moderateScale(12), color: "#555", fontWeight: "500" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  calendar: { marginHorizontal: scale(12), marginTop: verticalScale(10), borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, overflow: "hidden" },
  addRow: { flexDirection: "row", justifyContent: "space-evenly", marginHorizontal: scale(12), marginTop: verticalScale(14), marginBottom: verticalScale(4) },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: scale(12), paddingVertical: verticalScale(7), backgroundColor: "#fff" },
  addBtnDisabled: { borderColor: "#ddd", backgroundColor: "#f5f5f5" },
  addBtnText: { fontSize: moderateScale(12), fontWeight: "600" },
  noBabyHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginTop: verticalScale(6), marginBottom: verticalScale(2) },
  noBabyHintText: { fontSize: moderateScale(12), color: "#aaa", fontStyle: "italic" },
  dayHeader: { fontSize: moderateScale(16), fontWeight: "700", color: "#2d4150", marginHorizontal: scale(16), marginTop: verticalScale(16), marginBottom: verticalScale(8) },
  emptyState: { alignItems: "center", marginTop: verticalScale(32), paddingHorizontal: scale(32) },
  emptyText: { fontSize: moderateScale(16), fontWeight: "600", color: "#aec6de", marginTop: verticalScale(12) },
  emptySubText: { fontSize: moderateScale(13), color: "#c3d5e8", textAlign: "center", marginTop: verticalScale(6) },
  card: { flexDirection: "row", alignItems: "center", marginHorizontal: scale(16), marginBottom: verticalScale(10), borderRadius: 14, borderLeftWidth: 4, padding: scale(12), elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardIcon: { width: moderateScale(36), height: moderateScale(36), borderRadius: moderateScale(18), backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginRight: scale(10) },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: moderateScale(14), fontWeight: "700" },
  cardDesc: { fontSize: moderateScale(12), color: "#666", marginTop: 2 },
  cardTime: { fontSize: moderateScale(11), color: "#888", marginTop: 3 },
  cardBadge: { borderRadius: 10, paddingHorizontal: scale(8), paddingVertical: 3, marginLeft: scale(6) },
  cardBadgeText: { fontSize: moderateScale(10), color: "#fff", fontWeight: "700" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: scale(20), paddingTop: verticalScale(16), paddingBottom: verticalScale(30), maxHeight: height * 0.85 },
  modalHeader: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1.5, paddingBottom: verticalScale(10), marginBottom: verticalScale(12) },
  modalTitle: { fontSize: moderateScale(18), fontWeight: "800", flex: 1 },
  modalClose: { padding: 4 },
  modalDate: { fontSize: moderateScale(13), color: "#6d8eb0", marginBottom: verticalScale(14), fontWeight: "500" },
  babyStepHeader: { flexDirection: "row", alignItems: "center", marginBottom: verticalScale(10) },
  stepBadge: { width: moderateScale(22), height: moderateScale(22), borderRadius: moderateScale(11), alignItems: "center", justifyContent: "center" },
  stepBadgeText: { color: "#fff", fontWeight: "800", fontSize: moderateScale(12) },
  requiredStar: { color: "#e05353" },
  babySelectChip: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: "#c0d4e8", borderRadius: 20, paddingHorizontal: scale(12), paddingVertical: verticalScale(7), marginRight: scale(8), marginBottom: verticalScale(4), backgroundColor: "#f0f6fc" },
  babySelectChipText: { fontSize: moderateScale(13), fontWeight: "700" },
  selectBabyPrompt: { fontSize: moderateScale(12), color: "#e07b00", fontStyle: "italic", marginTop: verticalScale(6), marginBottom: verticalScale(4) },
  selectedBabyConfirm: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f0f6fc", borderRadius: 8, paddingHorizontal: scale(10), paddingVertical: verticalScale(6), marginBottom: verticalScale(14), marginTop: verticalScale(4) },
  selectedBabyConfirmText: { fontSize: moderateScale(12), fontWeight: "700" },
  noBabyModalHint: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff8ed", borderRadius: 10, padding: scale(12), marginTop: verticalScale(6), borderWidth: 1, borderColor: "#F5A623" },
  noBabyModalText: { flex: 1, fontSize: moderateScale(13), color: "#9A6100" },
  fieldGroup: { marginBottom: verticalScale(14) },
  fieldLabel: { fontSize: moderateScale(13), fontWeight: "600", color: "#2d4150", marginBottom: verticalScale(6) },
  input: { borderWidth: 1.5, borderColor: "#d8e4f0", borderRadius: 10, paddingHorizontal: scale(12), paddingVertical: verticalScale(10), fontSize: moderateScale(14), color: "#2d4150", backgroundColor: "#f7f9fc" },
  inputMultiline: { height: verticalScale(72), textAlignVertical: "top" },
  chip: { borderWidth: 1.5, borderColor: "#c0d4e8", borderRadius: 20, paddingHorizontal: scale(12), paddingVertical: verticalScale(5), marginRight: scale(8), marginBottom: verticalScale(6), backgroundColor: "#f0f6fc" },
  chipText: { fontSize: moderateScale(12), color: "#4A90D9", fontWeight: "600" },
  dtRow: { flexDirection: "row", gap: scale(8) },
  dtBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: scale(10), paddingVertical: verticalScale(10), backgroundColor: "#f7f9fc" },
  dtBtnText: { fontSize: moderateScale(12), fontWeight: "600", flexShrink: 1 },
  endTimeHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: verticalScale(6) },
  clearBtn: { borderWidth: 1.5, borderColor: "#ddd", borderRadius: 12, paddingHorizontal: scale(10), paddingVertical: verticalScale(3) },
  clearBtnText: { fontSize: moderateScale(11), color: "#aaa", fontWeight: "600" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: scale(10), marginTop: verticalScale(16) },
  cancelBtn: { paddingHorizontal: scale(18), paddingVertical: verticalScale(10), borderRadius: 10, borderWidth: 1.5, borderColor: "#c0d4e8" },
  cancelBtnText: { color: "#6d8eb0", fontWeight: "600", fontSize: moderateScale(14) },
  saveBtn: { paddingHorizontal: scale(22), paddingVertical: verticalScale(10), borderRadius: 10, minWidth: scale(80), alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: moderateScale(14) },
});

