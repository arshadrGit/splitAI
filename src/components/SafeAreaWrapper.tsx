import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

interface SafeAreaWrapperProps {
  children: ReactNode;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children }) => {
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;