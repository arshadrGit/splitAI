import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Friend } from '../types';

interface FriendsState {
  friends: Friend[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  loading: false,
  error: null,
};

// Fetch all friends
export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (userId: string) => {
    try {
      const friendsSnapshot = await firestore()
        .collection('friends')
        .where('userId', '==', userId)
        .get();
      
      const friends = friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as Friend));
      
      return friends;
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  }
);

// Add a friend
export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (friend: Omit<Friend, 'id'>, { rejectWithValue }) => {
    try {
      const db = firestore();
      const friendsCollection = db.collection('friends');
      
      // Check if the friend already exists
      const existingFriends = await friendsCollection
        .where('userId', '==', friend.userId)
        .where('friendId', '==', friend.friendId)
        .get();
      
      if (!existingFriends.empty) {
        return rejectWithValue('This friend is already in your list');
      }
      
      // Create a new friend entry
      const friendData = {
        userId: friend.userId,
        friendId: friend.friendId,
        email: friend.email,
        displayName: friend.displayName || friend.friendId,
        photoURL: friend.photoURL || null,
        createdAt: firestore.Timestamp.now(),
      };
      
      const docRef = await friendsCollection.add(friendData);
      const newFriend = await docRef.get();
      const newFriendData = newFriend.data();
      
      if (!newFriendData) {
        throw new Error('Failed to create friend');
      }
      
      return {
        id: newFriend.id,
        ...newFriendData,
        createdAt: newFriendData.createdAt.toDate(),
      } as Friend;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add friend';
      return rejectWithValue(errorMessage);
    }
  }
);

// Accept a friend request
export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptFriendRequest',
  async (requestId: string) => {
    try {
      const db = firestore();
      const requestRef = db.collection('friends').doc(requestId);
      
      await requestRef.update({
        status: 'accepted'
      });
      
      const updatedRequest = await requestRef.get();
      
      if (!updatedRequest.exists) {
        throw new Error('Friend request not found');
      }
      
      return {
        id: updatedRequest.id,
        ...updatedRequest.data(),
        createdAt: updatedRequest.data()?.createdAt?.toDate() || new Date(),
      } as Friend;
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  }
);

// Reject a friend request
export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectFriendRequest',
  async (requestId: string) => {
    try {
      const db = firestore();
      await db.collection('friends').doc(requestId).delete();
      
      return requestId;
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  }
);

// Generate invite link
export const generateInviteLink = createAsyncThunk(
  'friends/generateInviteLink',
  async (userId: string) => {
    const inviteCode = Math.random().toString(36).substring(2, 10);
    
    // Store the invite code in the database
    const db = firestore();
    await db.collection('invites').add({
      userId,
      inviteCode,
      createdAt: firestore.FieldValue.serverTimestamp(),
      used: false
    });
    
    // In a real app, you would use a dynamic link service
    const inviteLink = `https://splitease.app/invite/${inviteCode}`;
    
    return inviteLink;
  }
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch friends';
      })
      .addCase(addFriend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFriend.fulfilled, (state, action) => {
        state.loading = false;
        state.friends.push(action.payload);
      })
      .addCase(addFriend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add friend';
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        // Remove from incoming requests
        state.incomingRequests = state.incomingRequests.filter(
          request => request.id !== action.payload.id
        );
        // Add to friends
        state.friends.push(action.payload);
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        // Remove from incoming requests
        state.incomingRequests = state.incomingRequests.filter(
          request => request.id !== action.payload
        );
      });
  },
});

export default friendsSlice.reducer; 