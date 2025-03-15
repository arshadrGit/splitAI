import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  Signup: undefined;
  Register: undefined;
  
  // Main Stack
  MainTabs: undefined;
  GroupMembers: { groupId: string };
  GroupDetail: { groupId: string; groupName: string };
  AddExpense: { groupId?: string; friendId?: string };
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
  Home: undefined;
  AddGroup: undefined;
  AddFriend: undefined;
  Settings: undefined;
  FriendDetail: {
    friendId: string;
    friendName: string;
  };
}; 