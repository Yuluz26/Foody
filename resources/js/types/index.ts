export type Restaurant = {
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
    opensAt: string | null;
    closesAt: string | null;
    isOpen: boolean;
    orderingEnabled: boolean;
    acceptingOrders: boolean;
    dineInEnabled: boolean;
    takeawayEnabled: boolean;
    qrCodeUrl: string | null;
    paymentInstructions: string | null;
};

export type AddOn = {
    id: number;
    name: string;
    price: number;
};

export type MenuProduct = {
    id: number;
    categoryId: number;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    isFeatured: boolean;
    addOns: AddOn[];
};

export type MenuBanner = {
    id: number;
    imageUrl: string;
};

export type MenuCategory = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    products: MenuProduct[];
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderType = 'dine_in' | 'takeaway';

export type PaymentMethod = 'cashier' | 'qr';

export type PaymentStatus = 'unpaid' | 'pending_verification' | 'paid';

export type OrderLine = {
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    addOnsTotal: number;
    lineTotal: number;
    addOns: Array<{ name: string; price: number }>;
};

export type CustomerOrder = {
    publicId: string;
    number: string;
    status: OrderStatus;
    statusLabel: string;
    type: OrderType;
    typeLabel: string;
    tableNumber: string | null;
    customerName: string;
    notes: string | null;
    subtotal: number;
    total: number;
    createdAt: string;
    updatedAt: string;
    items: OrderLine[];
    paymentMethod: PaymentMethod;
    paymentMethodLabel: string;
    paymentStatus: PaymentStatus;
    paymentStatusLabel: string;
    paymentProofUrl: string | null;
};

export type StaffRole = 'admin' | 'staff';

export type AuthUser = {
    id: number;
    name: string;
    email: string;
    role: StaffRole;
};

export type CustomerAuthUser = {
    id: number;
    name: string;
    email: string;
};

export type StatusOption = { value: OrderStatus; label: string };

export type HourlyPoint = { hour: number; count: number };

export type AdminOrderRow = {
    id: number;
    number: string;
    publicId: string;
    customerName: string;
    customerPhone: string;
    type: OrderType;
    typeLabel: string;
    tableNumber: string | null;
    status: OrderStatus;
    statusLabel: string;
    isActive: boolean;
    total: number;
    itemsCount: number;
    createdAt: string;
    nextStatuses: StatusOption[];
    paymentMethod: PaymentMethod;
    paymentMethodLabel: string;
    paymentStatus: PaymentStatus;
    paymentStatusLabel: string;
};

export type AdminProduct = {
    id: number;
    categoryId: number;
    categoryName: string | null;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    isFeatured: boolean;
    sortOrder: number;
    addOns: AddOn[];
};

export type AdminBanner = {
    id: number;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
};

export type AdminCategory = {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    sortOrder: number;
    productsCount: number | null;
};

export type AdminStaff = {
    id: number;
    name: string;
    email: string;
    role: StaffRole;
    roleLabel: string;
    isApproved: boolean;
    createdAt: string;
};

export type Option = { id: number; name: string };

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
};

export type SharedProps = {
    auth: { user: AuthUser | null };
    customerAuth: { user: CustomerAuthUser | null };
    flash: { success: string | null; error: string | null };
    restaurantName: string;
    adminCounts: { activeOrders: number; latestOrderId: number | null; latestCustomerCancelledOrderId: number | null } | null;
};
