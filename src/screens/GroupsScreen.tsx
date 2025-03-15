import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Pressable
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppDispatch, RootState } from '../redux/store';
import { fetchGroups, createGroup, deleteGroup } from '../redux/groupsSlice';
import { fetchFriends } from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Group } from '../types';

type RootStackParamList = {
  GroupDetail: { groupId: string };
  Friends: undefined;
};

export const GroupsScreen = () => {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { groups, loading: groupsLoading } = useSelector((state: RootState) => state.groups);
  const { friends } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchGroups(user.id));
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      // Include the current user and selected friends in the group
      const members = [user.id, ...selectedFriends];
      
      await dispatch(createGroup({
        name: groupName,
        members,
        createdBy: user.id,
        createdAt: new Date(),
        totalExpenses: 0,
      })).unwrap();
      
      setGroupName('');
      setSelectedFriends([]);
      setShowCreateGroup(false);
      Alert.alert('Success', 'Group created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const navigateToGroupDetail = (groupId: string) => {
    navigation.navigate('GroupDetail', { groupId });
  };

  const handleDeleteGroup = (groupId: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteGroup(groupId)).unwrap();
              Alert.alert('Success', 'Group deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (groupId: string) => {
    return (
      <Pressable
        style={[styles.deleteAction, { backgroundColor: theme.colors.error }]}
        onPress={() => handleDeleteGroup(groupId)}
      >
        <Icon name="delete" size={24} color="#FFFFFF" />
      </Pressable>
    );
  };

  const renderGroupItem = ({ item }: { item: any }) => {
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <TouchableOpacity onPress={() => navigateToGroupDetail(item.id)}>
          <Card style={styles.groupCard}>
            <View style={styles.groupInfo}>
              <View style={styles.groupLeft}>
                <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
                  <ThemeText style={styles.avatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </ThemeText>
                </View>
                <View>
                  <ThemeText variant="title" style={styles.groupName}>
                    {item.name}
                  </ThemeText>
                  <ThemeText variant="caption">
                    {item.members.length} {item.members.length === 1 ? 'member' : 'members'}
                  </ThemeText>
                </View>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.text} />
            </View>
          </Card>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header 
          title="Groups" 
          rightIcon="plus"
          onRightPress={() => setShowCreateGroup(true)}
        />
        
        {groupsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Image 
                  source={require('../assets/images/empty-activity.png')} 
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <ThemeText variant="title" style={styles.emptyTitle}>No Groups Yet</ThemeText>
                <ThemeText style={styles.emptyText}>
                  Create a group to start splitting expenses with friends
                </ThemeText>
                <CustomButton
                  title="Create a Group"
                  onPress={() => setShowCreateGroup(true)}
                  icon={<Icon name="plus" size={20} color="#FFFFFF" />}
                />
              </View>
            }
          />
        )}
        
        {/* Create Group Modal */}
        <Modal
          visible={showCreateGroup}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCreateGroup(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <ThemeText variant="title">Create a New Group</ThemeText>
                <TouchableOpacity onPress={() => setShowCreateGroup(false)}>
                  <Icon name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Icon name="account-group" size={24} color={theme.colors.text} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { 
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    backgroundColor: theme.colors.background
                  }]}
                  placeholder="Group Name"
                  placeholderTextColor={theme.colors.placeholder}
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>
              
              <ThemeText variant="subtitle" style={styles.sectionTitle}>Add Friends</ThemeText>
              
              {friends.length > 0 ? (
                <ScrollView style={styles.friendsList}>
                  {friends.map(friend => (
                    <TouchableOpacity 
                      key={friend.id} 
                      style={[
                        styles.friendItem,
                        selectedFriends.includes(friend.friendId) && {
                          backgroundColor: `${theme.colors.primary}20`
                        }
                      ]}
                      onPress={() => toggleFriendSelection(friend.friendId)}
                    >
                      <View style={styles.friendItemLeft}>
                        <View style={[styles.checkboxContainer, {
                          borderColor: theme.colors.primary,
                          backgroundColor: selectedFriends.includes(friend.friendId) 
                            ? theme.colors.primary 
                            : 'transparent'
                        }]}>
                          {selectedFriends.includes(friend.friendId) && (
                            <Icon name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <ThemeText>{friend.email}</ThemeText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noFriendsContainer}>
                  <ThemeText style={styles.noFriendsText}>
                    You need to add friends before creating a group
                  </ThemeText>
                  <CustomButton
                    title="Add Friends"
                    onPress={() => {
                      setShowCreateGroup(false);
                      navigation.navigate('Friends');
                    }}
                    variant="outline"
                    style={styles.addFriendsButton}
                  />
                </View>
              )}
              
              <CustomButton
                title="Create Group"
                onPress={handleCreateGroup}
                loading={loading}
                disabled={!groupName.trim() || friends.length === 0}
                style={styles.createButton}
                icon={<Icon name="check" size={20} color="#FFFFFF" />}
              />
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    // padding: 16,
    flexGrow: 1,
  },
  groupCard: {
    // marginBottom: 12,
    marginHorizontal:0,
    marginBottom: 2,
    padding: 0,
    paddingVertical:10,
    paddingHorizontal:32,
    borderRadius: 0,
  },
  groupInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  groupName: {
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    marginBottom: 24,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  sectionTitle: {
    marginBottom: 10,
    fontWeight: '600',
  },
  friendsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  friendItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noFriendsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noFriendsText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  addFriendsButton: {
    marginTop: 8,
  },
  createButton: {
    marginTop: 10,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '100%',
    marginBottom: 12,
  },
});

export default GroupsScreen; 