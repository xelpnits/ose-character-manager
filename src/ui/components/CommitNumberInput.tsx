import React, { useEffect, useMemo, useRef, useState } from 'react';

type EmptyCommitBehavior = 'keep' | 'undefined' | number;

export type CommitNumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: number;
  onCommit: (value: number | undefined) => void;
  /** What to do if the user commits an empty value. */
  emptyCommit?: EmptyCommitBehavior;
  /** Optional post-parse normalization/clamping. */
  transform?: (value: number) => number;
};

const formatValue = (value: number | undefined) => (typeof value === 'number' && Number.isFinite(value) ? String(value) : '');

const CommitNumberInput: React.FC<CommitNumberInputProps> = ({
  value,
  onCommit,
  emptyCommit = 'keep',
  transform,
  onBlur,
  onKeyDown,
  ...rest
}) => {
  const [draft, setDraft] = useState(() => formatValue(value));
  const isFocusedRef = useRef(false);

  const committedText = useMemo(() => formatValue(value), [value]);

  useEffect(() => {
    // Keep the input in sync with external updates, but don't fight while typing.
    if (!isFocusedRef.current) setDraft(committedText);
  }, [committedText]);

  const commit = () => {
    const trimmed = draft.trim();

    if (trimmed === '') {
      if (emptyCommit === 'keep') {
        setDraft(committedText);
        return;
      }

      if (emptyCommit === 'undefined') {
        onCommit(undefined);
        return;
      }

      onCommit(emptyCommit);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(committedText);
      return;
    }

    const next = transform ? transform(parsed) : parsed;
    onCommit(next);
  };

  return (
    <input
      {...rest}
      type="number"
      value={draft}
      onFocus={(e) => {
        isFocusedRef.current = true;
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
      }}
      onBlur={(e) => {
        isFocusedRef.current = false;
        commit();
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
          return;
        }

        if (e.key === 'Escape') {
          setDraft(committedText);
          e.currentTarget.blur();
          return;
        }

        onKeyDown?.(e);
      }}
    />
  );
};

export default CommitNumberInput;
