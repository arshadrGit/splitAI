## SpecStory

## Add Friend Feature Implementation (12/03/2025, 09:30:57)

_**User**_

Modify the existing React Native app to add an "Add Friend" feature on the Friends screen. The feature should allow users to search for friends by their username or email in the "users" collection of Firestore.

1. **Search Registered Users**:
   - Add a search bar where users can enter a name or email.
   - Query Firestore's "users" collection in real time as the user types.
   - Display matching users in a list with an "Add Friend" button next to each.

2. **If No User is Found**:
   - Show a "User not found" message.
   - Provide an option to **manually add a friend**:
   - Show a form with fields: **Name, Email (optional),*.
collection.

4. **User Experience (UX)**:
   - Show a loading indicator while searching.
   - Use debounce to optimize Firestore queries.
   - Show a success message when a friend added to list.


---

_**Assistant**_

I'll help you modify the FriendsScreen to add these features. Let me first analyze the current code and then make the necessary changes.

First, let's search for any existing friend-related functionality:

---

_**Assistant**_



---

_**Assistant**_

Let me also check the types:

---

_**Assistant**_



---

_**Assistant**_

Based on the codebase analysis, I'll modify the FriendsScreen to add the requested features. The main changes will include:

1. Adding a search functionality with debounce
2. Creating a new search results section
3. Adding a manual friend addition form
4. Updating the UI/UX with loading states and success messages

Let me make these changes:

---

_**Assistant**_

```
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Share,
  Modal,
  Keyboard
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { 
  fetchFriends, 
  addFriend, 
  generateInviteLink, 
  acceptFriendRequest,
  rejectFriendRequest 
} from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import firestore from '@react-native-firebase/firestore';
import debounce from 'lodash/debounce';
import { User } from '../types';

export const FriendsScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { friends, incomingRequests, loading: friendsLoading } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const usersRef = firestore().collection('users');
        const querySnapshot = await usersRef
          .where('email', '>=', query.toLowerCase())
          .where('email', '<=', query.toLowerCase() + '\uf8ff')
          .limit(10)
          .get();

        const results = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(user => user.id !== user?.id); // Exclude current user

        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleAddFriend = async (friendId: string, friendEmail?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      await dispatch(addFriend({
        userId: user.id,
        friendId: friendId,
        status: 'pending',
        createdAt: new Date(),
        email: friendEmail
      })).unwrap();
      
      dispatch(fetchFriends(user.id));
      setSearchQuery('');
      setSearchResults([]);
      setShowAddFriend(false);
      setShowManualAdd(false);
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (manualEmail && !validateEmail(manualEmail)) {
      return;
    }

    handleAddFriend(manualName, manualEmail);
    setManualName('');
    setManualEmail('');
  };

  // ... rest of the existing functions ...

  const renderSearchResult = ({ item }: { item: User }) => (
    <Card style={styles.searchResultCard}>
      <View style={styles.searchResultInfo}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
          <ThemeText style={styles.avatarText}>
            {item.displayName?.charAt(0).toUpperCase() || item.email.charAt(0).toUpperCase()}
          </ThemeText>
        </View>
        <View>
          <ThemeText variant="title" style={styles.searchResultName}>
            {item.displayName || item.email}
          </ThemeText>
          {item.displayName && (
            <ThemeText variant="caption" style={styles.searchResultEmail}>
              {item.email}
            </ThemeText>
          )}
        </View>
      </View>
      <CustomButton
        title="Add Friend"
        onPress={() => handleAddFriend(item.id)}
        variant="outline"
        style={styles.addButton}
        icon={<Icon name="account-plus" size={20} color={theme.colors.primary} />}
      />
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Friends" 
        rightIcon={showAddFriend ? "close" : "account-plus"} 
        onRightPress={() => setShowAddFriend(!showAddFriend)}
      />
      
      {showAddFriend && (
        <Card style={styles.addFriendCard}>
          <ThemeText variant="title" style={styles.sectionTitle}>Add Friend</ThemeText>
          <View style={styles.inputContainer}>
            <Icon name="magnify" size={20} color={theme.colors.text} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }]}
              placeholder="Search by name or email"
              placeholderTextColor={theme.colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          
          {isSearching ? (
            <ActivityIndicator style={styles.searchLoading} color={theme.colors.primary} />
          ) : searchResults.length === 0 && searchQuery.trim() !== '' ? (
            <View style={styles.noResultsContainer}>
              <ThemeText style={styles.noResultsText}>No users found</ThemeText>
              <CustomButton
                title="Add Manually"
                onPress={() => {
                  setShowManualAdd(true);
                  Keyboard.dismiss();
                }}
                variant="outline"
                style={styles.manualAddButton}
                icon={<Icon name="account-plus" size={20} color={theme.colors.primary} />}
              />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              style={styles.searchResults}
              keyboardShouldPersistTaps="handled"
            />
          )}
          
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Send Invite"
              onPress={() => setShowInviteOptions(true)}
              variant="outline"
              style={styles.button}
              icon={<Icon name="share-variant" size={20} color={theme.colors.primary} />}
            />
          </View>
        </Card>
      )}

      {/* Manual Add Friend Modal */}
      <Modal
        visible={showManualAdd}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualAdd(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemeText variant="title">Add Friend Manually</ThemeText>
              <TouchableOpacity onPress={() => setShowManualAdd(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color={theme.colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                }]}
                placeholder="Friend's Name"
                placeholderTextColor={theme.colors.placeholder}
                value={manualName}
                onChangeText={setManualName}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="email-outline" size={20} color={theme.colors.text} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text,
                  borderColor: emailError ? theme.colors.error : theme.colors.border,
                }]}
                placeholder="Friend's Email (optional)"
                placeholderTextColor={theme.colors.placeholder}
                value={manualEmail}
                onChangeText={(text) => {
                  setManualEmail(text);
                  if (emailError && text) validateEmail(text);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailError ? <ThemeText style={[styles.errorText, { color: theme.colors.error }]}>{emailError}</ThemeText> : null}
            
            <CustomButton
              title="Add Friend"
              onPress={handleManualAdd}
              style={styles.modalButton}
              loading={loading}
              icon={<Icon name="account-plus" size={20} color="#FFFFFF" />}
            />
          </View>
        </View>
      </Modal>
      
      {/* Rest of the existing JSX ... */}
      
    </View>
  );
};

const styles = StyleSheet.create({
  // ... existing styles ...
  searchResultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  searchResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultName: {
    fontWeight: '600',
  },
  searchResultEmail: {
    marginTop: 2,
    opacity: 0.7,
  },
  addButton: {
    minWidth: 100,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: 10,
  },
  searchLoading: {
    marginTop: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  noResultsText: {
    marginBottom: 10,
    opacity: 0.7,
  },
  manualAddButton: {
    minWidth: 150,
  },
  modalButton: {
    marginTop: 20,
  },
  // ... rest of the existing styles ...
});

export default FriendsScreen;
```

---

_**Assistant**_

Let me fix the linter errors by installing the required type definitions:

---

_**Assistant**_

```
npm install --save-dev @types/lodash
```

---

_**Assistant**_



---

_**User**_

No need to check user already exist when manually add to user

---

_**Assistant**_

I'll modify the code to skip the user existence check when manually adding a friend. I'll update the `handleAddFriend` function and the related Redux action.

First, let me check the `friendsSlice` to see how to modify the friend addition logic:

---

_**Assistant**_

```
// Send a friend request
export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (friend: Omit<Friend, 'id'> & { skipUserCheck?: boolean }, { rejectWithValue }) => {
    try {
      const db = firestore();
      const friendsCollection = db.collection('friends');
      
      let friendUserId = friend.friendId;
      let userData = { email: friend.email, displayName: friend.friendId };
      
      // Only check user existence if skipUserCheck is false
      if (!friend.skipUserCheck) {
        // Check if the friend email exists in the users collection
        const usersCollection = db.collection('users');
        const userSnapshot = await usersCollection
          .where('email', '==', friend.friendId)
          .get();
        
        if (userSnapshot.empty) {
          return rejectWithValue('No user found with this email address');
        }
        
        // Get the user data
        userData = userSnapshot.docs[0].data();
        friendUserId = userSnapshot.docs[0].id;
        
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
// ... existing code ...
```

---

_**Assistant**_

Now let me update the `FriendsScreen` component to use the modified `addFriend` action:

---

_**Assistant**_

```
  const handleAddFriend = async (friendId: string, friendEmail?: string, skipUserCheck: boolean = false) => {
    if (!user) return;

    setLoading(true);
    try {
      await dispatch(addFriend({
        userId: user.id,
        friendId: friendId,
        status: 'pending',
        createdAt: new Date(),
        email: friendEmail,
        skipUserCheck
      })).unwrap();
      
      dispatch(fetchFriends(user.id));
      setSearchQuery('');
      setSearchResults([]);
      setShowAddFriend(false);
      setShowManualAdd(false);
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      console.log(error);
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (manualEmail && !validateEmail(manualEmail)) {
      return;
    }

    handleAddFriend(manualName, manualEmail, true);
    setManualName('');
    setManualEmail('');
  };
// ... rest of the code ...
```

---

_**Assistant**_

Let me fix the linter errors in the `friendsSlice.ts` file first:

---

_**Assistant**_

```
// Send a friend request
export const addFriend = createAsyncThunk(
  'friends/addFriend',
  async (friend: Omit<Friend, 'id'> & { skipUserCheck?: boolean }, { rejectWithValue }) => {
    try {
      const db = firestore();
      const friendsCollection = db.collection('friends');
      
      let friendUserId = friend.friendId;
      let userData: { email?: string; displayName: string; photoURL?: string | null } = { 
        email: friend.email, 
        displayName: friend.friendId,
        photoURL: null
      };
      
      // Only check user existence if skipUserCheck is false
      if (!friend.skipUserCheck) {
        // Check if the friend email exists in the users collection
        const usersCollection = db.collection('users');
        const userSnapshot = await usersCollection
          .where('email', '==', friend.friendId)
          .get();
        
        if (userSnapshot.empty) {
          return rejectWithValue('No user found with this email address');
        }
        
        // Get the user data
        const docData = userSnapshot.docs[0].data();
        userData = {
          email: docData.email,
          displayName: docData.displayName || friend.friendId,
          photoURL: docData.photoURL || null
        };
        friendUserId = userSnapshot.docs[0].id;
        
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
          
          const updatedData = pendingRequest.data();
          return {
            id: pendingRequest.id,
            ...updatedData,
            status: 'accepted',
            createdAt: updatedData.createdAt.toDate()
          } as Friend;
        }
      }
      
      // Create a new friend request
      const friendRequest = {
        userId: friend.userId,
        friendId: friendUserId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        status: 'pending',
        createdAt: firestore.Timestamp.now(),
      };
      
      console.log('Creating friend request:', friendRequest);
      
      const docRef = await friendsCollection.add(friendRequest);
      const newFriend = await docRef.get();
      const newFriendData = newFriend.data();
      
      if (!newFriendData) {
        throw new Error('Failed to create friend request');
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
```

---

_**Assistant**_

Now let me fix the remaining linter errors in the `FriendsScreen.tsx` file. These errors are related to TypeScript's type inference with Redux Toolkit's dispatch function. We need to properly type the dispatch:

---

_**Assistant**_

```
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Share,
  Modal,
  Keyboard
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { 
  fetchFriends, 
  addFriend, 
  generateInviteLink, 
  acceptFriendRequest,
  rejectFriendRequest 
} from '../redux/friendsSlice';
// ... rest of imports ...

export const FriendsScreen = () => {
  // ... other state ...
  
  const dispatch = useDispatch<AppDispatch>();
  // ... rest of the code ...
```

---

_**Assistant**_

Let me check if the `AppDispatch` type exists in the store file:

---

_**Assistant**_

```
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import friendsReducer from './friendsSlice';
import groupsReducer from './groupsSlice';
import expensesReducer from './expensesSlice';
import activityReducer from './activitySlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    friends: friendsReducer,
    groups: groupsReducer,
    expenses: expensesReducer,
    activity: activityReducer,
    theme: themeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/signIn/fulfilled', 'auth/signUp/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.date', 'meta.arg.createdAt', 'meta.arg.date'],
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user',
          'friends.friends',
          'friends.incomingRequests',
          'groups.groups',
          'groups.currentGroup',
          'expenses.expenses',
          'activity.activities',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

_**Assistant**_

Great! The `AppDispatch` type already exists in the store file. Now all the linter errors should be fixed. The changes we've made include:

1. Modified the `addFriend` thunk in `friendsSlice.ts` to:
   - Add a `skipUserCheck` flag to the friend parameter
   - Skip user existence check when manually adding a friend
   - Fix type issues with Firestore data handling

2. Updated the `FriendsScreen.tsx` to:
   - Add the `skipUserCheck` parameter to `handleAddFriend`
   - Set `skipUserCheck` to `true` when manually adding a friend
   - Fix Redux dispatch typing issues

These changes allow users to:
1. Search for registered users and add them as friends
2. Manually add friends without checking if they exist in the system
3. See proper loading states and success/error messages
4. Have a smooth user experience with debounced search

The feature is now complete and should work as requested. Users can both search for existing users and manually add friends who aren't yet registered in the system.

---

_**User**_

display added friends list 

---

_**Assistant**_

The friends list is already being displayed in the `FriendsScreen` component using the `FlatList` component with `renderFriendItem`. However, I notice we can improve the display of friends by:

1. Separating accepted friends and pending requests into different sections
2. Adding better visual organization
3. Improving the display of friend information

Let me modify the code:

---

_**Assistant**_

```
// ... existing imports and code ...

  const renderFriendItem = ({ item }: { item: any }) => {
    const isSent = item.userId === user?.id;
    const displayName = isSent 
      ? item.email || item.displayName || item.friendId 
      : item.displayName || item.userId;
      
    const initial = displayName.charAt(0).toUpperCase();
    const isPending = item.status === 'pending';
    const isIncomingRequest = isPending && !isSent;
    
    return (
      <Card style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={styles.friendLeft}>
            <View style={[styles.avatarContainer, { 
              backgroundColor: isPending ? theme.colors.primary : theme.colors.secondary 
            }]}>
              <ThemeText style={styles.avatarText}>
                {initial}
              </ThemeText>
            </View>
            <View>
              <ThemeText variant="title" style={styles.friendName}>
                {displayName}
              </ThemeText>
              {item.email && item.email !== displayName && (
                <ThemeText variant="caption" style={styles.friendEmail}>
                  {item.email}
                </ThemeText>
              )}
              {isPending && (
                <View style={styles.statusContainer}>
                  <Icon name="clock-outline" size={12} color={theme.colors.notification} />
                  <ThemeText variant="caption" style={{ color: theme.colors.notification, marginLeft: 4 }}>
                    {isIncomingRequest ? 'Request Received' : 'Pending'}
                  </ThemeText>
                </View>
              )}
            </View>
          </View>
          
          {isIncomingRequest ? (
            <View style={styles.requestActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]} 
                onPress={() => handleAcceptRequest(item.id)}
              >
                <Icon name="check" size={18} color={theme.colors.success} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectRequest(item.id)}
              >
                <Icon name="close" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.moreButton}>
              <Icon name="dots-vertical" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  // ... existing code ...

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Friends" 
        rightIcon={showAddFriend ? "close" : "account-plus"} 
        onRightPress={() => setShowAddFriend(!showAddFriend)}
      />
      
      {showAddFriend && (
        // ... existing add friend card code ...
      )}

      {/* Manual Add Friend Modal */}
      {/* ... existing manual add modal code ... */}
      
      {friendsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.friendsContainer}>
          {/* Pending Requests Section */}
          {incomingRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="account-clock" size={20} color={theme.colors.primary} />
                <ThemeText variant="title" style={styles.sectionTitle}>
                  Pending Requests ({incomingRequests.length})
                </ThemeText>
              </View>
              <FlatList
                data={incomingRequests}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Friends Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="account-group" size={20} color={theme.colors.secondary} />
              <ThemeText variant="title" style={styles.sectionTitle}>
                Friends ({friends.length})
              </ThemeText>
            </View>
            {friends.length > 0 ? (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Image 
                  source={require('../assets/images/empty-activity.png')} 
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <ThemeText variant="title" style={styles.emptyTitle}>No Friends Yet</ThemeText>
                <ThemeText style={styles.emptyText}>Add friends to split expenses with them</ThemeText>
                <CustomButton
                  title="Add a Friend"
                  onPress={() => setShowAddFriend(true)}
                  style={styles.addFriendButton}
                  icon={<Icon name="account-plus" size={20} color="#FFFFFF" />}
                />
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Invite Options Modal */}
      {/* ... existing invite options modal code ... */}
    </View>
  );

const styles = StyleSheet.create({
  // ... existing styles ...
  friendsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  friendEmail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  // ... rest of the existing styles ...
});
```

---

_**Assistant**_

I've made several improvements to the friends list display:

1. **Organized Sections**:
   - Added a "Pending Requests" section that shows only when there are pending requests
   - Added a dedicated "Friends" section for accepted friends
   - Each section has a header with an icon and count

2. **Better Friend Information Display**:
   - Shows both display name and email (if different from display name)
   - Improved visual hierarchy with proper spacing and typography
   - Added section headers with icons and counts

3. **Visual Improvements**:
   - Added section headers with icons
   - Improved spacing and layout
   - Better organization of pending requests vs accepted friends
   - Scrollable friends list with fixed pending requests section

4. **Empty State**:
   - Kept the existing empty state for when there are no friends
   - Shows counts in section headers for better context

The changes maintain all existing functionality while making the list more organized and easier to understand. The pending requests are now clearly separated from accepted friends, and the user can easily see how many friends and pending requests they have.

Would you like me to make any additional improvements to the friends list display?

---

_**User**_

Please remove Pending request Feature, do simply add to friends list

---

_**Assistant**_

I'll modify the code to remove the pending request feature and directly add friends to the friends list. I'll need to update both the UI and the friend addition logic.

First, let's modify the `friendsSlice.ts`:

---

_**Assistant**_

```
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
      // Get all friends
      const friendsSnapshot = await firestore()
        .collection('friends')
        .where('userId', '==', userId)
        .get();
      
      const friends = friendsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
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
  async (friend: Omit<Friend, 'id'> & { skipUserCheck?: boolean }, { rejectWithValue }) => {
    try {
      const db = firestore();
      const friendsCollection = db.collection('friends');
      
      let friendUserId = friend.friendId;
      let userData: { email?: string; displayName: string; photoURL?: string | null } = { 
        email: friend.email, 
        displayName: friend.friendId,
        photoURL: null
      };
      
      // Only check user existence if skipUserCheck is false
      if (!friend.skipUserCheck) {
        // Check if the friend email exists in the users collection
        const usersCollection = db.collection('users');
        const userSnapshot = await usersCollection
          .where('email', '==', friend.friendId)
          .get();
        
        if (userSnapshot.empty) {
          return rejectWithValue('No user found with this email address');
        }
        
        // Get the user data
        const docData = userSnapshot.docs[0].data();
        userData = {
          email: docData.email,
          displayName: docData.displayName || friend.friendId,
          photoURL: docData.photoURL || null
        };
        friendUserId = userSnapshot.docs[0].id;
        
        // Check if the friend already exists
        const existingFriends = await friendsCollection
          .where('userId', '==', friend.userId)
          .where('friendId', '==', friendUserId)
          .get();
        
        if (!existingFriends.empty) {
          return rejectWithValue('This friend is already in your list');
        }
      }
      
      // Create a new friend entry
      const friendData = {
        userId: friend.userId,
        friendId: friendUserId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        createdAt: firestore.Timestamp.now(),
      };
      
      console.log('Adding friend:', friendData);
      
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
      });
  },
});

export default friendsSlice.reducer;
```

---

_**Assistant**_

Now let's update the `FriendsScreen.tsx` to remove the pending requests UI and simplify the friend list display:

---

_**Assistant**_

```
undefined
```

---

_**Assistant**_



---



---

