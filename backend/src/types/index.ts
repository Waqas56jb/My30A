export type AppRole = 'GUEST' | 'HOST' | 'PARTNER' | 'ADMIN';

export type AdminRole = 'super_admin' | 'operations' | 'finance' | 'content_manager' | 'support';

export type PermissionArea =
  | 'users'
  | 'hosts'
  | 'partners'
  | 'properties'
  | 'orders'
  | 'payments'
  | 'content'
  | 'analytics'
  | 'settings';

export type PermissionLevel = 'full' | 'edit' | 'view' | 'none';

export type AuthAccount = {
  id: string;
  role: AppRole;
  email: string;
  name: string;
  adminRole?: AdminRole;
  permissions?: Record<PermissionArea, PermissionLevel>;
  propertyId?: string | null;
  stayId?: string | null;
  hostId?: string | null;
  partnerId?: string | null;
};

export type GroceryStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_required'
  | 'paid'
  | 'shopping'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type TransferStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_authorized'
  | 'driver_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';
