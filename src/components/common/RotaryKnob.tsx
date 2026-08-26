import React, { useState, useRef, useEffect } from 'react';

interface RotaryKnobProps {
  id?: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  onChange: (val: number) => void;
  onMidiLearn?: () => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = '',
  defaultValue,
  size = 'md',
  color = '#7C5DFF',
  onChange,
  onMidiLearn,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartVal = useRef(0);

  const radius = size === 'sm' ? 18 : size === 'lg' ? 28 : 22;
  const strokeWidth = size === 'sm' ? 3 : 4;
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // 270 degree rotation arc (-135 to +135 deg)
  const startAngle = -135;
  const endAngle = 135;
  const angle = startAngle + normalized * (endAngle - startAngle);

  // SVG arc calculation
  const circumference = 2 * Math.PI * radius;
  const arcLength = (270 / 360) * circumference;
  const strokeDashoffset = arcLength * (1 - normalized);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartVal.current = value;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // e.preventDefault(); // Don't prevent default here to allow page scroll when needed? Actually we might want it.
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartVal.current = value;
  };

  const handleDoubleClick = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    } else {
      onChange((min + max) / 2);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      let clientY;
      let shiftKey = false;
      if (window.TouchEvent && e instanceof TouchEvent) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = (e as MouseEvent).clientY;
        shiftKey = (e as MouseEvent).shiftKey;
      }

      const deltaY = dragStartY.current - clientY;
      const sensitivity = e.shiftKey ? 400 : 150; // Shift for precision fine-tuning
      const deltaVal = ((max - min) * deltaY) / sensitivity;
      let newVal = dragStartVal.current + deltaVal;

      if (step) {
        newVal = Math.round(newVal / step) * step;
      }
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchcancel', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchcancel', handleMouseUp);
    };
  }, [isDragging, max, min, step, onChange]);

  const displayVal =
    max - min > 100
      ? Math.round(value)
      : max - min > 10
      ? value.toFixed(1)
      : value.toFixed(2);

  const dimension = radius * 2 + strokeWidth * 2 + 10;

  return (
    <div
      id={id}
      className="flex flex-col items-center select-none group cursor-ns-resize touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        if (onMidiLearn) {
          e.preventDefault();
          onMidiLearn();
        }
      }}
    >
      <div className="relative flex items-center justify-center" style={{ width: dimension, height: dimension }}>
        <svg width={dimension} height={dimension} className="transform -rotate-90">
          {/* Background Track Arc */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="#28282A"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            style={{
              transform: `rotate(${startAngle + 90}deg)`,
              transformOrigin: `${dimension / 2}px ${dimension / 2}px`,
            }}
          />
          {/* Active Value Arc */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: `rotate(${startAngle + 90}deg)`,
              transformOrigin: `${dimension / 2}px ${dimension / 2}px`,
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.1s ease',
            }}
          />
        </svg>

        {/* Knob Inner Face & Indicator Pointer */}
        <div
          className={`absolute rounded-full bg-[#121214] border border-[#28282A] shadow-inner flex items-center justify-center ${
            isDragging ? 'border-[#7C5DFF] ring-2 ring-[#7C5DFF]/30' : 'group-hover:border-[#3A3A3C]'
          }`}
          style={{
            width: radius * 2 - strokeWidth * 2,
            height: radius * 2 - strokeWidth * 2,
            transform: `rotate(${angle}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease',
          }}
        >
          {/* Pointer Notch */}
          <div
            className="w-1 rounded-full absolute top-1"
            style={{
              height: size === 'sm' ? 4 : 6,
              backgroundColor: isDragging ? '#9B82FF' : '#E0E0E0',
            }}
          />
        </div>
      </div>

      {/* Label and Value */}
      <span className="text-[11px] font-medium text-[#9E9E9E] mt-1 truncate max-w-[80px] text-center">
        {label}
      </span>
      <span className="text-[10px] font-mono text-[#E0E0E0]">
        {displayVal}
        {unit}
      </span>
    </div>
  );
};
