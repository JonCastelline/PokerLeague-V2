import React from 'react';
import { Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const SafePicker = (props) => {
  return (
    <Picker
      {...props}
      // 'mode' is Android-only; iOS ignores it.
      // Avoid the Android dialog teardown path that’s crashing
      mode={Platform.OS === 'android' ? 'dropdown' : props.mode}
    />
  );
}

export default SafePicker;
