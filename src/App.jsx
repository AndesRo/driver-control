import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SubscriptionBlocked from './pages/SubscriptionBlocked';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Report from './components/Report';
import Extras from './components/Extras';
import AdminUsers from './components/AdminUsers';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ... rutas públicas ... */}
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="app-container">
                <Routes>
                  {/* rutas normales protegidas por suscripción */}
                  <Route path="/" element={<OrderForm />} />
                  <Route path="/ordenes" element={<OrderList />} />
                  <Route path="/extras" element={<Extras />} />
                  <Route path="/reporte" element={<Report />} />
                  {/* ruta de administración con AdminRoute */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } />
                </Routes>
                <Navbar />
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
