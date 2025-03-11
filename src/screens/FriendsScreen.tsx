import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchFriends, addFriend } from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { CustomButton } from '../components/CustomButton';
import { Card } from '../components/Card';

export const FriendsScreen = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { friends, loading: friendsLoading } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user) {
      dispatch(fetchFriends(user.id));
    }
  }, [dispatch, user]);

  const handleAddFriend = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await dispatch(addFriend({
        userId: user.id,
        friendId: email, // In a real app, you'd search for the user by email first
        status: 'pending',
        createdAt: new Date(),
      })).unwrap();
      setEmail('');
      Alert.alert('Success', 'Friend request sent');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    return (
      <Card style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <ThemeText variant="title">{item.friendId}</ThemeText>
          <ThemeText variant="caption">
            {item.status === 'pending' ? 'Pending' : 'Friend'}
          </ThemeText>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.addFriendCard}>
        <ThemeText variant="title" style={styles.sectionTitle}>Add Friend</ThemeText>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          }]}
          placeholder="Friend's Email"
          placeholderTextColor={theme.colors.text}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <CustomButton
          title="Send Request"
          onPress={handleAddFriend}
          loading={loading}
          style={styles.button}
        />
      </Card>

      <ThemeText variant="title" style={styles.friendsTitle}>Your Friends</ThemeText>

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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ThemeText>You haven't added any friends yet</ThemeText>
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
    padding: 16,
  },
  addFriendCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  button: {
    alignSelf: 'flex-end',
  },
  friendsTitle: {
    marginBottom: 12,
  },
  listContent: {
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
  },
});

export default FriendsScreen; 