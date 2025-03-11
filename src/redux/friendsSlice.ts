import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Friend } from '../types';

interface FriendsState {
  friends: Friend[];
  incomingRequests: Friend[];
  loading: boolean;
  error: string | null;
}

const initialState: FriendsState = {
  friends: [],
  incomingRequests: [],
  loading: false,
  error: null,
};

// Fetch all friends and friend requests
export const fetchFriends = createAsyncThunk(
  'friends/fetchFriends',
  async (userId: string) => {
    console.log('Fetching friends for user:', userId);
    
    try {
      // Get friends where the user is the requester
      const sentRequestsSnapshot = await firestore()
        .collection('friends')
        .where('userId', '==', userId)
        .get();
      
      // Get friends where the user is the recipient
      const receivedRequestsSnapshot = await firestore()
        .collection('friends')
        .where('userId', '==', userId)
        .get();
      
      console.log('Sent requests count:', sentRequestsSnapshot.size);
      console.log('Received requests count:', receivedRequestsSnapshot.size);
      
      const sentRequests = sentRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Friend));
      
      const receivedRequests = receivedRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Friend));
      
      // Combine both sets of requests
      const result = {
        friends: [...sentRequests, ...receivedRequests].filter(
          friend => friend.status === 'accepted'
        ),
        incomingRequests: receivedRequests.filter(
          friend => friend.status === 'pending'
        ),
      };
      debugger
      console.log('Friends count:', result.friends.length);
      console.log('Incoming requests count:', result.incomingRequests.length);
      
      return result;
    } catch (error) {
      console.error('Error fetching friends:', error);
      throw error;
    }
  }
);

// Send a friend request
export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (friend: Omit<Friend, 'id'>, { rejectWithValue }) => {
    try {
      const db = firestore();
      const friendsCollection = db.collection('friends');
      
      // Check if the friend email exists in the users collection
      const usersCollection = db.collection('users');
      const userSnapshot = await usersCollection
        .where('email', '==', friend.friendId)
        .get();
      
      if (userSnapshot.empty) {
        return rejectWithValue('No user found with this email address');
      }
      
      // Get the user data
      const userData = userSnapshot.docs[0].data();
      const friendUserId = userSnapshot.docs[0].id;
      
      console.log('Found user with email:', friend.friendId, 'User ID:', friendUserId);
      
      // Check if the friend already exists
      const existingFriends = await friendsCollection
        .where('userId', '==', friend.userId)
        .where('friendId', '==', friendUserId)
        .get();
      
      if (!existingFriends.empty) {
        return rejectWithValue('This friend is already in your list');
      }
      
      // Check if there's a pending request in the opposite direction
      const pendingRequests = await friendsCollection
        .where('userId', '==', friendUserId)
        .where('friendId', '==', friend.userId)
        .where('status', '==', 'pending')
        .get();
      
      if (!pendingRequests.empty) {
        // Auto-accept the pending request
        const pendingRequest = pendingRequests.docs[0];
        await pendingRequest.ref.update({ status: 'accepted' });
        
        return {
          id: pendingRequest.id,
          ...pendingRequest.data(),
          status: 'accepted'
        } as Friend;
      }
      
      // Create a new friend request
      const friendRequest = {
        userId: friend.userId,
        friendId: friendUserId,
        email: userData.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || null,
        status: 'pending',
        createdAt: firestore.Timestamp.now(),
      };
      
      console.log('Creating friend request:', friendRequest);
      
      const docRef = await friendsCollection.add(friendRequest);
      const newFriend = await docRef.get();
      
      return {
        id: newFriend.id,
        ...newFriend.data(),
        createdAt: newFriend.data().createdAt.toDate(),
      } as Friend;
    } catch (error) {
      console.error('Error adding friend:', error);
      return rejectWithValue(error.message || 'Failed to add friend');
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
        debugger
        state.loading = false;
        state.friends = action.payload.friends;
        state.incomingRequests = action.payload.incomingRequests;
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
        if (action.payload.status === 'accepted') {
          state.friends.push(action.payload);
        }
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