import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getReminders } from "../../../services/scheduleService";

export const fetchReminders = createAsyncThunk(
  "reminders/fetch",
  async (babyId: number) => {
    const res = await getReminders(babyId);
    if (res?.success) return { babyId, data: res.data ?? [] };
    throw new Error(res?.message ?? "Failed to fetch reminders");
  }
);

const remindersSlice = createSlice({
  name: "reminders",
  initialState: {
    items: [] as any[],
    babyId: null as number | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        if (state.items.length === 0) state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.items = action.payload.data;
        state.babyId = action.payload.babyId;
        state.loading = false;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch reminders";
      });
  },
});

export default remindersSlice.reducer;
