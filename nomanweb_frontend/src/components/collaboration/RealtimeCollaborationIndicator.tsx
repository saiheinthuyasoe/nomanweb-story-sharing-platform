import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealtimeCollaboration, Collaborator } from '@/hooks/useRealtimeCollaboration';
import { useAuth } from '@/contexts/AuthContext';
import { WifiIcon, WifiOffIcon } from 'lucide-react';

interface RealtimeCollaborationIndicatorProps {
  chapterId: string;
  className?: string;
}

export const RealtimeCollaborationIndicator: React.FC<RealtimeCollaborationIndicatorProps> = ({
  chapterId,
  className = '',
}) => {
  const { user } = useAuth();
  const { isConnected, collaborators, activeCollaboratorCount, error } = useRealtimeCollaboration(chapterId);
  
  // Calculate total collaborators including current user
  const totalCollaborators = collaborators.length + (user ? 1 : 0);

  // Debug logging
  console.log('RealtimeCollaborationIndicator render:', {
    isConnected,
    collaborators: collaborators.length,
    totalCollaborators,
    activeCollaboratorCount,
    error,
    chapterId
  });

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 text-gray-500">
          <WifiOffIcon className="w-4 h-4" />
          <span className="text-sm">Offline</span>
        </div>
        {error && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{error}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {/* Debug info */}
        <div className="text-xs text-gray-400">
          Debug: {isConnected ? 'Connected' : 'Not Connected'}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-1 text-green-600">
        <WifiIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Live</span>
      </div>

      {/* Total Collaborators Count */}
      {totalCollaborators > 0 && (
        <Badge variant="secondary" className="text-xs">
          {totalCollaborators} active
        </Badge>
      )}

      {/* Collaborator Avatars */}
      <div className="flex items-center gap-1">
        {collaborators.slice(0, 3).map((collaborator) => (
          <TooltipProvider key={collaborator.userId}>
            <Tooltip>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="w-6 h-6 border-2 border-white shadow-sm">
                    <AvatarImage src={collaborator.profileImageUrl} alt={collaborator.displayName} />
                    <AvatarFallback className="text-xs bg-gray-200">
                      {collaborator.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      collaborator.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {/* Cursor indicator */}
                  {collaborator.cursorPosition !== undefined && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: collaborator.color }}
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{collaborator.displayName}</p>
                  <p className="text-xs text-gray-500">
                    {collaborator.isOnline ? 'Online' : 'Offline'}
                  </p>
                  {collaborator.cursorPosition !== undefined && (
                    <p className="text-xs text-gray-500">
                      Editing at position {collaborator.cursorPosition}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Show more indicator if there are more than 3 collaborators */}
        {collaborators.length > 3 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{collaborators.length - 3}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{collaborators.length - 3} more collaborators</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}; 