import React from 'react';
import { SelectList } from 'react-native-dropdown-select-list';

const SafePicker = React.memo(({ selectedValue, onValueChange, children, style, dropdownListStyle, ...rest }) => {
  console.log('SafePicker rendered. Value:', selectedValue);

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
      inputStyles={{ color: 'black' }} // Default input text color
      dropdownTextStyles={{ color: 'black' }} // Default dropdown item text color
      dropdownStyles={dropdownListStyle || { maxHeight: 200 }} // Make dropdownStyles configurable, with a default maxHeight
      search={false} // Disable search by default
      {...rest}
    />
  );
});

export default SafePicker;
