import { apiClient } from './client';

export interface CreateCollaborationRequest {
  chapterId: string;
  inviteeEmail: string;
  role: 'EDIT' | 'VIEW';
  message?: string;
}

export interface CollaborationUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  profileImageUrl?: string;
}

export interface CollaborationResponse {
  id: string;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  storyId: string;
  storyTitle: string;
  user: CollaborationUser;
  role: 'EDIT' | 'VIEW';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  invitationToken?: string;
  invitationExpiresAt?: string;
  invitationAcceptedAt?: string;
  invitedBy?: CollaborationUser;
  isPending: boolean;
}

export interface CollaboratorPresence {
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  role: string;
  isOnline: boolean;
  lastSeenAt: string;
  cursorPosition?: string;
  selectionRange?: string;
  color?: string;
}

export const collaborationsApi = {
  // Create invitation
  async createInvitation(data: CreateCollaborationRequest): Promise<CollaborationResponse> {
    const response = await apiClient.post('/collaborations/invite', data);
    return response.data;
  },

  // Accept invitation
  async acceptInvitation(token: string): Promise<CollaborationResponse> {
    const response = await apiClient.post(`/collaborations/accept/${token}`);
    return response.data;
  },

  // Get invitation details
  async getInvitationDetails(token: string): Promise<CollaborationResponse> {
    const response = await apiClient.get(`/collaborations/invitation/${token}`);
    return response.data;
  },

  // Update collaborator role
  async updateRole(chapterId: string, userId: string, role: 'EDIT' | 'VIEW'): Promise<CollaborationResponse> {
    const response = await apiClient.put(
      `/collaborations/chapters/${chapterId}/users/${userId}/role`,
      null,
      { params: { role } }
    );
    return response.data;
  },

  // Remove collaborator
  async removeCollaborator(chapterId: string, userId: string): Promise<void> {
    await apiClient.delete(`/collaborations/chapters/${chapterId}/users/${userId}`);
  },

  // Leave collaboration
  async leaveCollaboration(chapterId: string): Promise<void> {
    await apiClient.delete(`/collaborations/chapters/${chapterId}/leave`);
  },

  // Get chapter collaborators
  async getChapterCollaborators(chapterId: string): Promise<CollaborationResponse[]> {
    const response = await apiClient.get(`/collaborations/chapters/${chapterId}`);
    return response.data;
  },

  // Get user's collaborations
  async getUserCollaborations(): Promise<CollaborationResponse[]> {
    const response = await apiClient.get('/collaborations/my-collaborations');
    return response.data;
  },

  // Get pending invitations
  async getPendingInvitations(): Promise<CollaborationResponse[]> {
    const response = await apiClient.get('/collaborations/pending-invitations');
    return response.data;
  },

  // Update presence
  async updatePresence(chapterId: string, presence: Partial<CollaboratorPresence>): Promise<void> {
    await apiClient.post(`/collaborations/chapters/${chapterId}/presence`, presence);
  },

  // Get online collaborators
  async getOnlineCollaborators(chapterId: string): Promise<CollaboratorPresence[]> {
    const response = await apiClient.get(`/collaborations/chapters/${chapterId}/online`);
    return response.data;
  },
}; 