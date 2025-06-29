import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collaborationsApi, CreateCollaborationRequest, CollaborationResponse, CollaboratorPresence } from '@/lib/api/collaborations';
import toast from 'react-hot-toast';

// Create invitation
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCollaborationRequest) => collaborationsApi.createInvitation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', data.chapterId] });
      toast.success('Invitation sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });
}

// Accept invitation
export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (token: string) => collaborationsApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitation accepted!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    },
  });
}

// Get invitation details
export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => collaborationsApi.getInvitationDetails(token),
    enabled: !!token,
  });
}

// Update role
export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chapterId, userId, role }: { chapterId: string; userId: string; role: 'EDIT' | 'VIEW' }) =>
      collaborationsApi.updateRole(chapterId, userId, role),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.chapterId] });
      toast.success('Role updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update role');
    },
  });
}

// Remove collaborator
export function useRemoveCollaborator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chapterId, userId }: { chapterId: string; userId: string }) =>
      collaborationsApi.removeCollaborator(chapterId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', variables.chapterId] });
      toast.success('Collaborator removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove collaborator');
    },
  });
}

// Leave collaboration
export function useLeaveCollaboration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chapterId: string) => collaborationsApi.leaveCollaboration(chapterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborations'] });
      toast.success('Left collaboration');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to leave collaboration');
    },
  });
}

// Get chapter collaborators
export function useChapterCollaborators(chapterId: string) {
  return useQuery({
    queryKey: ['collaborators', chapterId],
    queryFn: () => collaborationsApi.getChapterCollaborators(chapterId),
    enabled: !!chapterId,
  });
}

// Get user collaborations
export function useUserCollaborations() {
  return useQuery({
    queryKey: ['collaborations'],
    queryFn: () => collaborationsApi.getUserCollaborations(),
  });
}

// Get pending invitations
export function usePendingInvitations() {
  return useQuery({
    queryKey: ['pending-invitations'],
    queryFn: () => collaborationsApi.getPendingInvitations(),
  });
}

// Update presence
export function useUpdatePresence(chapterId: string) {
  return useMutation({
    mutationFn: (presence: Partial<CollaboratorPresence>) =>
      collaborationsApi.updatePresence(chapterId, presence),
  });
}

// Get online collaborators with polling
export function useOnlineCollaborators(chapterId: string, enabled = true) {
  return useQuery({
    queryKey: ['online-collaborators', chapterId],
    queryFn: () => collaborationsApi.getOnlineCollaborators(chapterId),
    enabled: !!chapterId && enabled,
    refetchInterval: 5000, // Poll every 5 seconds
  });
} 