import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as apiActions from '../../src/api';
import { Picker } from '@react-native-picker/picker';

const SecurityQuestionsScreen = () => {
  const { api } = useAuth();
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState([
    { questionId: null, answer: '' },
    { questionId: null, answer: '' },
    { questionId: null, answer: '' },
  ]);
  const [areAnswersVisible, setAreAnswersVisible] = useState([false, false, false]);
  const PLACEHOLDER_ANSWER = '********';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allQuestionsData, myQuestionsData] = await Promise.all([
        api(apiActions.getAllSecurityQuestions),
        api(apiActions.getMySecurityQuestions),
      ]);

      setAllQuestions(allQuestionsData);

      const populatedQuestions = [];
      for (let i = 0; i < 3; i++) {
        if (myQuestionsData && myQuestionsData[i]) {
          populatedQuestions.push({
            questionId: myQuestionsData[i].id,
            answer: PLACEHOLDER_ANSWER // Use placeholder for saved answers
          });
        } else {
          populatedQuestions.push({ questionId: null, answer: '' });
        }
      }
      setSelectedQuestions(populatedQuestions);

    } catch (error) {
      console.error('Error loading security questions data:', error);
      Alert.alert('Error', 'Failed to load security questions data.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleAnswerVisibility = (index) => {
    const newAreAnswersVisible = [...areAnswersVisible];
    newAreAnswersVisible[index] = !newAreAnswersVisible[index];
    setAreAnswersVisible(newAreAnswersVisible);
  };

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

  const handleAnswerFocus = (index) => {
    const newSelectedQuestions = [...selectedQuestions];
    if (newSelectedQuestions[index].answer === PLACEHOLDER_ANSWER) {
      newSelectedQuestions[index].answer = '';
      setSelectedQuestions(newSelectedQuestions);
    }
  };

  const handleSave = async () => {
    const filledQuestions = selectedQuestions.filter(
      q => q.questionId && q.answer && q.answer !== PLACEHOLDER_ANSWER
    );
    if (filledQuestions.length === 0) {
      Alert.alert('No Changes to Save', 'Please provide a new answer for any question you wish to update.');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(filledQuestions.map(q => api(apiActions.setSecurityAnswer, q)));
      Alert.alert('Success', 'Security questions saved successfully!');
      loadData(); // Reload data to show the saved state
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
            style={styles.picker}
            dropdownIconColor="black"
          >
            <Picker.Item label="Select a question..." value={null}/>
            {allQuestions.map(q => (
              <Picker.Item key={q.id} label={q.questionText} value={q.id}/>
            ))}
          </Picker>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Your Answer"
              value={selectedQuestions[index].answer}
              onFocus={() => handleAnswerFocus(index)}
              onChangeText={(text) => handleAnswerChange(text, index)}
              secureTextEntry={!areAnswersVisible[index]}
            />
            <TouchableOpacity onPress={() => toggleAnswerVisibility(index)} style={styles.icon}>
              <MaterialCommunityIcons name={areAnswersVisible[index] ? 'eye-off' : 'eye'} size={24} color="grey" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>  Save  </Text>
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        padding: 10,
        fontSize: 16,
        color: 'black',
    },
    icon: {
        padding: 10,
    },
    button: {
        backgroundColor: '#fb5b5a',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    picker: {
        width: '100%',
        backgroundColor: 'white',
        marginBottom: 10,
        color: 'black',
    },
});

export default SecurityQuestionsScreen;
