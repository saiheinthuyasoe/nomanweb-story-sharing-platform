export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  coinBalance: number;
  totalEarnedCoins: number;
  lineUserId?: string;
  googleId?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
} 