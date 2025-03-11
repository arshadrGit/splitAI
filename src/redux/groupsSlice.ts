import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import firestore from '@react-native-firebase/firestore';
import { Group } from '../types';

interface GroupsState {
  groups: Group[];
  loading: boolean;
  error: string | null;
  currentGroup: Group | null;
}

const initialState: GroupsState = {
  groups: [],
  loading: false,
  error: null,
  currentGroup: null,
};

// Fetch all groups for a user
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (userId: string) => {
    const groupsSnapshot = await firestore()
      .collection('groups')
      .where('members', 'array-contains', userId)
      .get();
    
    return groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Group));
  }
);

// Create a new group
export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (group: Omit<Group, 'id'>) => {
    const db = firestore();
    const groupsCollection = db.collection('groups');
    
    // Add the new group
    const docRef = await groupsCollection.add(group);
    const newGroup = await docRef.get();
    
    return {
      id: newGroup.id,
      ...newGroup.data(),
    } as Group;
  }
);

// Fetch a single group by ID
export const fetchGroupById = createAsyncThunk(
  'groups/fetchGroupById',
  async (groupId: string) => {
    const groupDoc = await firestore()
      .collection('groups')
      .doc(groupId)
      .get();
    
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }
    
    return {
      id: groupDoc.id,
      ...groupDoc.data(),
    } as Group;
  }
);

// Add members to a group
export const addMembersToGroup = createAsyncThunk(
  'groups/addMembersToGroup',
  async ({ groupId, memberIds }: { groupId: string; memberIds: string[] }) => {
    const db = firestore();
    const groupRef = db.collection('groups').doc(groupId);
    
    // Get current group data
    const groupDoc = await groupRef.get();
    if (!groupDoc.exists) {
      throw new Error('Group not found');
    }
    
    const groupData = groupDoc.data();
    const currentMembers = groupData?.members || [];
    
    // Add new members (avoid duplicates)
    const updatedMembers = [...new Set([...currentMembers, ...memberIds])];
    
    // Update the group
    await groupRef.update({
      members: updatedMembers
    });
    
    // Get the updated group
    const updatedGroupDoc = await groupRef.get();
    
    return {
      id: updatedGroupDoc.id,
      ...updatedGroupDoc.data(),
    } as Group;
  }
);

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch groups';
      })
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.groups.push(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create group';
      })
      .addCase(fetchGroupById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload;
      })
      .addCase(fetchGroupById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch group';
      })
      .addCase(addMembersToGroup.fulfilled, (state, action) => {
        // Update the group in the groups array
        const index = state.groups.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
        
        // Update current group if it's the same one
        if (state.currentGroup && state.currentGroup.id === action.payload.id) {
          state.currentGroup = action.payload;
        }
      });
  },
});

export const { clearCurrentGroup } = groupsSlice.actions;
export default groupsSlice.reducer; 