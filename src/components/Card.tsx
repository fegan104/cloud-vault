import { ReactNode } from "react";

export const Card: React.FC<{ children: ReactNode, className?: string }> = ({ children, className }) => {
  return (
    <div className={`flex flex-col bg-surface rounded-md ${className}`}>
      {children}
    </div>
  )
}