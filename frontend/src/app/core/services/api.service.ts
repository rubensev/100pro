import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Post, ProviderProfile, Service, Promo, Booking, Message, Store } from '../../shared/models';

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

  // Providers
  getProviders() { return this.http.get<ProviderProfile[]>(`${API}/providers`); }
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

  // Bookings
  getBookings() { return this.http.get<Booking[]>(`${API}/bookings`); }
  createBooking(data: any) { return this.http.post<Booking>(`${API}/bookings`, data); }

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
  getMyStores() { return this.http.get<Store[]>(`${API}/stores/mine`); }
  getStoresByProvider(providerId: string) { return this.http.get<Store[]>(`${API}/stores/provider/${providerId}`); }
  createStore(data: Partial<Store>) { return this.http.post<Store>(`${API}/stores`, data); }
  updateStore(id: string, data: Partial<Store>) { return this.http.put<Store>(`${API}/stores/${id}`, data); }
  deleteStore(id: string) { return this.http.delete(`${API}/stores/${id}`); }
  uploadStoreCover(id: string, file: File) {
    const fd = new FormData();
    fd.append('cover', file);
    return this.http.post<Store>(`${API}/stores/${id}/cover`, fd);
  }

  // Messages
  getConversations() { return this.http.get<Message[]>(`${API}/messages`); }
  getThread(otherId: string) { return this.http.get<Message[]>(`${API}/messages/${otherId}`); }
  sendMessage(receiverId: string, text: string) { return this.http.post<Message>(`${API}/messages`, { receiverId, text }); }
}
