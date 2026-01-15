import React, { useState, useCallback, useEffect } from 'react';
import { UploadedImage, AvatarViewType, AppStatus } from './types';
import ImageDropzone from './components/ImageDropzone';
import LoadingScreen from './components/LoadingScreen';
import { generateAvatarVideo, checkApiKey, promptForApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [images, setImages] = useState<Partial<Record<AvatarViewType, UploadedImage>>>({});
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKeySet, setApiKeySet] = useState<boolean>(false);

  // Initial check for API Key
  useEffect(() => {
    checkApiKey().then(setApiKeySet);
  }, []);

  const handleApiKeyConnect = async () => {
    try {
      await promptForApiKey();
      // Wait a moment for the selection to propagate, although promptForApiKey awaits the UI opening
      // We rely on the user successfully completing the flow.
      setApiKeySet(true); 
    } catch (e) {
      console.error("Failed to select key", e);
    }
  };

  const handleUpload = useCallback((file: File, viewType: AvatarViewType) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newImage: UploadedImage = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        type: viewType
      };
      setImages(prev => ({ ...prev, [viewType]: newImage }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemove = useCallback((viewType: AvatarViewType) => {
    setImages(prev => {
      const newState = { ...prev };
      delete newState[viewType];
      return newState;
    });
  }, []);

  const handleGenerate = async () => {
    if (!apiKeySet) {
      await handleApiKeyConnect();
      return;
    }

    const availableImages = Object.values(images) as UploadedImage[];
    if (availableImages.length === 0) {
      setErrorMsg("Please upload at least one image.");
      return;
    }

    setStatus(AppStatus.GENERATING);
    setErrorMsg(null);
    setVideoUrl(null);

    try {
      const resultUri = await generateAvatarVideo(availableImages);
      // Append API key to URI for fetching securely
      const fullUrl = `${resultUri}&key=${process.env.API_KEY}`;
      setVideoUrl(fullUrl);
      setStatus(AppStatus.COMPLETE);
    } catch (err: any) {
        console.error(err);
        if (err.message && err.message.includes("404")) {
             // Handle "Requested entity was not found" - key might be invalid or not selected properly
             setApiKeySet(false);
             setErrorMsg("Authentication failed. Please select your API Key again.");
        } else {
            setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
        setStatus(AppStatus.ERROR);
    }
  };

  const canGenerate = Object.keys(images).length >= 1;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 selection:bg-primary-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary-600 to-purple-500 flex items-center justify-center font-bold text-white">N</div>
            <h1 className="text-xl font-bold tracking-tight">NeoAvatar <span className="text-primary-500">Visualizer</span></h1>
          </div>
          <div>
            {!apiKeySet ? (
                <button 
                    onClick={handleApiKeyConnect}
                    className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded transition-colors"
                >
                    Connect Google API Key
                </button>
            ) : (
                <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    API Connected
                </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Intro */}
        <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                2D to 3D Visualization
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Upload your character reference sheets (NFTs, sketches). We use <span className="text-primary-400 font-semibold">Gemini Veo</span> to dream up a realistic 3D turntable visualization of your avatar.
            </p>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Inputs */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">
                    <div className="flex justify-between items-end mb-6">
                        <h3 className="text-lg font-semibold text-white">Reference Images</h3>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Required: Full Body or Front</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <ImageDropzone 
                            viewType="full" 
                            label="Full Body View" 
                            image={images['full']} 
                            onUpload={handleUpload} 
                            onRemove={handleRemove} 
                        />
                        <ImageDropzone 
                            viewType="front" 
                            label="Front View" 
                            image={images['front']} 
                            onUpload={handleUpload} 
                            onRemove={handleRemove} 
                        />
                        <ImageDropzone 
                            viewType="back" 
                            label="Back View" 
                            image={images['back']} 
                            onUpload={handleUpload} 
                            onRemove={handleRemove} 
                        />
                         <ImageDropzone 
                            viewType="closeup" 
                            label="Close-up View" 
                            image={images['closeup']} 
                            onUpload={handleUpload} 
                            onRemove={handleRemove} 
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                     {!apiKeySet && (
                        <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-sm text-yellow-200">
                            <strong>Note:</strong> You must select a paid Google Cloud Project API key to use the Veo video generation model. 
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline ml-1">Read billing docs</a>.
                        </div>
                    )}
                    <button 
                        onClick={handleGenerate}
                        disabled={!canGenerate || status === AppStatus.GENERATING}
                        className={`
                            w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all
                            ${!canGenerate 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : status === AppStatus.GENERATING
                                    ? 'bg-gray-700 text-gray-300 cursor-wait'
                                    : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white hover:shadow-primary-500/25 shadow-primary-900/20'
                            }
                        `}
                    >
                        {status === AppStatus.GENERATING ? 'Processing...' : 'Generate 3D Turntable'}
                    </button>
                    {errorMsg && (
                        <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm text-center">
                            {errorMsg}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Output */}
            <div className="lg:col-span-5">
                <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl h-full min-h-[400px] flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-10">
                        <h3 className="text-lg font-semibold text-white">Visualization Output</h3>
                        <div className="flex space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                            <div className="w-3 h-3 rounded-full bg-gray-700"></div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative bg-black">
                        {status === AppStatus.IDLE && (
                            <div className="text-center p-8 opacity-40">
                                <div className="text-6xl mb-4">🧊</div>
                                <p className="text-sm font-medium text-gray-400">Ready to render</p>
                            </div>
                        )}

                        {status === AppStatus.GENERATING && <LoadingScreen />}

                        {status === AppStatus.COMPLETE && videoUrl && (
                             <video 
                                src={videoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="w-full h-full object-contain"
                                style={{ maxHeight: '600px' }}
                            />
                        )}

                         {status === AppStatus.ERROR && (
                             <div className="text-center p-8">
                                <div className="text-5xl mb-4">⚠️</div>
                                <p className="text-gray-400">Generation Failed</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Limitations Footer */}
        <div className="mt-16 border-t border-gray-800 pt-8">
             <h4 className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">About this Tool</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-500 leading-relaxed">
                <div>
                    <strong className="text-gray-300 block mb-1">Visualization Only</strong>
                    This tool generates a video preview (MP4) of what your character looks like in 3D space. It does not export .OBJ or .VRM mesh files suitable for game engines directly.
                </div>
                <div>
                    <strong className="text-gray-300 block mb-1">AI Interpretation</strong>
                    The Veo model infers the 3D depth and hidden angles based on your provided reference images. Small hallucinations or inconsistencies in unseen details are possible.
                </div>
                <div>
                    <strong className="text-gray-300 block mb-1">Google Veo Technology</strong>
                    Powered by Google's Veo 3.1 video generation model. Generation times can vary between 1-3 minutes depending on complexity and server load.
                </div>
             </div>
        </div>

      </main>
    </div>
  );
};

export default App;