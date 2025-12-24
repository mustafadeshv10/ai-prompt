
import React, { useState, useCallback, useMemo } from 'react';
import { generatePromptFromImage } from './services/geminiService';
import { UploadIcon, CopyIcon, CheckIcon, SparklesIcon, XCircleIcon } from './components/icons';

type Status = 'initial' | 'image-selected' | 'loading' | 'success' | 'error';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [status, setStatus] = useState<Status>('initial');
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const imageUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return null;
  }, [imageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
        setStatus('error');
        return;
      }
      setImageFile(file);
      setPrompt('');
      setError('');
      setStatus('image-selected');
    }
  };

  const handleGeneratePrompt = useCallback(async () => {
    if (!imageFile) return;

    setStatus('loading');
    setError('');
    setPrompt('');

    try {
      const generatedPrompt = await generatePromptFromImage(imageFile);
      setPrompt(generatedPrompt);
      setStatus('success');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'An unexpected error occurred. Please try again.');
      setStatus('error');
    }
  }, [imageFile]);

  const handleCopy = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const resetState = () => {
    setImageFile(null);
    setPrompt('');
    setError('');
    setStatus('initial');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-white">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <SparklesIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
              Visionary Prompts
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Upload an image and let our AI craft the perfect descriptive prompt for you.
          </p>
        </header>

        <main className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-500">
          
          {!imageUrl && (
            <div className="w-full transition-all duration-500 ease-in-out">
              <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800/70 hover:border-cyan-500 transition-colors duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 mb-3 text-slate-500" />
                  <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF, WEBP</p>
                </div>
                <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
          )}

          {imageUrl && (
            <div className="flex flex-col items-center gap-6 transition-all duration-500 ease-in-out">
              <div className="w-full max-w-sm relative group">
                <img src={imageUrl} alt="Uploaded preview" className="rounded-lg shadow-lg w-full object-contain max-h-80" />
                 <button onClick={resetState} className="absolute -top-3 -right-3 bg-slate-700 hover:bg-red-500 text-white rounded-full p-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100">
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              <button
                onClick={handleGeneratePrompt}
                disabled={status === 'loading'}
                className="relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : '✨ Generate Prompt'}
              </button>
            </div>
          )}
          
          {status === 'error' && error && (
             <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg animate-fade-in">
              <p className="font-medium text-center">{error}</p>
            </div>
          )}

          {status === 'success' && prompt && (
            <div className="mt-8 pt-6 border-t border-slate-700 animate-fade-in-up">
              <h2 className="text-xl font-bold text-slate-300 mb-3 text-center">Your Generated Prompt:</h2>
              <div className="relative p-4 bg-slate-900/70 rounded-lg border border-slate-700">
                <p className="text-slate-300 leading-relaxed">{prompt}</p>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors duration-200"
                  aria-label="Copy prompt"
                >
                  {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

        </main>

        <footer className="text-center mt-8">
            <p className="text-sm text-slate-500">
                Powered by Gemini API. Built with React & Tailwind CSS.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
