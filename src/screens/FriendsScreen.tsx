import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  Image
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchFriends, addFriend } from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const FriendsScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { friends, loading: friendsLoading } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user]);

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
      setEmail('');
      setShowAddFriend(false);
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    const isPending = item.status === 'pending';
    
    return (
      <Card style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={styles.friendLeft}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.secondary }]}>
              <ThemeText style={styles.avatarText}>
                {item.friendId.charAt(0).toUpperCase()}
              </ThemeText>
            </View>
            <View>
              <ThemeText variant="title" style={styles.friendName}>
                {item.friendId}
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
          {emailError ? <ThemeText style={styles.errorText}>{emailError}</ThemeText> : null}
          
          <CustomButton
            title="Send Request"
            onPress={handleAddFriend}
            loading={loading}
            style={styles.button}
            icon={<Icon name="send" size={20} color="#FFFFFF" />}
          />
        </Card>
      )}

      {friendsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={friends}
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
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 30,
  },
  button: {
    alignSelf: 'flex-end',
    marginTop: 10,
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
});

export default FriendsScreen; 