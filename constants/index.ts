export const ROLES = { ADMIN: 'admin', SELLER: 'seller', USER: 'user' } as const;
export const PRODUCT_STATUS = { PENDING: 'pending', ACTIVE: 'active', REJECTED: 'rejected' } as const;
export const ORDER_STATUS = {
  PENDING_SELLER: 'pending_seller',
  ACCEPTED: 'accepted',
  IN_DELIVERY: 'in_delivery',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export const AD_STATUS = { PENDING: 'pending', ACTIVE: 'active', REJECTED: 'rejected' } as const;
export const SELLER_STATUS = { NONE: 'none', PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' } as const;
export const REPORT_STATUS = { PENDING: 'pending', REVIEWED: 'reviewed', RESOLVED: 'resolved', REJECTED: 'rejected' } as const;
export const SUPPORT_STATUS = { OPEN: 'open', ANSWERED: 'answered', CLOSED: 'closed' } as const;
export const CATEGORIES = ['TÜMÜ','DONANIMLAR','PC KASA','FARE','KLAVYE','KULAKLIK','OYUNCU MOBİLYALARI','KOLTUKLAR','MONSTER SERİSİ','METİN2 MARKET','VALORANT VP'] as const;
export const ROUTES = { HOME:'/', LOGIN:'/login', REGISTER:'/register', PROFILE:'/profile', SELLER:'/seller', ADMIN:'/admin', CREATE:'/create', MY_ORDERS:'/my-orders', MESSAGES:'/messages', SUPPORT:'/support', REPORT:'/report' } as const;
