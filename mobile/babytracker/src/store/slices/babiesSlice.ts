import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getBabies } from "../../../services/babyService";

export const fetchBabies = createAsyncThunk("babies/fetch", async () => {
  const res = await getBabies();
  if (res?.success) return res.data ?? [];
  throw new Error(res?.message ?? "Failed to fetch babies");
});

const babiesSlice = createSlice({
  name: "babies",
  initialState: {
    items: [] as any[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBabies.pending, (state) => {
        // Only show loading spinner if store is empty (first load)
        // If data already exists, fetch silently in the background
        if (state.items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchBabies.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchBabies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch babies";
      });
  },
});

export default babiesSlice.reducer;
