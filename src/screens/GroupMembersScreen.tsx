import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchGroupById } from '../redux/groupsSlice';
import { fetchFriends } from '../redux/friendsSlice';
import { useTheme } from '../themes/ThemeProvider';
import { ThemeText } from '../components/ThemeText';
import { Card } from '../components/Card';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupMembersScreen = ({ route }) => {
  const { groupId } = route.params;
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);
  const { friends } = useSelector((state: RootState) => state.friends);
  const user = useSelector((state: RootState) => state.auth.user);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchGroupById(groupId));
      if (user) {
        dispatch(fetchFriends(user.id));
      }
    }
  }, [dispatch, groupId, user]);

  useEffect(() => {
    if (currentGroup && friends.length > 0) {
      // Map member IDs to friend objects
      const memberDetails = currentGroup.members.map(memberId => {
        if (memberId === user?.id) {
          return {
            id: user.id,
            displayName: user.displayName || 'You',
            email: user.email,
            isCurrentUser: true
          };
        }
        
        const friend = friends.find(f => 
          f.userId === memberId || f.friendId === memberId
        );
        
        return friend ? {
          id: memberId,
          displayName: friend.displayName || friend.email || 'Unknown',
          email: friend.email,
          isCurrentUser: false
        } : {
          id: memberId,
          displayName: 'Unknown Member',
          email: '',
          isCurrentUser: false
        };
      });
      
      setMembers(memberDetails);
    }
  }, [currentGroup, friends, user]);

  const renderMemberItem = ({ item }) => {
    const initial = item.displayName.charAt(0).toUpperCase();
    
    return (
      <Card style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.memberLeft}>
            <View style={[styles.avatarContainer, { 
              backgroundColor: item.isCurrentUser ? theme.colors.primary : theme.colors.secondary 
            }]}>
              <ThemeText style={styles.avatarText}>
                {initial}
              </ThemeText>
            </View>
            <View>
              <ThemeText variant="title" style={styles.memberName}>
                {item.displayName} {item.isCurrentUser ? '(You)' : ''}
              </ThemeText>
              {item.email && (
                <ThemeText variant="caption" style={styles.memberEmail}>
                  {item.email}
                </ThemeText>
              )}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (groupLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={members}
        renderItem={renderMemberItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    padding: 16,
  },
  memberCard: {
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberLeft: {
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
  memberName: {
    fontWeight: '600',
  },
  memberEmail: {
    opacity: 0.7,
  },
});

export default GroupMembersScreen; 