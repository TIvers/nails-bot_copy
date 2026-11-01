import React from "react";
import { CheckCircle } from "lucide-react";
export function NotificationPopup({ message, isVisible, isError }) {
  return isVisible ? (
    <div className="popup">
      <div className={`flex items-center gap-2 rounded-lg  px-4 py-3 text-white shadow-lg ${isError ? 'bg-[#FF0000]' : 'bg-[#9C27B0]'}`}>
        <CheckCircle className="h-5 w-5" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  ) : null;
}
