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
  
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const { friends, loading: friendsLoading } = useSelector((state: RootState) => state.friends);
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

  const handleGenerateInviteLink = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const link = await dispatch(generateInviteLink(user.id)).unwrap();
      setInviteLink(link);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(inviteLink);
    Alert.alert('Success', 'Invite link copied to clipboard');
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join me on SplitEase! Use this link to sign up: ${inviteLink}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share invite link');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await dispatch(acceptFriendRequest(requestId)).unwrap();
      Alert.alert('Success', 'Friend request accepted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await dispatch(rejectFriendRequest(requestId)).unwrap();
      Alert.alert('Success', 'Friend request rejected');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject friend request');
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    const displayName = item.displayName || item.email || item.friendId;
    const initial = displayName.charAt(0).toUpperCase();
    
    return (
      <Card style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={styles.friendLeft}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.secondary }]}>
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
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="dots-vertical" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

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
      
      {friendsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.friendsContainer}>
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
      <Modal
        visible={showInviteOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInviteOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemeText variant="title">Invite Friends</ThemeText>
              <TouchableOpacity onPress={() => setShowInviteOptions(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <ThemeText style={styles.modalDescription}>
              Generate a link to invite friends to SplitEase
            </ThemeText>
            
            {inviteLink ? (
              <>
                <View style={[styles.linkContainer, { borderColor: theme.colors.border }]}>
                  <ThemeText numberOfLines={1} style={styles.linkText}>{inviteLink}</ThemeText>
                </View>
                
                <View style={styles.inviteActions}>
                  <CustomButton
                    title="Copy Link"
                    onPress={handleCopyLink}
                    variant="outline"
                    style={styles.inviteButton}
                    icon={<Icon name="content-copy" size={20} color={theme.colors.primary} />}
                  />
                  <CustomButton
                    title="Share Link"
                    onPress={handleShareLink}
                    style={styles.inviteButton}
                    icon={<Icon name="share-variant" size={20} color="#FFFFFF" />}
                  />
                </View>
              </>
            ) : (
              <CustomButton
                title="Generate Invite Link"
                onPress={handleGenerateInviteLink}
                style={styles.generateButton}
                loading={loading}
                icon={<Icon name="link-variant" size={20} color="#FFFFFF" />}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addFriendCard: {
    margin: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
  errorText: {
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  friendCard: {
    marginBottom: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  friendName: {
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  moreButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  addFriendButton: {
    marginTop: 10,
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
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalDescription: {
    marginBottom: 20,
  },
  linkContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 14,
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inviteButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  generateButton: {
    marginTop: 20,
  },
  requestActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  acceptButton: {
    borderColor: '#4CAF50',
  },
  rejectButton: {
    borderColor: '#F44336',
  },
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
  friendEmail: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});

export default FriendsScreen; 