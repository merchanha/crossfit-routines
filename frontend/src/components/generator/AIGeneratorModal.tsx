import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import { Input } from '../ui/Input';
import { useAIGenerator } from '../../hooks/useAIGenerator';
import { GeneratedRoutinePreview } from './GeneratedRoutinePreview';
import { GeneratedRoutine } from '../../api';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (routine: GeneratedRoutine) => void;
}

export function AIGeneratorModal({ isOpen, onClose, onSave }: AIGeneratorModalProps) {
  const { generateRoutine, isGenerating, error, generatedRoutine, reset } = useAIGenerator();
  const [prompt, setPrompt] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [equipment, setEquipment] = useState<'minimal' | 'full' | 'none' | ''>('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    try {
      const preferences: any = {};
      if (difficulty) preferences.difficulty = difficulty;
      if (equipment) preferences.equipment = equipment;

      await generateRoutine({
        prompt: prompt.trim(),
        saveToLibrary,
        preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      });
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to generate routine:', err);
    }
  };

  const handleRegenerate = () => {
    reset();
  };

  const handleClose = () => {
    reset();
    setPrompt('');
    setSaveToLibrary(false);
    setDifficulty('');
    setEquipment('');
    onClose();
  };

  const handleSave = () => {
    if (generatedRoutine && onSave) {
      onSave(generatedRoutine);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Routine with AI" size="xl">
      <div className="p-6 space-y-6">
        {!generatedRoutine ? (
          <>
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your workout
                </label>
                <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A cardio-focused workout for two people lasting 40 minutes"
                  rows={4}
                  className="w-full bg-gray-700 text-white border-gray-600"
                  disabled={isGenerating}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Be specific about duration, number of people, focus areas, and any preferences.
                </p>
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
                    disabled={isGenerating}
                  >
                    <option value="">Any</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Equipment
                  </label>
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-md"
                    disabled={isGenerating}
                  >
                    <option value="">Any</option>
                    <option value="minimal">Minimal</option>
                    <option value="full">Full Gym</option>
                    <option value="none">No Equipment</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveToLibrary"
                  checked={saveToLibrary}
                  onChange={(e) => setSaveToLibrary(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                  disabled={isGenerating}
                />
                <label htmlFor="saveToLibrary" className="text-sm text-gray-300">
                  Save directly to library
                </label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-500 rounded-md">
                <p className="text-sm text-red-400 font-semibold mb-2">
                  Unable to generate routine
                </p>
                <p className="text-sm text-red-300 mb-3">
                  {error}
                </p>
                <p className="text-xs text-gray-400">
                  Please try again later or create a routine manually using the "Create New Routine" button.
                </p>
              </div>
            )}

            {/* Generate Button */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                icon={isGenerating ? Loader2 : Sparkles}
                className="min-w-[140px]"
              >
                {isGenerating ? 'Generating...' : 'Generate Routine'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Generated Routine Preview */}
            <GeneratedRoutinePreview routine={generatedRoutine} />

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <Button
                variant="ghost"
                onClick={handleRegenerate}
                icon={RefreshCw}
                disabled={isGenerating}
              >
                Regenerate
              </Button>
              {!generatedRoutine.saved && (
                <Button
                  variant="secondary"
                  onClick={handleSave}
                  disabled={isGenerating}
                >
                  {saveToLibrary ? 'Saved!' : 'Save to Library'}
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleClose}
                disabled={isGenerating}
              >
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

