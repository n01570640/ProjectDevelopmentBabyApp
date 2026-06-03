import { configureStore } from "@reduxjs/toolkit";
import babiesReducer from "./slices/babiesSlice";
import activitiesReducer from "./slices/activitiesSlice";
import tasksReducer from "./slices/tasksSlice";
import remindersReducer from "./slices/remindersSlice";

export const store = configureStore({
  reducer: {
    babies: babiesReducer,
    activities: activitiesReducer,
    tasks: tasksReducer,
    reminders: remindersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
