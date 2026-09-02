import { Search } from 'lucide-react';
import './Common.css';

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  className = '',
  ...rest
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(value);
    }
  };

  return (
    <div className={`search-bar ${className}`}>
      <Search className="search-bar-icon" />
      <input
        type="text"
        className="search-bar-input"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
};

export default SearchBar;
