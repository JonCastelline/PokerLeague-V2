import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HelpModal from './HelpModal';
import { HELP_TOPICS } from '../constants/HelpContent';

const HelpIcon = ({ topicKey }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const topic = HELP_TOPICS[topicKey];

  if (!topic) {
    // Optionally, render nothing or an error icon if the topic key is invalid
    return null;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconContainer}>
        <MaterialCommunityIcons name="help-circle-outline" size={24} color="#007bff" />
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
