import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchFriends, addFriend } from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Friend } from '../types';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

export const FriendsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { friends, loading: friendsLoading } = useSelector(
    (state: RootState) => state.friends,
  );
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user]);


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return false;
    return emailRegex.test(email);
  };

  const handleAddFriend = async (
    friendId: string,
    displayName: string,
    email?: string,
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      await dispatch(
        addFriend({
          userId: user.id,
          friendId,
          displayName,
          email,
          createdAt: new Date(),
        }),
      ).unwrap();

      dispatch(fetchFriends(user.id));
      setShowAddFriend(false);
      Alert.alert('Success', 'Friend added successfully');
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
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    handleAddFriend(manualName, manualName, manualEmail);
    setManualName('');
    setManualEmail('');
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const displayName = item.displayName || item.email || item.friendId;
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <Card style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={styles.friendLeft}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: theme.colors.secondary },
              ]}>
              <ThemeText style={styles.avatarText}>{initial}</ThemeText>
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
            </View>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaWrapper>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header
          title="Friends"
          rightIcon="account-plus"
          onRightPress={() => setShowAddFriend(true)}
        />

        {friendsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.friendsContainer}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="account-group"
                  size={20}
                  color={theme.colors.secondary}
                />
                <ThemeText variant="title" style={styles.sectionTitle}>
                  Friends ({friends.length})
                </ThemeText>
              </View>
              {friends.length > 0 ? (
                <FlatList
                  data={friends}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Icon
                    name="account-group"
                    size={64}
                    color={theme.colors.placeholder}
                  />
                  <ThemeText variant="title" style={styles.emptyTitle}>
                    No Friends Yet
                  </ThemeText>
                  <ThemeText style={styles.emptyText}>
                    Add friends to split expenses with them
                  </ThemeText>
                  <CustomButton
                    title="Add a Friend"
                    onPress={() => setShowAddFriend(true)}
                    style={styles.addFriendButton}
                    icon={
                      <Icon name="account-plus" size={20} color="#FFFFFF" />
                    }
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Add Friend Modal */}
        <Modal
          visible={showAddFriend}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddFriend(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.background },
              ]}>
              <View style={styles.modalHeader}>
                <ThemeText variant="title">Add a Friend</ThemeText>
                <TouchableOpacity onPress={() => setShowAddFriend(false)}>
                  <Icon name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.manualAddForm}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Friend's Name"
                  placeholderTextColor={theme.colors.placeholder}
                  value={manualName}
                  onChangeText={setManualName}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="Friend's Email (optional)"
                  placeholderTextColor={theme.colors.placeholder}
                  value={manualEmail}
                  onChangeText={setManualEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <CustomButton
                  title="Add Friend"
                  onPress={handleManualAdd}
                  style={styles.modalButton}
                  loading={loading}
                  icon={
                    <Icon name="account-plus" size={20} color="#FFFFFF" />
                  }
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaWrapper>
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
  friendsContainer: {
    flex: 1,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
  friendCard: {
    marginBottom: 12,
    padding: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendLeft: {
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
    fontSize: 18,
    fontWeight: '600',
  },
  friendName: {
    fontWeight: '600',
  },
  friendEmail: {
    marginTop: 2,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  addFriendButton: {
    minWidth: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  searchResultInfo: {
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
    minWidth: 80,
  },
  searchLoading: {
    marginTop: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  noResultsText: {
    marginBottom: 16,
    opacity: 0.7,
  },
  manualAddButton: {
    minWidth: 150,
  },
  manualAddForm: {
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButton: {
    marginTop: 8,
  },
});

export default FriendsScreen;
