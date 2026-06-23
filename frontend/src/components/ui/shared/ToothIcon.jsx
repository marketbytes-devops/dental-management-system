import React from "react";

export default function ToothIcon({ className = "w-5 h-5", strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M40 11a13.6 13.6 0 0 0 7 0M30.9 6.026C39.094.656 49.817-.1 56.636 8.612S61.018 28.327 60 34s-5.7 28-13.134 28C43 62 41 59.731 41 54c0-6-2.079-15-9-15-9 0-10 11-10 15 0 3.546-.494 8-4.464 8S9.31 57.036 7.071 47.919 3 29.886 3 24.213C3 13.981 5.431 5.282 17.147 2.534 26.75.281 29.079 6.062 36 9" />
    </svg>
  );
}
