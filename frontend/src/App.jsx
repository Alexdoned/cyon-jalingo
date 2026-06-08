import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Leaders from './pages/Leaders';
import Events from './pages/Events';
import Register from './pages/Register';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import { Box } from '@chakra-ui/react';

function App() {
  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.950, blue.950)">
      <Navbar />
      <Box as="main" px={{ base: 4, md: 6 }} pb={12}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaders" element={<Leaders />} />
          <Route path="/events" element={<Events />} />
          <Route path="/register" element={<Register />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
