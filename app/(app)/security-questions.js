import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAuth } from '../../context/AuthContext';
import * as apiActions from '../../src/api';
import { Picker } from '@react-native-picker/picker';

const SecurityQuestionsScreen = () => {
  const { api } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([
    { questionId: null, answer: '' },
    { questionId: null, answer: '' },
    { questionId: null, answer: '' },
  ]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await api(apiActions.getAllSecurityQuestions);
        setQuestions(data);
      } catch (error) {
        console.error('Error fetching security questions:', error);
        Alert.alert('Error', 'Failed to fetch security questions.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [api]);

  const handleQuestionChange = (itemValue, index) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions[index].questionId = itemValue;
    setSelectedQuestions(newSelectedQuestions);
  };

  const handleAnswerChange = (text, index) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions[index].answer = text;
    setSelectedQuestions(newSelectedQuestions);
  };

  const handleSave = async () => {
    const filledQuestions = selectedQuestions.filter(q => q.questionId && q.answer);
    if (filledQuestions.length === 0) {
      Alert.alert('Error', 'Please select at least one question and provide an answer.');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(filledQuestions.map(q => api(apiActions.setSecurityAnswer, q)));
      Alert.alert('Success', 'Security questions saved successfully!');
    } catch (error) {
      console.error('Error saving security questions:', error);
      Alert.alert('Error', 'Failed to save security questions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <KeyboardAwareScrollView style={styles.container}>
      <Text style={styles.title}>Set Security Questions</Text>
      {selectedQuestions.map((_, index) => (
        <View key={index} style={styles.questionContainer}>
          <Picker
            selectedValue={selectedQuestions[index].questionId}
            onValueChange={(itemValue) => handleQuestionChange(itemValue, index)}
            itemStyle={{ color: 'black' }}
            style={styles.picker}
            dropdownIconColor="black"
          >
            <Picker.Item label="Select a question..." value={null} style={{ color: 'black' }} />
            {questions.map(q => (
              <Picker.Item key={q.id} label={q.questionText} value={q.id} style={{ color: 'black' }} />
            ))}
          </Picker>
          <TextInput
            style={styles.input}
            placeholder="Your Answer"
            onChangeText={(text) => handleAnswerChange(text, index)}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    questionContainer: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 5,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#fb5b5a',
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    picker: {
        width: '100%',
        color: 'black',
        backgroundColor: 'white',
        selectionColor: 'white',
        marginBottom: 10,
    },
});

export default SecurityQuestionsScreen;
