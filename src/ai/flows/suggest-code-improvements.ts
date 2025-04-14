// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Provides code improvement suggestions for a given HTML code snippet.
 *
 * - suggestCodeImprovements - A function that takes HTML code and provides suggestions for improvements.
 * - SuggestCodeImprovementsInput - The input type for the suggestCodeImprovements function.
 * - SuggestCodeImprovementsOutput - The return type for the suggestCodeImprovements function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestCodeImprovementsInputSchema = z.object({
  htmlCode: z.string().describe('The HTML code snippet to improve.'),
});
export type SuggestCodeImprovementsInput = z.infer<
  typeof SuggestCodeImprovementsInputSchema
>;

const SuggestCodeImprovementsOutputSchema = z.object({
  improvedCode: z
    .string()
    .describe('The improved HTML code snippet with suggestions applied.'),
  explanation: z
    .string()
    .describe('Explanation of the changes made to the code.'),
});
export type SuggestCodeImprovementsOutput = z.infer<
  typeof SuggestCodeImprovementsOutputSchema
>;

export async function suggestCodeImprovements(
  input: SuggestCodeImprovementsInput
): Promise<SuggestCodeImprovementsOutput> {
  return suggestCodeImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeImprovementsPrompt',
  input: {
    schema: z.object({
      htmlCode: z.string().describe('The HTML code snippet to improve.'),
    }),
  },
  output: {
    schema: z.object({
      improvedCode:
        z.string().describe('The improved HTML code snippet.'),
      explanation:
        z.string().describe('Explanation of the changes made to the code.'),
    }),
  },
  prompt: `You are an AI code assistant that helps improve HTML code.

  Given the following HTML code:
  \`\`\`html
  {{{htmlCode}}}
  \`\`\`

  Suggest improvements to the code, focusing on:
  - Code clarity and readability
  - Performance optimizations
  - Accessibility enhancements
  - Bug fixes if any exist

  Return the improved code and an explanation of the changes you made.

  Make sure to return a complete HTML code snippet.
  `,
});

const suggestCodeImprovementsFlow = ai.defineFlow<
  typeof SuggestCodeImprovementsInputSchema,
  typeof SuggestCodeImprovementsOutputSchema
>(
  {
    name: 'suggestCodeImprovementsFlow',
    inputSchema: SuggestCodeImprovementsInputSchema,
    outputSchema: SuggestCodeImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
