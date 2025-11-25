import { Loader2 } from "lucide-react";

const CircularProgress = ({ size = 40, strokeWidth = 4, color = "text-blue-600", className = "" }) => {
  return (
    <div className="relative">
      <div className={`top-0 inset-0 z-10 flex justify-center ${color} ${className}`}>
        <Loader2 className="animate-spin" size={size} />
      </div>
    </div>
  );
};

export default CircularProgress;