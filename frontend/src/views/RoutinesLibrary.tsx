import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Play, Edit3, Eye } from 'lucide-react';
import { Card, Button, Input, CreateEditRoutineModal } from '../components';
import { useRoutinesContext } from '../contexts/RoutinesContext';
import { Routine } from '../types';

interface RoutinesLibraryProps {
  onRoutineSelect?: (routine: Routine) => void;
}

export function RoutinesLibrary({ onRoutineSelect }: RoutinesLibraryProps) {
  const navigate = useNavigate();
  const { routines } = useRoutinesContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const filteredRoutines = routines.filter(routine =>
    routine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    routine.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVideoThumbnail = (videoUrl?: string) => {
    if (!videoUrl) return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400';
    
    // Extract YouTube video ID and create thumbnail URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    
    return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Routines Library</h1>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowCreateModal(true)}
        >
          Create New Routine
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search routines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Routines Grid */}
      {filteredRoutines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutines.map((routine) => (
            <Card key={routine.id} className="overflow-hidden">
              {/* Thumbnail */}
              <div className="relative h-48">
                <img
                  src={getVideoThumbnail(routine.videoUrl)}
                  alt={routine.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="lg"
                    icon={Play}
                    onClick={() => onRoutineSelect?.(routine)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-white line-clamp-2">
                    {routine.name}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    onClick={() => setEditingRoutine(routine)}
                    className="p-2 text-gray-400 hover:text-white"
                  />
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {routine.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span>{routine.exercises.length} exercises</span>
                  <span>{new Date(routine.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Exercises Preview */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Exercises Preview
                  </p>
                  <div className="space-y-1">
                    {routine.exercises.slice(0, 3).map((exercise, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-300">{exercise.name}</span>
                        <span className="text-gray-500">
                          {exercise.sets && exercise.reps 
                            ? `${exercise.sets}x${exercise.reps}`
                            : exercise.duration || 'N/A'
                          }
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{routine.exercises.length - 3} more exercises
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant="primary"
                  icon={Eye}
                  onClick={() => navigate(`/routines/${routine.id}`)}
                  className="w-full"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? 'No routines found' : 'No routines yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first workout routine to get started'
            }
          </p>
          {!searchTerm && (
            <Button 
              variant="primary" 
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Routine
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateEditRoutineModal
        isOpen={showCreateModal || !!editingRoutine}
        onClose={() => {
          setShowCreateModal(false);
          setEditingRoutine(null);
        }}
        routine={editingRoutine}
      />
    </div>
  );
}