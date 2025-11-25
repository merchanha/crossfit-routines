import { Injectable, Logger } from '@nestjs/common';
import { GeneratorPreferencesDto } from '../dto/generate-routine-request.dto';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  /**
   * Builds a comprehensive prompt for AI routine generation.
   * @param userPrompt The user's natural language description
   * @param preferences Optional preferences for customization
   * @returns A formatted prompt string for the AI
   */
  buildPrompt(
    userPrompt: string,
    preferences?: GeneratorPreferencesDto,
  ): string {
    let prompt = `Generate a complete CrossFit/functional fitness workout routine based on the following user request:\n\n"${userPrompt}"\n\n`;

    // Add preferences context
    if (preferences) {
      prompt += 'Additional Requirements:\n';
      if (preferences.difficulty) {
        prompt += `- Difficulty Level: ${preferences.difficulty}\n`;
      }
      if (preferences.equipment) {
        prompt += `- Equipment Available: ${preferences.equipment}\n`;
      }
      if (preferences.focus) {
        prompt += `- Focus Area: ${preferences.focus}\n`;
      }
      prompt += '\n';
    }

    // Add functional fitness rules
    prompt += this.getFunctionalFitnessRules();

    // Add output format instructions
    prompt += this.getOutputFormatInstructions();

    return prompt;
  }

  /**
   * Returns functional fitness rules and guidelines for AI generation.
   */
  private getFunctionalFitnessRules(): string {
    return (
      `Functional Fitness Guidelines:\n` +
      `- Focus on compound movements that engage multiple muscle groups\n` +
      `- Include variety: cardio, strength, and mobility exercises\n` +
      `- Ensure exercises are scalable for different fitness levels\n` +
      `- Consider time efficiency and practical equipment needs\n` +
      `- Include proper rest periods between sets (typically 30-90 seconds)\n` +
      `- Make exercises safe and achievable for the target duration\n` +
      `- Use common CrossFit movements: burpees, box jumps, kettlebell swings, wall balls, etc.\n` +
      `- For partner workouts, include synchronized or alternating exercises\n` +
      `- Ensure the total estimated duration matches the user's request\n\n`
    );
  }

  /**
   * Returns output format instructions for structured JSON generation.
   */
  private getOutputFormatInstructions(): string {
    return (
      `Output Requirements:\n` +
      `- Provide a creative, descriptive name for the routine\n` +
      `- Write a detailed description explaining the workout's purpose and structure\n` +
      `- List 4-8 exercises with clear names\n` +
      `- For each exercise, specify:\n` +
      `  * sets (number of sets, typically 3-5)\n` +
      `  * reps (number of repetitions per set, or time-based like "30 seconds")\n` +
      `  * notes (optional: form cues, modifications, rest periods)\n` +
      `- Calculate and provide estimatedDuration in minutes (must match user's request if specified)\n` +
      `- Ensure all exercises are realistic and achievable within the time frame\n` +
      `- Make the routine engaging and challenging but safe\n\n`
    );
  }

  /**
   * Builds the JSON schema for structured output.
   */
  buildOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Creative name for the workout routine',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the workout routine',
        },
        estimatedDuration: {
          type: 'number',
          description: 'Estimated duration in minutes',
        },
        exercises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the exercise',
              },
              sets: {
                type: 'number',
                description: 'Number of sets',
              },
              reps: {
                type: 'number',
                description: 'Number of repetitions per set',
              },
              notes: {
                type: 'string',
                description:
                  'Optional notes about form, modifications, or rest periods',
              },
            },
            required: ['name', 'sets', 'reps'],
          },
          minItems: 4,
          maxItems: 8,
        },
      },
      required: ['name', 'description', 'estimatedDuration', 'exercises'],
    };
  }
}
