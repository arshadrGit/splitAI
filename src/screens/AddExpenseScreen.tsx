import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { useTheme } from '../themes/ThemeProvider';
import { Header } from '../components/Header';
import AddExpenseForm from '../components/AddExpenseForm';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ThemeText } from '../components/ThemeText';
import { fetchFriends } from '../redux/friendsSlice';
import { Card } from '../components/Card';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const AddExpenseScreen = ({ route, navigation }: Props) => {
  const { groupId = '' } = route.params || {};
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const { user } = useSelector((state: RootState) => state.auth);
  const { friends, loading: friendsLoading } = useSelector((state: RootState) => state.friends);
  const isFocused = useIsFocused();
  
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isPersonalExpense, setIsPersonalExpense] = useState(groupId === '');
  const [isFromTabBar, setIsFromTabBar] = useState(false);
  const [showFriendSelector, setShowFriendSelector] = useState(false);

  useEffect(() => {
    // Check if this screen is being accessed from the tab bar
    const parentRoute = navigation.getParent?.()?.getState?.().routes.find(r => r.name === 'MainTabs');
    const isFromTab = parentRoute?.state?.routes.some(r => r.name === 'AddExpense');
    setIsFromTabBar(!!isFromTab || !navigation.getParent);
    
    // If no groupId is provided, fetch friends to select as participants
    if (!groupId && user) {
      dispatch(fetchFriends(user.id));
    }
    
    // For personal expenses, always include the current user
    if (!groupId && user) {
      setSelectedParticipants([user.id]);
    }
  }, [groupId, user, dispatch, navigation]);

  // Reset form when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      setSelectedParticipants(user ? [user.id] : []);
      setIsPersonalExpense(groupId === '');
      setShowFriendSelector(false);
    }
  }, [isFocused, user, groupId]);

  if ((groupId && groupLoading) || (!groupId && friendsLoading)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.modalHandle} />
        <Header 
          title="Add Expense" 
          leftIcon={!isFromTabBar ? "arrow-left" : "close"}
          onLeftPress={() => navigation.goBack?.()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  // Toggle a friend's selection
  const toggleFriendSelection = (friendId: string) => {
    setSelectedParticipants(prev => {
      // Always include the current user
      const userIncluded = user ? [user.id] : [];
      
      if (prev.includes(friendId)) {
        // Remove friend if already selected
        return [...userIncluded, ...prev.filter(id => id !== friendId && id !== user?.id)];
      } else {
        // Add friend if not selected
        return [...userIncluded, ...prev.filter(id => id !== user?.id), friendId];
      }
    });
  };

  // Get display name for a user ID
  const getDisplayName = (userId: string) => {
    if (userId === user?.id) return 'You';
    
    // Check in friends list
    const friend = friends.find(f => f.friendId === userId);
    if (friend?.displayName) return friend.displayName;
    
    // If not found, just return the ID
    return userId;
  };

  // Determine participants based on whether this is a group expense or personal expense
  const participants = groupId ? (currentGroup?.members || []) : 
    isPersonalExpense ? (user ? [user.id] : []) : 
    selectedParticipants;

  const renderFriendSelector = () => (
    <Card style={styles.friendsCard}>
      <View style={styles.friendsHeader}>
        <ThemeText variant="title" style={styles.sectionTitle}>
          Split with Friends
        </ThemeText>
        <TouchableOpacity 
          style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowFriendSelector(false)}
        >
          <ThemeText style={styles.doneButtonText}>Done</ThemeText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={friends}
        keyExtractor={item => item.friendId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.friendItem,
              selectedParticipants.includes(item.friendId) && { 
                backgroundColor: theme.colors.primary + '20' 
              }
            ]}
            onPress={() => toggleFriendSelection(item.friendId)}
          >
            <View style={styles.friendInfo}>
              <Icon 
                name="account" 
                size={24} 
                color={selectedParticipants.includes(item.friendId) ? 
                  theme.colors.primary : theme.colors.text} 
              />
              <ThemeText style={[
                styles.friendName,
                selectedParticipants.includes(item.friendId) && { 
                  color: theme.colors.primary 
                }
              ]}>
                {item.displayName || item.email || item.friendId}
              </ThemeText>
            </View>
            {selectedParticipants.includes(item.friendId) && (
              <Icon name="check" size={24} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyFriends}>
            <Icon name="account-off" size={48} color={theme.colors.placeholder} />
            <ThemeText style={styles.emptyText}>No friends found</ThemeText>
          </View>
        }
      />
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.modalHandle} />
      <Header 
        title="Add Expense" 
        leftIcon={!isFromTabBar ? "arrow-left" : "close"}
        onLeftPress={() => navigation.goBack?.()} 
      />
      
      <ScrollView>
        {!groupId && !showFriendSelector && (
          <Card style={styles.typeCard}>
            <ThemeText variant="title" style={styles.sectionTitle}>
              Expense Type
            </ThemeText>
            <View style={styles.typeOptions}>
              <TouchableOpacity 
                style={[
                  styles.typeOption,
                  isPersonalExpense && { backgroundColor: theme.colors.primary + '20' }
                ]}
                onPress={() => setIsPersonalExpense(true)}
              >
                <Icon 
                  name="account" 
                  size={24} 
                  color={isPersonalExpense ? theme.colors.primary : theme.colors.text} 
                />
                <ThemeText style={[
                  styles.typeTitle,
                  isPersonalExpense && { color: theme.colors.primary }
                ]}>
                  Personal Expense
                </ThemeText>
                <ThemeText style={styles.typeDescription}>
                  Just for you
                </ThemeText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.typeOption,
                  !isPersonalExpense && { backgroundColor: theme.colors.primary + '20' }
                ]}
                onPress={() => {
                  setIsPersonalExpense(false);
                  setShowFriendSelector(true);
                }}
              >
                <Icon 
                  name="account-multiple" 
                  size={24} 
                  color={!isPersonalExpense ? theme.colors.primary : theme.colors.text} 
                />
                <ThemeText style={[
                  styles.typeTitle,
                  !isPersonalExpense && { color: theme.colors.primary }
                ]}>
                  Friend Expense
                </ThemeText>
                <ThemeText style={styles.typeDescription}>
                  Split with friends
                </ThemeText>
              </TouchableOpacity>
            </View>
            
            {!isPersonalExpense && selectedParticipants.length > 1 && (
              <View style={styles.selectedFriends}>
                <ThemeText style={styles.selectedTitle}>Selected Friends:</ThemeText>
                <View style={styles.friendChips}>
                  {selectedParticipants
                    .filter(id => id !== user?.id)
                    .map(friendId => (
                      <View 
                        key={friendId} 
                        style={[styles.friendChip, { backgroundColor: theme.colors.primary + '20' }]}
                      >
                        <ThemeText style={[styles.friendChipText, { color: theme.colors.primary }]}>
                          {getDisplayName(friendId)}
                        </ThemeText>
                      </View>
                    ))}
                  <TouchableOpacity
                    style={[styles.editButton, { borderColor: theme.colors.primary }]}
                    onPress={() => setShowFriendSelector(true)}
                  >
                    <ThemeText style={{ color: theme.colors.primary }}>Edit</ThemeText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Card>
        )}
        
        {showFriendSelector ? (
          renderFriendSelector()
        ) : (
          <AddExpenseForm 
            key={`expense-form-${isFocused}`}
            groupId={groupId || undefined}
            participants={participants}
            friends={friends}
            onSuccess={() => {
              Alert.alert('Success', 'Expense added successfully', [
                { 
                  text: 'OK', 
                  onPress: () => {
                    if (!isFromTabBar) {
                      navigation.goBack?.();
                    }
                  } 
                }
              ]);
            }}
            onCancel={!isFromTabBar ? () => navigation.goBack?.() : undefined}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCard: {
    margin: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  typeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeOption: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeTitle: {
    fontWeight: '600',
    marginTop: 8,
  },
  typeDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedFriends: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  selectedTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  friendChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  friendChipText: {
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  friendsCard: {
    margin: 16,
    padding: 16,
  },
  friendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    marginLeft: 12,
    fontSize: 16,
  },
  emptyFriends: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.7,
  },
});

export default AddExpenseScreen; 