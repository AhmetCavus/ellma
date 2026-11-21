/**
 * Ellma's mark: a flat red apple, the "kızıl elma" (the goal on the horizon), with a spark
 * where the core would be. Cut an apple across and its core is a star; Ellma's star is the
 * spark people know from AI assistants. No bite and a stem with the leaf on the left keep it
 * clearly apart from any computer company.
 */
export function AppleMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`apple-mark ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <path
        d="M32 19.5C27.2 14.6 15.6 13.8 10.6 23.6 6.2 32.4 9.6 46.6 16.8 53.4c4.6 4.3 10.2 4.4 15.2 1.8 5 2.6 10.6 2.5 15.2-1.8 7.2-6.8 10.6-21 6.2-29.8C48.4 13.8 36.8 14.6 32 19.5z"
        fill="var(--apple)"
      />
      <path
        className="apple-spark"
        d="M32 25.5c.9 7 4 10.1 11 11-7 .9-10.1 4-11 11-.9-7-4-10.1-11-11 7-.9 10.1-4 11-11z"
        fill="var(--spark)"
      />
      <path
        className="apple-glint"
        d="M43.5 22.5c.35 2.7 1.55 3.9 4.25 4.25-2.7.35-3.9 1.55-4.25 4.25-.35-2.7-1.55-3.9-4.25-4.25 2.7-.35 3.9-1.55 4.25-4.25z"
        fill="var(--spark)"
      />
      <path
        d="M32 20c-.3-4.3.5-8 2.6-11.2"
        fill="none"
        stroke="var(--stem)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        className="apple-leaf"
        d="M30.4 13.8c-2.4-5.3-7.9-7.2-13.2-6 1.3 5.5 7 8.7 13.2 6z"
        fill="var(--leaf)"
      />
    </svg>
  );
}
