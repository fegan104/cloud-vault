import { Loader2 } from "lucide-react";

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  progress?: number;
}

const CircularProgress = ({
  size = 40,
  strokeWidth = 2,
  color = "text-blue-600",
  className = "",
  progress
}: CircularProgressProps) => {
  if (progress === undefined) {
    return (
      <div className={`relative flex justify-center items-center ${className}`}>
        <div className={`flex justify-center ${color}`}>
          <Loader2 className="animate-spin" size={size} />
        </div>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex justify-center items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-on-surface-variant opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-300 ease-in-out`}
        />
      </svg>
    </div>
  );
};

export default CircularProgress;