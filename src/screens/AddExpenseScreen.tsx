import React from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useTheme } from '../themes/ThemeProvider';
import { Header } from '../components/Header';
import AddExpenseForm from '../components/AddExpenseForm';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

const AddExpenseScreen = ({ route, navigation }: Props) => {
  const { groupId } = route.params;
  const { theme } = useTheme();
  const { currentGroup, loading: groupLoading } = useSelector((state: RootState) => state.groups);

  if (groupLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header 
          title="Add Expense" 
          leftIcon="arrow-left"
          onLeftPress={() => navigation.goBack()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header 
        title="Add Expense" 
        leftIcon="arrow-left"
        onLeftPress={() => navigation.goBack()} 
      />
      <AddExpenseForm 
        groupId={groupId}
        participants={currentGroup?.members || []}
        onSuccess={() => {
          Alert.alert('Success', 'Expense added successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }}
        onCancel={() => navigation.goBack()}
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
  }
});

export default AddExpenseScreen; 