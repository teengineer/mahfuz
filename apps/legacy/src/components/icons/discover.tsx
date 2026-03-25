/** Discover icon — compass style, 18px header + 24px dual-state tab bar */

/** Sidebar / header variant (18px, outlined) */
export function DiscoverIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

/** Tab bar variant (24px, filled when active) */
export function TabDiscoverIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 5.47a.75.75 0 01.449.962l-2.12 6.36a.75.75 0 01-.468.468l-6.36 2.12a.75.75 0 01-.962-.962l2.12-6.36a.75.75 0 01.468-.468l6.36-2.12a.75.75 0 01.513 0z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}
