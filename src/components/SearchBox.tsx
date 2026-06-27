import { forwardRef } from 'react';

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  {
    value,
    onChange,
    placeholder = '搜索标题、摘要、正文、标签',
  },
  ref,
) {
  return (
    <label className="search-box">
      <span className="sr-only">搜索</span>
      <input
        ref={ref}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
});
