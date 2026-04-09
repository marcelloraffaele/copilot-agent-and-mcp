import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchReviews = createAsyncThunk('reviews/fetchReviews', async () => {
  const res = await fetch('http://localhost:4000/api/reviews');
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
});

export const addReview = createAsyncThunk('reviews/addReview', async ({ token, bookId, rating, comment }) => {
  const res = await fetch('http://localhost:4000/api/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId, rating, comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add review');
  return data;
});

export const deleteReview = createAsyncThunk('reviews/deleteReview', async ({ token, reviewId }) => {
  const res = await fetch(`http://localhost:4000/api/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to delete review');
  }
  return reviewId;
});

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchReviews.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.items = state.items.filter(review => review.id !== action.payload);
      });
  },
});

export default reviewsSlice.reducer;
