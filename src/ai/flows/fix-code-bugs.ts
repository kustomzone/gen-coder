// src/ai/flows/fix-code-bugs.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for fixing code bugs in HTML.
 *
 * - fixCodeBugs - A function that takes HTML code as input and returns suggested fixes for potential bugs.
 * - FixCodeBugsInput - The input type for the fixCodeBugs function.
 * - FixCodeBugsOutput - The return type for the fixCodeBugs function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const FixCodeBugsInputSchema = z.object({
  htmlCode: z.string().describe('The HTML code to be analyzed for bugs.'),
  selectedCode: z.string().optional().describe('The specific section of code selected by the user.'),
});
export type FixCodeBugsInput = z.infer<typeof FixCodeBugsInputSchema>;

const FixCodeBugsOutputSchema = z.object({
  fixedCodeSuggestions: z.string().describe('Suggested fixes for potential bugs in the HTML code.'),
});
export type FixCodeBugsOutput = z.infer<typeof FixCodeBugsOutputSchema>;

export async function fixCodeBugs(input: FixCodeBugsInput): Promise<FixCodeBugsOutput> {
  return fixCodeBugsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fixCodeBugsPrompt',
  input: {
    schema: z.object({
      htmlCode: z.string().describe('The HTML code to be analyzed for bugs.'),
      selectedCode: z.string().optional().describe('The specific section of code selected by the user.'),
    }),
  },
  output: {
    schema: z.object({
      fixedCodeSuggestions: z.string().describe('Suggested fixes for potential bugs in the HTML code.'),
    }),
  },
  prompt: `You are an AI code assistant specializing in HTML. Review the given HTML code, identify any potential bugs or areas for improvement, and provide suggestions to fix them. If a specific section of code is selected, focus your analysis on that section. Otherwise provide a broad overview of the entire code.

HTML Code:
{{#if selectedCode}}
  Selected Code:
  {{selectedCode}}
{{else}}
  Full Code:
  {{htmlCode}}
{{/if}}

Provide clear and concise suggestions for fixing bugs or improving the code. Output the suggested changes directly.
`,
});

const fixCodeBugsFlow = ai.defineFlow<
  typeof FixCodeBugsInputSchema,
  typeof FixCodeBugsOutputSchema
>(
  {
    name: 'fixCodeBugsFlow',
    inputSchema: FixCodeBugsInputSchema,
    outputSchema: FixCodeBugsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
