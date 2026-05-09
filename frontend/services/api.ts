/**
 * API Service - Centralized API calls
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const resolveApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const webFallbackUrl = 'http://localhost:8000/api/v1';
  const mobileFallbackUrl = 'http://172.20.10.4:8000/api/v1';

  const isPrivateIpUrl = (url: string) =>
    /https?:\/\/(10\.|127\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(url);

  const resolved =
    Platform.OS === 'web'
      ? envUrl && !isPrivateIpUrl(envUrl)
        ? envUrl
        : webFallbackUrl
      : envUrl || mobileFallbackUrl;

  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved;
};

const API_URL = resolveApiUrl();

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    // Request interceptor
    this.api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token invalid/expired - logout
          AsyncStorage.removeItem('userToken');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', {
      username: email,
      password,
    });
    return response.data;
  }

  async register(username: string, email: string, password: string) {
    const response = await this.api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Recipe Endpoints
  async getRecipes(
    category?: string,
    difficulty?: string,
    skip: number = 0,
    limit: number = 10
  ) {
    const params: any = { skip, limit };
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;

    const response = await this.api.get('/recipes', { params });
    return response.data;
  }

  async searchRecipes(query: string) {
    const response = await this.api.get('/recipes/search', {
      params: { q: query },
    });
    return response.data;
  }

  async getRecipe(id: number) {
    const response = await this.api.get(`/recipes/${id}`);
    return response.data;
  }

  async getRecipeCategories() {
    const response = await this.api.get('/recipes/categories');
    return response.data;
  }

  // Favorite Endpoints
  async getFavorites() {
    const response = await this.api.get('/favorites');
    return response.data;
  }

  async addFavorite(recipeId: number) {
    const response = await this.api.post('/favorites', {
      recipe_id: recipeId,
    });
    return response.data;
  }

  async removeFavorite(recipeId: number) {
    const response = await this.api.delete(`/favorites/${recipeId}`);
    return response.status === 204;
  }

  async isFavorite(recipeId: number) {
    const response = await this.api.get(`/favorites/${recipeId}`);
    return response.data;
  }

  // Shopping List Endpoints
  async getShoppingItems(onlyUnchecked: boolean = false) {
    const response = await this.api.get('/shopping', {
      params: { only_unchecked: onlyUnchecked },
    });
    return response.data;
  }

  async addShoppingItem(
    itemName: string,
    amount?: number,
    unit?: string,
    recipeId?: number,
    category?: string
  ) {
    const response = await this.api.post('/shopping', {
      item_name: itemName,
      amount,
      unit,
      recipe_id: recipeId,
      category: category || 'Diğer',
    });
    return response.data;
  }

  async updateShoppingItem(id: number, data: any) {
    const response = await this.api.put(`/shopping/${id}`, data);
    return response.data;
  }

  async deleteShoppingItem(id: number) {
    const response = await this.api.delete(`/shopping/${id}`);
    return response.status === 204;
  }

  async clearCheckedShoppingItems() {
    const response = await this.api.delete('/shopping');
    return response.status === 204;
  }

  // History Endpoints
  async getHistory() {
    const response = await this.api.get('/history');
    return response.data;
  }

  async addToHistory(recipeId: number) {
    const response = await this.api.post('/history', {
      recipe_id: recipeId,
    });
    return response.data;
  }

  async removeFromHistory(recipeId: number) {
    const response = await this.api.delete(`/history/${recipeId}`);
    return response.status === 204;
  }

  async clearHistory() {
    const response = await this.api.delete('/history');
    return response.status === 204;
  }

  // Rating Endpoints
  async getRatings(recipeId: number) {
    const response = await this.api.get(`/recipes/${recipeId}/ratings`);
    return response.data;
  }

  async getRatingStats(recipeId: number) {
    const response = await this.api.get(`/recipes/${recipeId}/ratings/stats`);
    return response.data;
  }

  async createRating(recipeId: number, rating: number, review?: string) {
    const response = await this.api.post(`/recipes/${recipeId}/ratings`, {
      rating,
      review,
    });
    return response.data;
  }

  async updateRating(recipeId: number, rating: number, review?: string) {
    const response = await this.api.put(`/recipes/${recipeId}/ratings`, {
      rating,
      review,
    });
    return response.data;
  }

  async deleteRating(recipeId: number) {
    const response = await this.api.delete(`/recipes/${recipeId}/ratings`);
    return response.status === 204;
  }

  // Weekly Menu Endpoints
  async getWeeklyMenu(weekStartDate: string) {
    const response = await this.api.get(`/weekly-menu/${weekStartDate}`);
    return response.data;
  }

  async getCurrentWeeklyMenu() {
    const response = await this.api.get('/weekly-menu/current');
    return response.data;
  }

  async createWeeklyMenu(
    weekStartDate: string,
    menuData: {
      monday_recipe_id?: number;
      tuesday_recipe_id?: number;
      wednesday_recipe_id?: number;
      thursday_recipe_id?: number;
      friday_recipe_id?: number;
      saturday_recipe_id?: number;
      sunday_recipe_id?: number;
      menu_data?: any[];
    }
  ) {
    const response = await this.api.post('/weekly-menu', {
      week_start_date: weekStartDate,
      ...menuData,
    });
    return response.data;
  }

  async updateWeeklyMenu(weekStartDate: string, menuData: any) {
    const response = await this.api.put(`/weekly-menu/${weekStartDate}`, menuData);
    return response.data;
  }

  async deleteWeeklyMenu(weekStartDate: string) {
    const response = await this.api.delete(`/weekly-menu/${weekStartDate}`);
    return response.status === 204;
  }

  // User Endpoints
  async getProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async updateProfile(username?: string, bio?: string, profileImageUrl?: string) {
    const updateData: any = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImageUrl) updateData.profile_image_url = profileImageUrl;

    const response = await this.api.put('/users/profile', updateData);
    return response.data;
  }

  async changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
    const response = await this.api.post('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  }

  async deleteAccount() {
    const response = await this.api.delete('/users/account');
    return response.data;
  }

  async registerPushToken(expoPushToken: string, platform?: string) {
    await this.api.post('/users/push-token', {
      expo_push_token: expoPushToken,
      platform,
    });
  }

  async sendSelfPushNotification(title: string, body: string, recipeId?: number) {
    const response = await this.api.post('/notifications/push', {
      title,
      body,
      recipe_id: recipeId,
    });
    return response.data;
  }

  async sendTimerCompletePush(recipeName: string, recipeId?: number) {
    const response = await this.api.post('/notifications/timer-complete', {
      recipe_name: recipeName,
      recipe_id: recipeId,
    });
    return response.data;
  }

  async getSuggestedRecipes(limit: number = 4): Promise<any[]> {
    try {
      // Get recipes from backend for variety
      const allRecipes = await this.getRecipes(undefined, undefined, 0, 100).catch(() => []);
      const recipeArray = Array.isArray(allRecipes) ? allRecipes : [];

      if (recipeArray.length === 0) return [];

      // Shuffle and select diverse recipes
      const shuffled = recipeArray.sort(() => Math.random() - 0.5);
      const suggested = shuffled.slice(0, limit);

      console.log(`✨ ${suggested.length} çeşitli tarif önerisi yüklendi:`, suggested.map(r => r.name));
      return suggested;
    } catch (error) {
      console.error('Öneriler yüklenirken hata:', error);
      return [];
    }
  }
}

export const apiService = new ApiService();
