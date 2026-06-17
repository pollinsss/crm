import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  GitBranch,
  Calendar,
  FileBarChart,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/clients', label: 'Клиенты', icon: Users },
  { to: '/orders', label: 'Заказы', icon: ShoppingCart },
  { to: '/pipeline', label: 'Воронка', icon: GitBranch },
  { to: '/schedule', label: 'События', icon: Calendar },
  { to: '/reports', label: 'Отчёты', icon: FileBarChart },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold tracking-wide">МебельCRM</h1>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-600">
              {user?.full_name ?? 'Пользователь'}
            </span>
            <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
              {user?.role === 'admin'
                ? 'Админ'
                : user?.role === 'manager'
                  ? 'Менеджер'
                  : user?.role === 'designer'
                    ? 'Дизайнер'
                    : 'Производство'}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-danger transition-colors"
            >
              <LogOut size={16} />
              Выйти
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}