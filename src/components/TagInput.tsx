import { useState, type KeyboardEvent } from 'react';

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

function splitTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const addTags = (rawValue: string) => {
    const nextTags = Array.from(new Set([...value, ...splitTags(rawValue)]));

    if (nextTags.length !== value.length) {
      onChange(nextTags);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTags(draft);
    }

    if (event.key === 'Backspace' && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="tag-input">
      <div className="tag-input-list">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            className="tag-chip editable"
            onClick={() => removeTag(tag)}
            title="移除标签"
          >
            <span>{tag}</span>
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          value={draft}
          placeholder={value.length > 0 ? '继续添加标签' : '输入标签后回车'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) addTags(draft);
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text');
            if (/[,，\n]/.test(pasted)) {
              event.preventDefault();
              addTags(pasted);
            }
          }}
        />
      </div>
      <p className="tag-input-hint">支持中文逗号、英文逗号、回车分隔；点击标签可移除。</p>
    </div>
  );
}
