import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const HelpModal = ({ isVisible, onClose, title, content }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const modalOverlayBackgroundColor = useThemeColor({ light: 'rgba(0, 0, 0, 0.5)', dark: 'rgba(0, 0, 0, 0.7)' }, 'background');
  const modalViewBackgroundColor = useThemeColor({}, 'cardBackground');
  const shadowColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const headerBorderColor = useThemeColor({ light: '#eee', dark: '#444' }, 'background');
  const closeIconColor = useThemeColor({ light: '#333', dark: '#ccc' }, 'background');
  const textColor = useThemeColor({}, 'text');

  const styles = React.useMemo(() => StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: modalOverlayBackgroundColor, // Semi-transparent backdrop
    },
    modalView: {
      margin: 20,
      backgroundColor: modalViewBackgroundColor,
      borderRadius: 20,
      padding: 20,
      alignItems: 'stretch',
      shadowColor: shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '90%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: headerBorderColor,
      paddingBottom: 10,
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      flex: 1,
      color: textColor,
    },
    closeButton: {
      padding: 5,
    },
    contentScrollView: {
      flexShrink: 1, // Ensures the scroll view doesn't expand beyond the modal
    },
    modalText: {
      fontSize: 16,
      lineHeight: 24,
      color: textColor,
    },
  }), [modalOverlayBackgroundColor, modalViewBackgroundColor, shadowColor, headerBorderColor, closeIconColor, textColor]);
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={closeIconColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.contentScrollView}>
            <Text style={styles.modalText}>{content}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default HelpModal;
