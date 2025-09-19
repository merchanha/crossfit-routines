import React, { useState } from 'react';
import { User, Edit3, Trophy, Calendar, Flame, Target } from 'lucide-react';
import { Card, Button, Input } from '../components';
import { useUser } from '../hooks/useApi';
import { useRoutinesContext } from '../contexts/RoutinesContext';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { ScheduledWorkout } from '../types';

export function ProfileView() {
  const { user, updateUser, isLoading: userLoading } = useUser();
  const { routines } = useRoutinesContext();
  const { scheduledWorkouts } = useScheduledWorkoutsContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
    goals: 'Get stronger, build endurance, and maintain consistency' // This would come from user stats or separate field
  });

  // Update edit form when user data loads
  React.useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || '',
        goals: 'Get stronger, build endurance, and maintain consistency'
      });
    }
  }, [user]);

  const stats = {
    totalRoutines: routines.length,
    totalWorkouts: scheduledWorkouts.length,
    completedWorkouts: scheduledWorkouts.filter((w:ScheduledWorkout) => w.completed).length,
    currentStreak: user?.stats?.currentStreak || 7,
    joinedDaysAgo: user ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
  };

  const handleSave = async () => {
    try {
      await updateUser({
        name: editForm.name,
        email: editForm.email,
        profilePicture: editForm.profilePicture
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture || '',
        goals: 'Get stronger, build endurance, and maintain consistency'
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <Button
          variant={isEditing ? 'ghost' : 'secondary'}
          icon={Edit3}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Picture */}
              <div className="relative">
                <img
                  src={isEditing ? editForm.profilePicture : (user?.profilePicture || 'https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=150')}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center sm:text-left">
                {userLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-32"></div>
                  </div>
                ) : user ? (
                  <>
                    {isEditing ? (
                      <div className="space-y-4">
                        <Input
                          label="Name"
                          value={editForm.name}
                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                        <Input
                          label="Profile Picture URL"
                          value={editForm.profilePicture}
                          onChange={(e) => setEditForm(prev => ({ ...prev, profilePicture: e.target.value }))}
                        />
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
                        <p className="text-gray-300 mb-4">{user.email}</p>
                        <div className="flex items-center justify-center sm:justify-start space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {stats.joinedDaysAgo} days ago</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-gray-400">Failed to load user data</p>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex justify-end space-x-4">
                  <Button variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Goals Section */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Fitness Goals</h3>
            {isEditing ? (
              <div>
                <textarea
                  value={editForm.goals}
                  onChange={(e) => setEditForm(prev => ({ ...prev, goals: e.target.value }))}
                  className="w-full h-32 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-vertical"
                  placeholder="What are your fitness goals?"
                />
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300 leading-relaxed">
                  {editForm.goals}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Your Stats</h3>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Routines</p>
                <p className="text-xl font-bold text-white">{stats.totalRoutines}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-cyan-500 rounded-lg">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Workouts</p>
                <p className="text-xl font-bold text-white">{stats.totalWorkouts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-xl font-bold text-white">{stats.completedWorkouts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-500">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-red-500 rounded-lg">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Streak</p>
                {/* <p className="text-xl font-bold text-white">{stats.currentStreak} days</p> */}
                <p className="text-gray-400 text-sm">Not available</p>
              </div>
            </div>
          </Card>

          {/* Completion Rate */}
          <Card className="p-4">
            <h4 className="font-medium text-white mb-3">Completion Rate</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">
                  {stats.totalWorkouts > 0 
                    ? Math.round((stats.completedWorkouts / stats.totalWorkouts) * 100)
                    : 0
                  }%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats.totalWorkouts > 0 
                      ? (stats.completedWorkouts / stats.totalWorkouts) * 100
                      : 0
                    }%` 
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}