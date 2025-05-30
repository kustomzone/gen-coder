"use client";

import {useState, useCallback, useRef} from 'react';
import {Sandpack} from "@codesandbox/sandpack-react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {useToast as useToastContext} from "@/hooks/use-toast";
import {fixCodeBugs} from "@/ai/flows/fix-code-bugs";
import {suggestCodeImprovements} from "@/ai/flows/suggest-code-improvements";
import {Loader2, FileUp, Save, Sparkles, Sun, Moon, Brain} from "lucide-react";
import {AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction} from "@/components/ui/alert-dialog";
import {useTheme} from "@/components/theme-provider";

const initialHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First HTML</title>
</head>
<body>
    <h1>Hello, world!</h1>
    <p>This is a paragraph.</p>
</body>
</html>`;

export default function Home() {
  const [htmlCode, setHtmlCode] = useState(initialHtmlContent);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [selectedCodeForAI, setSelectedCodeForAI] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const {toast} = useToastContext();
  const {setTheme, theme} = useTheme();
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelPath, setModelPath] = useState<string | null>(null);

  const handleCodeChange = useCallback((code: string) => {
    setHtmlCode(code);
    if(sandpackRef.current) {
      sandpackRef.current.updateSandpack({
        files: {
          "/index.html": {code: code, active: true},
        },
      });
    }
  }, []);

  // Update Sandpack code when debounced code changes
  const debouncedCode = htmlCode; // useDebounce(htmlCode, 500);

  const sandpackRef = useRef(null);

  useState(() => {
    if(sandpackRef.current) {
      sandpackRef.current.updateSandpack({
        files: {
          "/index.html": {code: debouncedCode, active: true},
        },
      });
    }
  }, [debouncedCode]);

  const handleLoadFile = async () => {
    try {
      const fileHandle = await window.showOpenFilePicker({
        types: [
          {
            description: "HTML Files",
            accept: {
              "text/html": [".html", ".htm"],
            },
          },
        ],
      });

      if (fileHandle.length === 0) {
        toast({
          title: "No file selected",
          description: "Please select an HTML file.",
        });
        return;
      }

      const file = await (await fileHandle[0].getFile()).text();
      setHtmlCode(file);

      if(sandpackRef.current) {
        sandpackRef.current.updateSandpack({
          files: {
            "/index.html": {code: file, active: true},
          },
        });
      }

      toast({
        title: "File loaded",
        description: "The HTML file has been loaded successfully.",
      });
    } catch (e: any) {
      // If the user cancels the file picker, it throws an error.
      if (e.name === 'AbortError') {
        return;
      }
      toast({
        variant: "destructive",
        title: "Error loading file",
        description: e.message,
      });
    }
  };

  const handleSaveFile = async () => {
    try {
      const fileHandle = await window.showSaveFilePicker({
        types: [
          {
            description: "HTML Files",
            accept: {
              "text/html": [".html", ".htm"],
            },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(htmlCode);
      await writable.close();
      toast({
        title: "File saved",
        description: "The HTML file has been saved successfully.",
      });
    } catch (e: any) {
      // If the user cancels the save picker, it throws an error.
      if (e.name === 'AbortError') {
        return;
      }
      toast({
        variant: "destructive",
        title: "Error saving file",
        description: e.message,
      });
    }
  };

  const handleGetAISuggestions = async () => {
    setIsProcessingAI(true);
    setAiSuggestions(null);

    try {
      const result = await (selectedCodeForAI ? fixCodeBugs({htmlCode, selectedCode: selectedCodeForAI + aiPrompt}) : suggestCodeImprovements({htmlCode: htmlCode + aiPrompt}));

      setAiSuggestions(result?.improvedCode || result?.fixedCodeSuggestions || "No suggestions found.");
      toast({
        title: "AI suggestions generated",
        description: "AI has analyzed your code and provided suggestions.",
      });
    } catch (error: any) {
      console.error("AI processing error:", error);
      toast({
        variant: "destructive",
        title: "AI processing error",
        description: error.message,
      });
      setAiSuggestions(`Error generating suggestions: ${error.message}`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiSuggestions) {
      setHtmlCode(aiSuggestions);
      handleCodeChange(aiSuggestions);

      toast({
        title: "AI suggestion applied",
        description: "The AI suggestion has been applied to your code.",
      });
      setAiSuggestions(null); // Clear suggestions after applying
    }
  };

  const handleCancelAI = () => {
    setIsProcessingAI(false);
    setAiSuggestions(null);
    toast({
      title: "AI processing cancelled",
      description: "AI processing has been cancelled.",
    });
  };

  const handleLoadModel = async () => {
    setIsModelLoading(true);
    try {
      const fileHandle = await window.showOpenFilePicker({
        types: [
          {
            description: "GGUF Model Files",
            accept: {
              "application/octet-stream": [".gguf"],
            },
          },
        ],
      });

      if (fileHandle.length === 0) {
        toast({
          title: "No model selected",
          description: "Please select a GGUF model file.",
        });
        return;
      }

      const file = await fileHandle[0].getFile();
      const path = file.name; // Or any other relevant identifier

      setModelPath(path);

      toast({
        title: "Model loaded",
        description: `The model ${path} has been loaded.`,
      });
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return;
      }
      toast({
        variant: "destructive",
        title: "Error loading model",
        description: e.message,
      });
    } finally {
      setIsModelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 bg-secondary p-4 shadow-md z-10">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Autogen</h1>
          <div className="space-x-2 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
            </Button>
            <Button onClick={handleLoadFile} disabled={isProcessingAI || isModelLoading}>
              <FileUp className="mr-2 h-4 w-4"/>
              Load HTML
            </Button>
             <Button onClick={handleLoadModel} disabled={isProcessingAI || isModelLoading}>
              {isModelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Loading Model...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4"/>
                  Load Model
                </>
              )}
            </Button>
            <Button onClick={handleSaveFile} disabled={isProcessingAI || isModelLoading}>
              <Save className="mr-2 h-4 w-4"/>
              Save HTML
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={isProcessingAI || isModelLoading}>
                  {isProcessingAI ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      Suggesting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4"/>
                      Gen
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate AI Suggestions</AlertDialogTitle>
                  <AlertDialogDescription>
                    Add a prompt to guide the AI suggestions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Additional instructions for the AI"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleGetAISuggestions}>
                    Generate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex-1 p-4 flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 lg:w-2/3">
          <Textarea
            value={htmlCode}
            className="h-[calc(100vh-200px)]"
            onChange={(e) => handleCodeChange(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/2 lg:w-1/3 p-4 bg-card rounded-md shadow-md">
          <h2 className="text-lg font-semibold mb-2">Live Preview</h2>
          <div className="overflow-hidden rounded-md border">
            <Sandpack
              ref={sandpackRef}
              theme="dark"
              files={{
                "/index.html": {code: htmlCode, active: true},
              }}
              options={{
                readOnly: true,
                showNavigator: false,
                showLineNumbers: true,
                wrapContent: true,
                autorun: true,
                recompileMode: "delayed",
                recompileDelay: 300,
              }}
              style={{width: '100%', height: 'calc(100vh - 200px)'}}
            />
          </div>
        </div>
      </div>

      {aiSuggestions && (
        <div className="fixed bottom-0 left-0 w-full bg-secondary p-4 shadow-md z-20">
          <div className="container mx-auto flex items-center justify-between">
            <div className="text-sm">
              <h3 className="font-semibold">AI Suggestion:</h3>
              <pre className="whitespace-pre-wrap">{aiSuggestions}</pre>
            </div>
            <div className="space-x-2">
              <Button variant="secondary" onClick={applyAiSuggestion} disabled={isProcessingAI || isModelLoading}>
                Apply Suggestion
              </Button>
              <Button variant="destructive" onClick={handleCancelAI} disabled={isProcessingAI || isModelLoading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {(isProcessingAI || isModelLoading) && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary p-6 rounded-md shadow-lg z-30 flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin"/>
          <p>{isProcessingAI ? "AI is processing your code..." : "Loading GGUF Model..."}</p>
          <Button variant="destructive" onClick={handleCancelAI} disabled={!isProcessingAI}>
            Cancel AI Processing
          </Button>
           <Button variant="destructive" onClick={handleLoadModel} disabled={isProcessingAI}>
            Cancel Model Loading
          </Button>
        </div>
      )}
    </div>
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="sm:flex w-full flex-row-reverse justify-end space-x-2 space-y-2 sm:space-x-0 sm:space-y-0"
      {...props}
    />
  )
}
AlertDialogFooter.displayName = "AlertDialogFooter"
