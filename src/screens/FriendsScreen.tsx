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
  Share,
  Modal
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchFriends, addFriend, generateInviteLink } from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Clipboard from '@react-native-clipboard/clipboard';

export const FriendsScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showInviteOptions, setShowInviteOptions] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { friends,incomingRequests, loading: friendsLoading } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user]);

  console.log('friends', friends);

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

  const handleAddFriend = async () => {
    if (!validateEmail(email)) {
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await dispatch(addFriend({
        userId: user.id,
        friendId: email,
        status: 'pending',
        createdAt: new Date(),
      })).unwrap();
      
      // Refresh the friends list
      dispatch(fetchFriends(user.id));
      
      setEmail('');
      setShowAddFriend(false);
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
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

  const renderFriendItem = ({ item }: { item: any }) => {
    // Determine if this is a sent or received friendship
    const isSent = item.userId === user?.id;
    
    // For sent requests, use the email or friendId
    // For received requests, use the userId
    const displayName = isSent 
      ? item.email || item.displayName || item.friendId 
      : item.displayName || item.userId;
      
    const initial = displayName.charAt(0).toUpperCase();
    const isPending = item.status === 'pending';
    
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
              {isPending && (
                <View style={styles.statusContainer}>
                  <Icon name="clock-outline" size={12} color={theme.colors.notification} />
                  <ThemeText variant="caption" style={{ color: theme.colors.notification, marginLeft: 4 }}>
                    Pending
                  </ThemeText>
                </View>
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
            <Icon name="email-outline" size={20} color={theme.colors.text} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                color: theme.colors.text,
                borderColor: emailError ? theme.colors.error : theme.colors.border,
              }]}
              placeholder="Friend's Email"
              placeholderTextColor={theme.colors.placeholder}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              onBlur={() => validateEmail(email)}
            />
          </View>
          {emailError ? <ThemeText style={[styles.errorText, { color: theme.colors.error }]}>{emailError}</ThemeText> : null}
          
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Send Invite"
              onPress={() => setShowInviteOptions(true)}
              variant="outline"
              style={styles.button}
              icon={<Icon name="share-variant" size={20} color={theme.colors.primary} />}
            />
            <CustomButton
              title="Add Friend"
              onPress={handleAddFriend}
              style={styles.button}
              loading={loading}
              icon={<Icon name="account-plus" size={20} color="#FFFFFF" />}
            />
          </View>
        </Card>
      )}
      
      {friendsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[...friends, ...incomingRequests]}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
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
          }
        />
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
});

export default FriendsScreen; 