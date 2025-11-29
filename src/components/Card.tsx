import { ReactNode } from "react";

export const Card: React.FC<{ children: ReactNode, className?: string }> = ({ children, className }) => {
  return (
    <div className={`flex flex-col bg-white rounded-md p-4 max-w-1/4 ${className}`}>
      {children}
    </div>
  )
}