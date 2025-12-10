/**
 * 📏 CHARACTER RANGE SLIDER - DomainSeek.ai
 *
 * Dual-handle range slider for selecting character length range.
 * Example: 4-7 characters
 */

'use client';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface CharacterRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function CharacterRangeSlider({
  min,
  max,
  value,
  onChange,
}: CharacterRangeSliderProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-3">
        Character Length: <span className="text-brand-blue font-bold">{value[0]}-{value[1]} chars</span>
      </label>

      <div className="px-2">
        <Slider
          range
          min={min}
          max={max}
          value={value}
          onChange={(val) => onChange(val as [number, number])}
          trackStyle={[{ backgroundColor: '#3B82F6', height: 8 }]}
          handleStyle={[
            {
              backgroundColor: '#3B82F6',
              borderColor: '#3B82F6',
              width: 20,
              height: 20,
              opacity: 1,
            },
            {
              backgroundColor: '#8B5CF6',
              borderColor: '#8B5CF6',
              width: 20,
              height: 20,
              opacity: 1,
            },
          ]}
          railStyle={{ backgroundColor: '#E5E7EB', height: 8 }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      <div className="text-xs text-gray-600 mt-2 text-center">
        Searching {value[0]}-{value[1]} character domains
      </div>
    </div>
  );
}
