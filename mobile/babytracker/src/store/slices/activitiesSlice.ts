import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getActivities } from "../../../services/scheduleService";

export const fetchActivities = createAsyncThunk(
  "activities/fetch",
  async (babyId: number) => {
    const res = await getActivities(babyId);
    if (res?.success) return { babyId, data: res.data ?? [] };
    throw new Error(res?.message ?? "Failed to fetch activities");
  }
);

const activitiesSlice = createSlice({
  name: "activities",
  initialState: {
    items: [] as any[],
    babyId: null as number | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        if (state.items.length === 0) state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.items = action.payload.data;
        state.babyId = action.payload.babyId;
        state.loading = false;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch activities";
      });
  },
});

export default activitiesSlice.reducer;
