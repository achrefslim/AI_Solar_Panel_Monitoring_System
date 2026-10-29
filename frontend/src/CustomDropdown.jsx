import { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({ value, onChange, options, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`custom-dropdown ${className}`} ref={dropdownRef}>
      <button 
        className="dropdown-toggle btn secondary"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption?.label || 'Select...'}
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="dropdown-menu">
          {options.map(option => (
            <div
              key={option.value}
              className={`dropdown-item ${value === option.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}