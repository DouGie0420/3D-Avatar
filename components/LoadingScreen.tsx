import React, { useEffect, useState } from 'react';

const LoadingScreen: React.FC = () => {
  const [message, setMessage] = useState("Initializing Veo model...");

  useEffect(() => {
    const messages = [
      "Analyzing reference images...",
      "Mapping 2D textures to 3D volume...",
      "Synthesizing geometry...",
      "Rendering 360° turntable...",
      "Polishing final frames...",
      "Almost there, AI is thinking hard..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      setMessage(messages[i % messages.length]);
      i++;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-96">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">✨</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Generating 3D Visualization</h3>
      <p className="text-gray-400 text-sm max-w-md animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingScreen;