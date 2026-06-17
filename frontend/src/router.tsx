import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientListPage from './pages/ClientListPage'
import ClientFormPage from './pages/ClientFormPage'
import OrderListPage from './pages/OrderListPage'
import OrderFormPage from './pages/OrderFormPage'
import OrderDetailPage from './pages/OrderDetailPage'
import PipelinePage from './pages/PipelinePage'
import SchedulePage from './pages/SchedulePage'
import ReportsPage from './pages/ReportsPage'

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientListPage />} />
          <Route path="clients/new" element={<ClientFormPage />} />
          <Route path="clients/:id/edit" element={<ClientFormPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/new" element={<OrderFormPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/:id/edit" element={<OrderFormPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}