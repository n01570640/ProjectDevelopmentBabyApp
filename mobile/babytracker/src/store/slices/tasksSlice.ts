import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTasks } from "../../../services/scheduleService";

export const fetchTasks = createAsyncThunk(
  "tasks/fetch",
  async (babyId: number) => {
    const res = await getTasks(babyId);
    if (res?.success) return { babyId, data: res.data ?? [] };
    throw new Error(res?.message ?? "Failed to fetch tasks");
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState: {
    items: [] as any[],
    babyId: null as number | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        if (state.items.length === 0) state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.items = action.payload.data;
        state.babyId = action.payload.babyId;
        state.loading = false;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch tasks";
      });
  },
});

export default tasksSlice.reducer;
