export interface User {
  id: string;
  email: string;
  name: string;
  avatarInitials: string;
  avatarColor?: string;
  avatarUrl?: string;
  plan?: string;
  isProvider: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  user?: User;
  role: string;
  category: string;
  bio: string;
  phone: string;
  city: string;
  coverUrl?: string;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  jobsCount: number;
  services?: Service[];
  promos?: Promo[];
  posts?: Post[];
}

export interface Service {
  id: string;
  providerId: string;
  storeId?: string;
  provider?: ProviderProfile;
  name: string;
  price: number;
  duration: number;
  category: string;
  description: string;
}

export interface Promo {
  id: string;
  providerId: string;
  serviceId: string;
  service?: Service;
  provider?: ProviderProfile;
  title: string;
  description: string;
  discountPct: number;
  endsAt?: string;
  active: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  type: 'provider' | 'client';
  text: string;
  imageLabel?: string;
  imageColor?: string;
  imageUrl?: string;
  videoUrl?: string;
  category: string;
  serviceId?: string;
  service?: Service;
  likesCount: number;
  comments?: Comment[];
  createdAt: string;
  liked?: boolean;
  saved?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  clientId: string;
  providerId: string;
  bookingId?: string;
  rating: number;
  text?: string;
  client?: User;
  createdAt: string;
}

export interface Store {
  id: string;
  providerId: string;
  provider?: ProviderProfile;
  name: string;
  description?: string;
  coverUrl?: string;
  logoUrl?: string;
  backgroundColor?: string;
  category?: string;
  active: boolean;
  members?: ProviderProfile[];
  createdAt: string;
}

export interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  provider?: ProviderProfile;
  service?: Service;
  date: string;
  time: string;
  finalPrice: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface BlockedDate {
  id: string;
  providerId: string;
  serviceId?: string;
  startDate: string;
  endDate?: string;
  note?: string;
  type: 'dayoff' | 'vacation';
  createdAt: string;
}

export interface ProviderStats {
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  byService: { id: string; name: string; count: number; revenue: number }[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  sender?: User;
  receiver?: User;
  text: string;
  read: boolean;
  createdAt: string;
}

export const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '⊞' },
  { id: 'reform', label: 'Reformas', icon: '🔨' },
  { id: 'beauty', label: 'Beleza', icon: '✂' },
  { id: 'tech', label: 'Tecnologia', icon: '💻' },
  { id: 'clean', label: 'Limpeza', icon: '🧹' },
  { id: 'health', label: 'Saúde', icon: '🏥' },
  { id: 'edu', label: 'Educação', icon: '📚' },
  { id: 'photo', label: 'Fotografia', icon: '📷' },
  { id: 'design', label: 'Design', icon: '🎨' },
];

export const AVATAR_COLORS: Record<string, string> = {
  CM: 'oklch(0.58 0.18 300)',
  LF: 'oklch(0.58 0.18 220)',
  AP: 'oklch(0.62 0.18 350)',
  RS: 'oklch(0.55 0.18 200)',
  PS: 'oklch(0.60 0.18 160)',
  MO: 'oklch(0.58 0.20 45)',
};

export function getInitialsColor(initials: string): string {
  return AVATAR_COLORS[initials] || 'var(--p)';
}
