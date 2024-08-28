import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { mainReducer } from './slice';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const store = configureStore({
	reducer: mainReducer,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RootState,
	unknown,
	Action<string>
>;

// export const createAppAsyncThunk = createAsyncThunk.withTypes<{
// 	state: RootState;
// 	dispatch: AppDispatch;
// 	rejectValue: string;
// }>();
