export type Role = "admin" | "seller" | "user";

export type SellerStatus = "none" | "pending" | "approved" | "rejected";

export type ProductStatus = "pending" | "active" | "rejected";

export type OrderStatus =
  | "pending_seller"
  | "accepted"
  | "in_delivery"
  | "completed"
  | "cancelled";

export type AdSlot = "premium" | "right-banner" | "partner-slot";

export type AdStatus = "pending" | "active" | "rejected";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";

export type SupportStatus = "open" | "answered" | "closed";

export type AppUser = {
  id: string;
  uid?: string;
  email?: string | null;
  name?: string;
  role?: Role;
  sellerStatus?: SellerStatus;
  banned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type Product = {
  id: string;
  title?: string;
  price?: number;
  category?: string;
  description?: string;
  status?: ProductStatus;
  seller?: string | null;
  sellerId?: string;

  /**
   * Yeni sistem:
   * Firebase Storage download URL veya harici görsel URL'si.
   */
  imageUrl?: string;

  /**
   * Eski sistem:
   * Firestore 1 MB limitine takıldığı için artık yeni kayıtlarda kullanılmamalı.
   * Eski ilanlar bozulmasın diye geçici destek bırakıldı.
   */
  imageBase64?: string;

  createdAt?: string;
  updatedAt?: string;
};

export type Order = {
  id: string;
  productId?: string;
  productTitle?: string;
  amount?: number;
  buyerId?: string;
  buyerEmail?: string | null;
  sellerId?: string;
  sellerEmail?: string | null;
  status?: OrderStatus;
  chatId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdItem = {
  id: string;
  brand?: string;
  title?: string;
  slot?: AdSlot;
  link?: string;
  status?: AdStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationItem = {
  id: string;
  userId?: string;
  title?: string;
  message?: string;
  read?: boolean;
  type?: string;
  createdAt?: string;
  readAt?: string;
};

export type Chat = {
  id: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
  buyerId?: string;
  buyerEmail?: string | null;
  sellerId?: string;
  sellerEmail?: string | null;
  participants?: string[];
  lastMessage?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type ChatMessage = {
  id: string;
  chatId?: string;
  senderId?: string;
  senderEmail?: string | null;
  text?: string;
  system?: boolean;
  createdAt?: string;
};

export type SupportTicket = {
  id: string;
  userId?: string;
  email?: string | null;
  subject?: string;
  message?: string;
  status?: SupportStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type SupportMessage = {
  id: string;
  ticketId?: string;
  senderId?: string;
  senderEmail?: string | null;
  text?: string;
  createdAt?: string;
};

export type Report = {
  id: string;
  reporterId?: string;
  reporterEmail?: string | null;
  targetType?: "product" | "user" | "chat" | "order" | "general";
  targetId?: string;
  reason?: string;
  details?: string;
  status?: ReportStatus;
  createdAt?: string;
  updatedAt?: string;
};
