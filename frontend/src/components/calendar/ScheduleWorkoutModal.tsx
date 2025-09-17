import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useScheduledWorkoutsContext } from '../../contexts/ScheduledWorkoutsContext';
import { useRoutines } from '../../hooks/useApi';
import { Routine } from '../../types';

interface ScheduleWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

export function ScheduleWorkoutModal({ isOpen, onClose, selectedDate }: ScheduleWorkoutModalProps) {
  const { routines } = useRoutines();
  const { scheduleWorkout } = useScheduledWorkoutsContext();
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [scheduleDate, setScheduleDate] = useState(selectedDate || new Date());
  const [isLoading, setIsLoading] = useState(false);


  // Update scheduleDate when selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      console.log('ScheduleWorkoutModal: selectedDate changed to', selectedDate);
      setScheduleDate(selectedDate);
    }
  }, [selectedDate]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedRoutine(null);
      setScheduleDate(selectedDate || new Date());
    }
  }, [isOpen, selectedDate]);

  const handleSchedule = async () => {
    if (selectedRoutine) {
      try {
        setIsLoading(true);
        await scheduleWorkout(selectedRoutine.id, scheduleDate);
        onClose();
        setSelectedRoutine(null);
      } catch (error) {
        console.error('Error scheduling workout:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Workout"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Schedule Date
          </label>
          <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <input
              type="date"
              value={format(scheduleDate, 'yyyy-MM-dd')}
              onChange={(e) => setScheduleDate(new Date(e.target.value))}
              className="bg-transparent text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Routine Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-4">
            Select Routine
          </label>
          
          {routines.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {routines.map((routine) => (
                <Card
                  key={routine.id}
                  onClick={() => setSelectedRoutine(routine)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedRoutine?.id === routine.id
                      ? 'border-emerald-500 bg-emerald-500 bg-opacity-10'
                      : 'hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-2">
                        {routine.name}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {routine.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span>{routine.exercises.length} exercises</span>
                        <span>Updated {format(new Date(routine.updatedAt), 'MMM dd')}</span>
                      </div>
                    </div>
                    
                    <div className={`
                      w-4 h-4 rounded-full border-2 transition-colors duration-200
                      ${selectedRoutine?.id === routine.id
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-gray-500'
                      }
                    `} />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No routines available</p>
              <p className="text-sm text-gray-500">
                Create a routine first before scheduling workouts
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSchedule}
            disabled={!selectedRoutine || isLoading}
            isLoading={isLoading}
          >
            {isLoading ? 'Scheduling...' : 'Schedule Workout'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}