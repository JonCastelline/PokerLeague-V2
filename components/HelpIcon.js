import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HelpModal from './HelpModal';
import { HELP_TOPICS } from '../constants/HelpContent';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const HelpIcon = ({ topicKey }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const iconColor = useThemeColor({ light: '#007bff', dark: '#52a3ff' }, 'background');

  const topic = HELP_TOPICS[topicKey];

  if (!topic) {
    // Optionally, render nothing or an error icon if the topic key is invalid
    return null;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconContainer}>
        <MaterialCommunityIcons name="help-circle-outline" size={24} color={iconColor} />
      </TouchableOpacity>
      <HelpModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={topic.title}
        content={topic.content}
      />
    </>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginLeft: 8,
    // Add padding if needed to make it easier to tap
    padding: 5,
  },
});

export default HelpIcon;
