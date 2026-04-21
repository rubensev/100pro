import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Post, ProviderProfile, Service, Promo, Booking, Message } from '../../shared/models';

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
  createPost(data: Partial<Post>) { return this.http.post<Post>(`${API}/posts`, data); }
  likePost(id: string) { return this.http.post<Post>(`${API}/posts/${id}/like`, {}); }
  addComment(postId: string, text: string) { return this.http.post(`${API}/posts/${postId}/comments`, { text }); }

  // Providers
  getProviders() { return this.http.get<ProviderProfile[]>(`${API}/providers`); }
  getMyProfile() { return this.http.get<ProviderProfile>(`${API}/providers/me`); }
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

  // Messages
  getConversations() { return this.http.get<Message[]>(`${API}/messages`); }
  getThread(otherId: string) { return this.http.get<Message[]>(`${API}/messages/${otherId}`); }
  sendMessage(receiverId: string, text: string) { return this.http.post<Message>(`${API}/messages`, { receiverId, text }); }
}
