import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  name: string
  phone?: string
  joinDate: string
  lastLoginDate?: string
  isActive: boolean
  role: "user" | "admin"
}

interface Order {
  id: string
  userId: string
  userName: string
  userEmail: string
  items: {
    productId: number
    productName: string
    quantity: number
    price: number
  }[]
  totalAmount: number
  status: "pending" | "paid" | "shipping" | "delivered" | "cancelled"
  orderDate: string
  deliveryAddress: string
}

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  category: string
  stock: number
  isActive: boolean
  createdDate: string
  sales: number
}

interface DashboardStats {
  totalUsers: number
  newUsersThisMonth: number
  totalRevenue: number
  revenueGrowth: number
  totalOrders: number
  ordersByStatus: {
    pending: number
    paid: number
    shipping: number
    delivered: number
    cancelled: number
  }
  bestSellingProducts: Product[]
  lowStockProducts: Product[]
}

interface AdminStore {
  isAdminLoggedIn: boolean
  adminUser: User | null
  users: User[]
  orders: Order[]
  products: Product[]
  dashboardStats: DashboardStats

  // Admin auth
  adminLogin: (email: string, password: string) => Promise<boolean>
  adminLogout: () => void

  // Dashboard
  updateDashboardStats: () => Promise<void>
  loadInitialData: () => Promise<void>

  // User management
  getUsers: () => User[]
  searchUsers: (query: string) => Promise<User[]>
  updateUserStatus: (userId: string, isActive: boolean) => Promise<void>

  // Product management
  getProducts: () => Product[]
  addProduct: (product: Omit<Product, "id" | "createdDate" | "sales">) => Promise<void>
  updateProduct: (productId: number, updates: Partial<Product>) => Promise<void>
  deleteProduct: (productId: number) => Promise<void>

  // Order management
  getOrders: () => Order[]
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>
}

const apiCall = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  return response.json()
}

export const useAdminStore = create<AdminStore>()
  persist(
    (set, get) => ({
      isAdminLoggedIn: false,
      adminUser: null,
      users: [],
      orders: [],
      products: [],
      dashboardStats: {
        totalUsers: 0,
        newUsersThisMonth: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        totalOrders: 0,
        ordersByStatus: {
          pending: 0,
          paid: 0,
          shipping: 0,
          delivered: 0,
          cancelled: 0,
        },
        bestSellingProducts: [],
        lowStockProducts: [],
      },

      adminLogin: async (email: string, password: string) => {
        try {
          const result = await apiCall("/api/admin/auth", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          })

          if (result.success) {
            set({ isAdminLoggedIn: true, adminUser: result.user })
            await (get() as AdminStore).loadInitialData()
            return true
          }
          return false
        } catch (error) {
          console.error("Admin login error:", error)
          return false
        }
      },

      adminLogout: () => {
        set({ isAdminLoggedIn: false, adminUser: null })
      },

      updateDashboardStats: async () => {
        try {
          const result = await apiCall("/api/admin/dashboard")
          if (result.success) {
            set({ dashboardStats: result.data })
          }
        } catch (error) {
          console.error("Failed to update dashboard stats:", error)
        }
      },

      loadInitialData: async () => {
        try {
          const [dashboardResult, usersResult, productsResult, ordersResult] = await Promise.all([
            apiCall("/api/admin/dashboard"),
            apiCall("/api/admin/users"),
            apiCall("/api/admin/products"),
            apiCall("/api/admin/orders"),
          ])

          set({
            dashboardStats: dashboardResult.data,
            users: usersResult.data,
            products: productsResult.data,
            orders: ordersResult.data,
          })
        } catch (error) {
          console.error("Failed to load initial data:", error)
        }
      },

      getUsers: () => (get() as AdminStore).users,

      searchUsers: async (query: string) => {
        try {
          const result = await apiCall(`/api/admin/users?search=${encodeURIComponent(query)}`)
          return result.success ? result.data : []
        } catch (error) {
          console.error("Failed to search users:", error)
          return []
        }
      },

      updateUserStatus: async (userId: string, isActive: boolean) => {
        try {
          const result = await apiCall("/api/admin/users", {
            method: "PATCH",
            body: JSON.stringify({ userId, isActive }),
          })

          if (result.success) {
            set((state:AdminStore) => ({
              users: state.users.map((user) => (user.id === userId ? { ...user, isActive } : user)),
            }))
          }
        } catch (error) {
          console.error("Failed to update user status:", error)
        }
      },

      getProducts: () => (get() as AdminStore).products,

      addProduct: async (productData: Omit<Product, "id" | "createdDate" | "sales">) => {
        try {
          const result = await apiCall("/api/admin/products", {
            method: "POST",
            body: JSON.stringify(productData),
          })

          if (result.success) {
            set((state : AdminStore) => ({
              products: [...state.products, result.data],
            }))
          }
        } catch (error) {
          console.error("Failed to add product:", error)
        }
      },

      updateProduct: async (productId: number, updates: Partial<Product>) => {
        try {
          const result = await apiCall("/api/admin/products", {
            method: "PUT",
            body: JSON.stringify({ id: productId, ...updates }),
          })

          if (result.success) {
            set((state:AdminStore) => ({
              products: state.products.map((product) =>
                product.id === productId ? { ...product, ...updates } : product,
              ),
            }))
          }
        } catch (error) {
          console.error("Failed to update product:", error)
        }
      },

      deleteProduct: async (productId: number) => {
        try {
          const result = await apiCall(`/api/admin/products?id=${productId}`, {
            method: "DELETE",
          })

          if (result.success) {
            set((state:AdminStore) => ({
              products: state.products.filter((product) => product.id !== productId),
            }))
          }
        } catch (error) {
          console.error("Failed to delete product:", error)
        }
      },

      getOrders: () => (get() as AdminStore).orders,

      updateOrderStatus: async (orderId: string, status: Order["status"]) => {
        try {
          const result = await apiCall("/api/admin/orders", {
            method: "PATCH",
            body: JSON.stringify({ orderId, status }),
          })

          if (result.success) {
            set((state:AdminStore) => ({
              orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
            }))
            get().updateDashboardStats()
          }
        } catch (error) {
          console.error("Failed to update order status:", error)
        }
      },
    }),
    {
      name: "admin-storage",
      partialize: (state:AdminStore) => ({
        isAdminLoggedIn: state.isAdminLoggedIn,
        adminUser: state.adminUser,
        users: state.users,
        orders: state.orders,
        products: state.products,
      }),
    },
  )
