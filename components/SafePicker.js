import React from 'react';
import { SelectList } from 'react-native-dropdown-select-list';

const SafePicker = React.memo(({ selectedValue, onValueChange, children, style, dropdownListStyle, ...rest }) => {

  const data = React.Children.map(children, child => {
    if (child && child.props) {
      return { key: String(child.props.value), value: child.props.label };
    }
    return null;
  }).filter(Boolean); // Filter out any nulls

  // Find the default option based on selectedValue
  const defaultOption = data.find(item => item.key === String(selectedValue));

  // Dynamically calculate dropdown height
  const itemsCount = data.length;
  const itemHeight = 45; // Estimated height of a single item in pixels
  const dynamicDropdownStyle = {};

  if (itemsCount > 0) {
    if (itemsCount <= 5) {
      // For 5 or fewer items, set the height explicitly to fit content
      dynamicDropdownStyle.height = itemsCount * itemHeight;
    } else {
      // For more than 5 items, use maxHeight to make it scrollable
      dynamicDropdownStyle.maxHeight = 200;
    }
  }

  return (
    <SelectList
      setSelected={(val) => onValueChange(val)}
      data={data}
      defaultOption={defaultOption}
      boxStyles={style} // Pass the style prop to boxStyles
      inputStyles={{ color: 'black' }} // Default input text color
      dropdownTextStyles={{ color: 'black' }} // Default dropdown item text color
      dropdownStyles={{ ...dynamicDropdownStyle, ...dropdownListStyle }} // Merge with passed styles
      search={false} // Disable search by default
      {...rest}
    />
  );
});

export default SafePicker;
