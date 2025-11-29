import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export const TextButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center
        text-primary font-medium text-sm px-4 py-2
        rounded-full transition-colors duration-200
        hover:bg-primary/10 focus:outline-none focus-visible:ring-2
        focus-visible:ring-primary/40 disabled:opacity-40
        whitespace-nowrap 
        disabled:cursor-not-allowed ${className}
      `}
    >
      {children}
    </button>
  );
};

export const TonalButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center
        text-on-secondary-container font-medium text-sm px-4 py-2
        bg-secondary-container rounded-full transition-colors duration-200
        hover:bg-secondary-container/70 focus:outline-none
        focus-visible:ring-2 focus-visible:ring-on-secondary-container/50
        whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
};

interface FloatingActionButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string; // optional for extended FAB
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
}) => {
  const isExtended = Boolean(label);

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-50 
        flex items-center justify-center gap-3
        transition-shadow hover:shadow-lg
        rounded-full px-5 py-3
        bg-primary text-white shadow-md
        ${isExtended ? "rounded-full" : "w-14 h-14 p-0"}
      `}
    >
      {icon}
      {isExtended && <span className="text-base font-medium">{label}</span>}
    </button>
  );
};

export default FloatingActionButton;