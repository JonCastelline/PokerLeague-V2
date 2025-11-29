import React from 'react';
import { SelectList } from 'react-native-dropdown-select-list';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const SafePicker = React.memo(({ selectedValue, onValueChange, children, style, dropdownListStyle, ...rest }) => {

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const textColor = useThemeColor({}, 'text');

  const data = React.Children.map(children, child => {
    if (child && child.props) {
      return { key: String(child.props.value), value: child.props.label };
    }
    return null;
  }).filter(Boolean); // Filter out any nulls

  // Find the default option based on selectedValue
  const defaultOption = data.find(item => item.key === String(selectedValue));

  return (
    <SelectList
      setSelected={(val) => onValueChange(val)}
      data={data}
      defaultOption={defaultOption}
      boxStyles={style} // Pass the style prop to boxStyles
      inputStyles={{ color: textColor }} // Default input text color
      dropdownTextStyles={{ color: textColor }} // Default dropdown item text color
      dropdownStyles={dropdownListStyle || { maxHeight: 200 }} // Make dropdownStyles configurable, with a default maxHeight
      search={false} // Disable search by default
      {...rest}
    />
  );
});

export default SafePicker;
