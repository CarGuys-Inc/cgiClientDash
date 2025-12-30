"use client";

import { useState, useEffect } from "react";

const MOCK_DATA = [
  { name: "All American Automotive", location: "Wichita, KS", action: "just purchased a 14-day job plan" },
  { name: "Chevrolet Dealership", location: "Lansing, Mi", action: "hired a sales consultant" },
  { name: "Kia Dealership", location: "Little Rock, AR", action: "Purchased a month to month job plan" },
  { name: "Volvo Toyota Dealership", location: "Baltimore, Maryland", action: "Just purchased a 6-month job plan" },
];

export default function RealTimeToast() {
  const [visible, setVisible] = useState(false);
  const [currentInfo, setCurrentInfo] = useState(MOCK_DATA[0]);

  useEffect(() => {
    // Initial delay before starting the loop
    const startTimeout = setTimeout(() => {
      triggerNotification();
      // Set interval to repeat (CHANGED TO 40000ms)
      const interval = setInterval(triggerNotification, 40000); 
      return () => clearInterval(interval);
    }, 3000);

    return () => clearTimeout(startTimeout);
  }, []);

  const triggerNotification = () => {
    const random = MOCK_DATA[Math.floor(Math.random() * MOCK_DATA.length)];
    setCurrentInfo(random);
    setVisible(true);
    
    // Hide after 5 seconds
    setTimeout(() => {
      setVisible(false);
    }, 5000);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl p-4 flex items-center gap-4 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex-shrink-0 bg-green-50 text-green-600 p-2 rounded-full border border-green-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
          {currentInfo.name} <span className="font-normal text-gray-500 text-xs">from {currentInfo.location}</span>
        </p>
        <p className="text-xs text-gray-600">{currentInfo.action}</p>
      </div>
    </div>
  );
}