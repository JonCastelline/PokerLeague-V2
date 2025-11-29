import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useLeague } from '../context/LeagueContext';
import AppMenu from './AppMenu';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const PageWrapper = ({ children }) => {
  const { leagueHomeContent, loadingContent } = useLeague();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const backgroundColor = useThemeColor({}, 'background');
  const activityIndicatorColor = useThemeColor({ light: colors.tint, dark: colors.tint }, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.menuContainer}>
          <AppMenu />
        </View>
        {loadingContent ? (
          <ActivityIndicator style={styles.logoLoading} size="small" color={activityIndicatorColor} />
        ) : (
          leagueHomeContent && leagueHomeContent.logoImageUrl && (
            <Image
              source={{ uri: leagueHomeContent.logoImageUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          )
        )}
      </View>
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );
};

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: backgroundColor,
    },
    contentWrapper: {
      flex: 1,
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginBottom: 20,
      position: 'relative',
    },
    menuContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
    },
    logo: {
      width: 150,
      height: 150,
    },
    logoLoading: {
      height: 150, // Maintain space while loading
    },
  }), [backgroundColor, activityIndicatorColor]);

export default PageWrapper;
