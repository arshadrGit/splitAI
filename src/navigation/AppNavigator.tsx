import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useTheme } from '../themes/ThemeProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Modal, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import RecentActivityScreen from '../screens/RecentActivityScreen';
import FriendsScreen from '../screens/FriendsScreen';
import GroupsScreen from '../screens/GroupsScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import GroupMembersScreen from '../screens/GroupMembersScreen';
import SettleUpScreen from '../screens/SettleUpScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import AboutScreen from '../screens/AboutScreen';
import ExpensesScreen from '../screens/ExpensesScreen';

// Define navigation types
type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Signup: undefined;
  
  // Main Stack
  MainTabs: undefined;
  GroupMembers: { groupId: string };
  GroupDetail: { groupId: string; groupName: string };
  AddExpense: { groupId: string };
  SettleUp: { groupId: string };
  
  // Tab Stacks
  HomeMain: undefined;
  GroupsMain: undefined;
  FriendsMain: undefined;
  ActivityMain: undefined;
  SettingsMain: undefined;
  ExpensesMain: undefined;
  EditProfile: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const GroupsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GroupsMain" component={GroupsScreen} />
    <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
    <Stack.Screen name="SettleUp" component={SettleUpScreen} />
  </Stack.Navigator>
);

const FriendsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FriendsMain" component={FriendsScreen} />
  </Stack.Navigator>
);

const ActivityStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ActivityMain" component={RecentActivityScreen} />
  </Stack.Navigator>
);

const ExpensesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ExpensesMain" component={ExpensesScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
  </Stack.Navigator>
);

// Empty component for the Add Expense tab
const EmptyComponent = () => <View />;

const MainTabs = () => {
  const { theme } = useTheme();
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            switch (route.name) {
              case 'Activity':
                iconName = focused ? 'history' : 'history';
                break;
              case 'Friends':
                iconName = focused ? 'account-multiple' : 'account-multiple-outline';
                break;
              case 'Groups':
                iconName = focused ? 'account-group' : 'account-group-outline';
                break;
              case 'AddExpense':
                iconName = 'plus-circle';
                break;
              case 'Settings':
                iconName = focused ? 'cog' : 'cog-outline';
                break;
              default:
                iconName = 'circle';
            }

            return <Icon name={iconName as string} size={size} color={color} />;
          },
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text,
        })}
      >
        <Tab.Screen name="Activity" component={ActivityStack} />
        <Tab.Screen name="Friends" component={FriendsStack} />
        <Tab.Screen 
          name="AddExpense" 
          component={EmptyComponent}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              // Show the expense modal
              setShowExpenseModal(true);
            },
          }}
          options={{
            tabBarLabel: 'Add Expense',
          }}
        />
        <Tab.Screen name="Groups" component={GroupsStack} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>

      {/* Add Expense Modal */}
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableWithoutFeedback onPress={() => setShowExpenseModal(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <AddExpenseScreen 
              route={{ params: { groupId: '' } } as any} 
              navigation={{ 
                goBack: () => setShowExpenseModal(false),
                getParent: () => null
              } as any} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '10%',
  }
});

export const AppNavigator = () => {
  const { theme } = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupMembers"
              component={GroupMembersScreen}
              options={{ 
                title: 'Group Members',
                headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen
              name="GroupDetail"
              component={GroupDetailScreen}
              options={{ 
                title: 'Group Details',
                headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen
              name="AddExpense"
              component={AddExpenseScreen}
              options={{ 
                headerShown:false,
                // title: 'Add Expense',
                // headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen
              name="SettleUp"
              component={SettleUpScreen}
              options={{ 
                title: 'Settle Up',
                headerBackTitle: 'Back'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 