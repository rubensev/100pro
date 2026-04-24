import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Post, ProviderProfile, Service, Promo, Booking, Message, Store, Review, BlockedDate, ProviderStats } from '../../shared/models';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Posts
  getPosts(category?: string) {
    const params: Record<string, string> = {};
    if (category && category !== 'all') params['category'] = category;
    return this.http.get<Post[]>(`${API}/posts`, { params });
  }
  getMyPosts() { return this.http.get<Post[]>(`${API}/posts/mine`); }
  createPost(data: Partial<Post>) { return this.http.post<Post>(`${API}/posts`, data); }
  uploadPostImage(id: string, file: File) {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<Post>(`${API}/posts/${id}/image`, fd);
  }
  setPostVideo(id: string, videoUrl: string) { return this.http.patch<Post>(`${API}/posts/${id}/video`, { videoUrl }); }
  likePost(id: string) { return this.http.post<Post>(`${API}/posts/${id}/like`, {}); }
  addComment(postId: string, text: string) { return this.http.post<Comment>(`${API}/posts/${postId}/comments`, { text }); }

  // Reviews
  getReviews(providerId: string) { return this.http.get<Review[]>(`${API}/reviews/provider/${providerId}`); }
  createReview(data: { providerId: string; bookingId?: string; rating: number; text?: string }) { return this.http.post<Review>(`${API}/reviews`, data); }

  // Providers
  getProviders(params?: { q?: string; city?: string; minRating?: number }) {
    const p: Record<string, string> = {};
    if (params?.q) p['q'] = params.q;
    if (params?.city) p['city'] = params.city;
    if (params?.minRating) p['minRating'] = String(params.minRating);
    return this.http.get<ProviderProfile[]>(`${API}/providers`, { params: p });
  }
  getMyProfile() { return this.http.get<ProviderProfile>(`${API}/providers/me`); }
  getProviderByUserId(userId: string) { return this.http.get<ProviderProfile>(`${API}/providers/user/${userId}`); }
  getPublicProfile(id: string) { return this.http.get<ProviderProfile>(`${API}/providers/${id}/public`); }
  uploadProviderCover(file: File) {
    const fd = new FormData();
    fd.append('cover', file);
    return this.http.post<{ coverUrl: string }>(`${API}/providers/me/cover`, fd);
  }
  updateMyProfile(data: Partial<ProviderProfile>) { return this.http.put<ProviderProfile>(`${API}/providers/me`, data); }

  // Services
  searchServices(q: string) { return this.http.get<Service[]>(`${API}/services/search`, { params: { q } }); }
  getMyServices() { return this.http.get<Service[]>(`${API}/services/mine`); }
  createService(data: Partial<Service>) { return this.http.post<Service>(`${API}/services`, data); }
  updateService(id: string, data: Partial<Service>) { return this.http.put<Service>(`${API}/services/${id}`, data); }
  deleteService(id: string) { return this.http.delete(`${API}/services/${id}`); }

  // Promos
  getActivePromos() { return this.http.get<Promo[]>(`${API}/promos`); }
  getMyPromos() { return this.http.get<Promo[]>(`${API}/promos/mine`); }
  createPromo(data: Partial<Promo>) { return this.http.post<Promo>(`${API}/promos`, data); }
  updatePromo(id: string, data: Partial<Promo>) { return this.http.put<Promo>(`${API}/promos/${id}`, data); }
  deletePromo(id: string) { return this.http.delete(`${API}/promos/${id}`); }

  // User profile
  getMe() { return this.http.get<any>(`${API}/users/me`); }
  updateMe(data: { name?: string; email?: string }) { return this.http.patch<any>(`${API}/users/me`, data); }
  updatePlan(plan: string) { return this.http.patch<any>(`${API}/users/me/plan`, { plan }); }
  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.post<any>(`${API}/users/me/avatar`, fd);
  }

  // Stores
  searchStores(q: string) { return this.http.get<Store[]>(`${API}/stores/search`, { params: { q } }); }
  getMyStores() { return this.http.get<Store[]>(`${API}/stores/mine`); }
  getStoresByProvider(providerId: string) { return this.http.get<Store[]>(`${API}/stores/provider/${providerId}`); }
  getPublicStore(id: string) { return this.http.get<Store>(`${API}/stores/${id}/public`); }
  createStore(data: Partial<Store>) { return this.http.post<Store>(`${API}/stores`, data); }
  updateStore(id: string, data: Partial<Store>) { return this.http.put<Store>(`${API}/stores/${id}`, data); }
  deleteStore(id: string) { return this.http.delete(`${API}/stores/${id}`); }
  uploadStoreCover(id: string, file: File) {
    const fd = new FormData();
    fd.append('cover', file);
    return this.http.post<Store>(`${API}/stores/${id}/cover`, fd);
  }
  uploadStoreLogo(id: string, file: File) {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http.post<Store>(`${API}/stores/${id}/logo`, fd);
  }
  addStoreMember(storeId: string, providerId: string) { return this.http.post<Store>(`${API}/stores/${storeId}/members`, { providerId }); }
  removeStoreMember(storeId: string, providerId: string) { return this.http.delete<Store>(`${API}/stores/${storeId}/members/${providerId}`); }
  getServicesByStore(storeId: string) { return this.http.get<Service[]>(`${API}/services/store/${storeId}`); }

  // Messages
  getConversations() { return this.http.get<Message[]>(`${API}/messages`); }
  getThread(otherId: string) { return this.http.get<Message[]>(`${API}/messages/${otherId}`); }
  sendMessage(receiverId: string, text: string) { return this.http.post<Message>(`${API}/messages`, { receiverId, text }); }
  getUnreadCount() { return this.http.get<{ count: number }>(`${API}/messages/unread-count`); }
  markThreadRead(otherId: string) { return this.http.patch(`${API}/messages/${otherId}/read`, {}); }

  // Blocked dates / vacation
  getBlockedDates() { return this.http.get<BlockedDate[]>(`${API}/blocked-dates`); }
  createBlockedDate(data: Partial<BlockedDate>) { return this.http.post<BlockedDate>(`${API}/blocked-dates`, data); }
  deleteBlockedDate(id: string) { return this.http.delete(`${API}/blocked-dates/${id}`); }

  // Provider stats
  getProviderStats() { return this.http.get<ProviderStats>(`${API}/bookings/provider-stats`); }
  createManualBooking(data: any) { return this.http.post<Booking>(`${API}/bookings/manual`, data); }

  // Bookings
  getBookings() { return this.http.get<Booking[]>(`${API}/bookings`); }
  getIncomingBookings() { return this.http.get<any[]>(`${API}/bookings/incoming`); }
  getUpcomingCount() { return this.http.get<{ count: number }>(`${API}/bookings/upcoming-count`); }
  getIncomingCount() { return this.http.get<{ count: number }>(`${API}/bookings/incoming-count`); }
  getBookedSlots(providerId: string, date: string) { return this.http.get<{ slots: string[] }>(`${API}/bookings/booked-slots`, { params: { providerId, date } }); }
  createBooking(data: any) { return this.http.post<Booking>(`${API}/bookings`, data); }
  cancelBooking(id: string) { return this.http.patch<Booking>(`${API}/bookings/${id}/cancel`, {}); }
}
