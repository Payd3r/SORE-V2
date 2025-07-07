'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Clock, Calendar } from 'lucide-react';
import { generateProgressBadges } from '@/lib/challenge-categories';

interface ChallengeProgressProps {
  progress: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  completedAt?: Date;
  showBadges?: boolean;
  showDetails?: boolean;
}

const difficultyColors = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

const statusColors = {
  active: 'bg-blue-500',
  completed: 'bg-green-500',
  paused: 'bg-gray-500',
};

export function ChallengeProgress({
  progress,
  title,
  difficulty,
  status,
  startDate,
  endDate,
  completedAt,
  showBadges = true,
  showDetails = true,
}: ChallengeProgressProps) {
  const badges = generateProgressBadges(progress);
  const now = new Date();
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isOverdue = endDate && endDate < now && status === 'active';

  const getProgressColor = () => {
    if (status === 'completed') return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${difficultyColors[difficulty]} text-white`}>
              {difficulty}
            </Badge>
            <Badge variant="outline" className={`${statusColors[status]} text-white`}>
              {status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {progress === 100 && (
            <div className="flex items-center gap-2 text-green-600">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">Challenge Completed!</span>
            </div>
          )}
        </div>

        {/* Status Information */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Started: {startDate.toLocaleDateString()}</span>
            </div>
            
            {endDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className={isOverdue ? 'text-red-500' : ''}>
                  {isOverdue ? 'Overdue' : `${daysRemaining} days left`}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span>Days elapsed: {daysElapsed}</span>
            </div>
            
            {completedAt && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-green-500" />
                <span>Completed: {completedAt.toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Achievement Badges */}
        {showBadges && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Achievements</span>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.achieved ? 'default' : 'outline'}
                  className={`${
                    badge.achieved 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                >
                  <span className="mr-1">{badge.emoji}</span>
                  {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {status === 'active' && progress < 100 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              {progress === 0 && "Every journey begins with a single step. You've got this! 🌟"}
              {progress > 0 && progress < 25 && "Great start! Keep the momentum going! 💪"}
              {progress >= 25 && progress < 50 && "You're making excellent progress! 🚀"}
              {progress >= 50 && progress < 75 && "Halfway there! The finish line is getting closer! 🎯"}
              {progress >= 75 && progress < 100 && "So close! You're in the final stretch! 🏁"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for lists
export function ChallengeProgressCompact({
  progress,
  title,
  difficulty,
  status,
}: Pick<ChallengeProgressProps, 'progress' | 'title' | 'difficulty' | 'status'>) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {difficulty}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        </div>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-bold">{progress}%</div>
          <Progress value={progress} className="w-20 h-2" />
        </div>
        {progress === 100 && <Trophy className="w-5 h-5 text-green-500" />}
      </div>
    </div>
  );
} 