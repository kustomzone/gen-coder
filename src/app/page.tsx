"use client";

import {useState, useCallback, useRef} from 'react';
import {Sandpack} from "@codesandbox/sandpack-react";
import {useDebounce} from 'usehooks-ts';
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {toast} from "@/hooks/use-toast";
import {useToast as useToastContext} from "@/hooks/use-toast";
import {fixCodeBugs} from "@/ai/flows/fix-code-bugs";
import {suggestCodeImprovements} from "@/ai/flows/suggest-code-improvements";
import {Loader2, FileUp, Save, Sparkles, X} from "lucide-react";
import {AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction} from "@/components/ui/alert-dialog";

const initialHtmlContent = `
<!DOCTYPE html>
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
</html>
`;

export default function Home() {
  const [htmlCode, setHtmlCode] = useState(initialHtmlContent);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [selectedCodeForAI, setSelectedCodeForAI] = useState<string | null>(null);
  const {toast} = useToastContext();

  const handleCodeChange = useCallback((code: string) => {
    setHtmlCode(code);
  }, []);

  const debouncedCode = useDebounce(htmlCode, 500);

  const sandpackRef = useRef(null);
  const {updateSandpack} = Sandpack.useSandpack();

  // Update Sandpack code when debounced code changes
  useState(() => {
    updateSandpack({
      files: {
        "/index.html": {
          code: debouncedCode,
        },
      },
    });
  }, [debouncedCode, updateSandpack]);

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
      const result = await (selectedCodeForAI ? fixCodeBugs({htmlCode, selectedCode: selectedCodeForAI}) : suggestCodeImprovements({htmlCode}));

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
      toast({
        title: "AI suggestion applied",
        description: "The AI suggestion has been applied to your code.",
      });
      setAiSuggestions(null); // Clear suggestions after applying
      setSelectedCodeForAI(null);
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

  const codeMirrorOptions = {
    lineWrapping: true,
    lineNumbers: true,
    mode: "htmlmixed",
    theme: "material",
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 bg-secondary p-4 shadow-md z-10">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">CodeMuse</h1>
          <div className="space-x-2">
            <Button onClick={handleLoadFile} disabled={isProcessingAI}>
              <FileUp className="mr-2 h-4 w-4"/>
              Load HTML
            </Button>
            <Button onClick={handleSaveFile} disabled={isProcessingAI}>
              <Save className="mr-2 h-4 w-4"/>
              Save HTML
            </Button>
            <Button onClick={handleGetAISuggestions} disabled={isProcessingAI}>
              {isProcessingAI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Suggesting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4"/>
                  Get AI Suggestions
                </>
              )}
            </Button>
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
              <Button variant="secondary" onClick={applyAiSuggestion}>
                Apply Suggestion
              </Button>
              <Button variant="destructive" onClick={handleCancelAI}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {isProcessingAI && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary p-6 rounded-md shadow-lg z-30 flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin"/>
          <p>AI is processing your code...</p>
          <Button variant="destructive" onClick={handleCancelAI}>
            Cancel AI Processing
          </Button>
        </div>
      )}
    </div>
  );
}

