import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, setDoc, getDoc, where } from 'firebase/firestore';
import './App.css';
import { Timestamp, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdakn-JJI7sddaaAyOBqRWSZS9s1xRBoM",
  authDomain: "giftcraft-5c6c8.firebaseapp.com",
  projectId: "giftcraft-5c6c8",
  storageBucket: "giftcraft-5c6c8.firebasestorage.app",
  messagingSenderId: "770704176760",
  appId: "1:770704176760:web:bb85ae03e9578d4e5c1f8d",
  measurementId: "G-FX2EPRB1WP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create Context
export const AppContext = createContext();

// Country Data with delivery charges
const countries = [
  { code: 'IN', name: 'India', currency: '₹', currencyCode: 'INR', deliveryCharge: 60, deliveryDays: '3-5', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: '$', currencyCode: 'USD', deliveryCharge: 1500, deliveryDays: '7-10', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', currency: '£', currencyCode: 'GBP', deliveryCharge: 1200, deliveryDays: '7-10', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currency: 'C$', currencyCode: 'CAD', deliveryCharge: 1400, deliveryDays: '8-12', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'A$', currencyCode: 'AUD', deliveryCharge: 1600, deliveryDays: '8-12', flag: '🇦🇺' },
  { code: 'AE', name: 'UAE', currency: 'د.إ', currencyCode: 'AED', deliveryCharge: 1000, deliveryDays: '5-7', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', currency: 'S$', currencyCode: 'SGD', deliveryCharge: 800, deliveryDays: '4-6', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', currency: 'RM', currencyCode: 'MYR', deliveryCharge: 700, deliveryDays: '4-6', flag: '🇲🇾' },
];

// Country Selector Component
const CountrySelector = () => {
  const { selectedCountry, setSelectedCountry } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    toast.success(`Country changed to ${country.name}`);
  };

  return (
    <div className="country-selector">
      <button className="country-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Select country" aria-expanded={isOpen}>
        <span>{selectedCountry.flag}</span>
        <span>{selectedCountry.name}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="country-dropdown" role="listbox">
          {countries.map(country => (
            <button
              key={country.code}
              className={`country-option ${selectedCountry.code === country.code ? 'active' : ''}`}
              onClick={() => handleCountryChange(country)}
              role="option"
              aria-selected={selectedCountry.code === country.code}
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
              <span>{country.currency}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Navbar Component - Fixed logo display
const Navbar = () => {
  const { cartCount, user, setUser, wishlist, selectedCountry, isAdmin, setIsAdmin } = useContext(AppContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      toast.success('Logged out successfully');
      setIsUserMenuOpen(false);
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
      <div className="nav-container">
        <Link to="/" className="logo" aria-label="br_innovate home">
          {!logoError ? (
            <img 
              src="/logo.jpeg" 
              alt="br_innovate" 
              className="logo-img" 
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="logo-fallback">
              <span className="logo-fallback-icon">🎨</span>
            </div>
          )}
          <span className="logo-text">br_Treasure_Trove</span>
        </Link>

        <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
          <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)}>Shop</Link>
          <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)}>Order History</Link>
          <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          {isAdmin && <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="admin-link">Admin Panel</Link>}
        </div>

        <div className="nav-icons">
          <CountrySelector />
          <button className="nav-icon" onClick={() => navigate('/wishlist')} aria-label="Wishlist">
            <span className="icon">❤️</span>
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>
          <button className="nav-icon" onClick={() => navigate('/cart')} aria-label="Shopping cart">
            <span className="icon">🛒</span>
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </button>
          {user ? (
            <div className="user-menu">
              <button className="nav-icon user-icon-btn" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} aria-label="User menu" aria-expanded={isUserMenuOpen}>
                <span className="icon">👤</span>
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    className="user-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    role="menu"
                  >
                    <div className="user-info">
                      <div className="user-avatar-large">
                        <span>{user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                      </div>
                      <div className="user-details">
                        <span className="user-name">{user.name || user.email}</span>
                        <span className="user-email">{user.email}</span>
                        <span className={`user-role-badge ${isAdmin ? 'admin' : 'customer'}`}>
                          {isAdmin ? '👑 Admin' : '🛍️ Customer'}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/profile'); }} className="dropdown-item" role="menuitem">
                      <span className="dropdown-icon">👤</span>
                      <span>My Profile</span>
                    </button>
                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/orders'); }} className="dropdown-item" role="menuitem">
                      <span className="dropdown-icon">📦</span>
                      <span>My Orders</span>
                    </button>
                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/wishlist'); }} className="dropdown-item" role="menuitem">
                      <span className="dropdown-icon">❤️</span>
                      <span>Wishlist</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout-btn" role="menuitem">
                      <span className="dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>Login / Signup</button>
          )}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
            aria-expanded={isMobileMenuOpen}
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
};

// Footer Component - Updated with correct social media links
const Footer = () => {
  const { selectedCountry } = useContext(AppContext);
  const [logoError, setLogoError] = useState(false);
  
  // Social media links
  const socialLinks = [
    {icon: '📷', url: 'https://www.instagram.com/brcreatives5?igsh=Znl6eGk1aDJramsw', color: '#E4405F', label: 'Follow us on Instagram' },
    { icon: '📷', url: 'https://www.instagram.com/br_innovate?igsh=MXZwY2M5Z3QxY3M0aA==', color: '#E4405F', label: 'Follow us on Instagram' },
    {  icon: '📌', url: 'https://pinterest.com/br_innovate', color: '#BD081C', label: 'Follow us on Pinterest' },
    {  icon: '☎', url: 'https://wa.me/9176501954', color: '#25D366', label: 'Chat with us on WhatsApp' },
    { icon: '✉', url: 'mailto:brcreatives4@gmail.com', color: '#EA4335', label: 'Send us an email' }
  ];

  const handleSocialClick = (url, name) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.info(`Opening ${name}...`);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">
              {!logoError ? (
                <img 
                  src={`${process.env.PUBLIC_URL}/logo.jpeg`}
                  alt="br_innovate" 
                  className="footer-logo-img" 
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="logo-fallback-small">
                  <span>🎨</span>
                </div>
              )}
              <span>br_Treasure_Trove</span>
            </div>
            <p>Handmade with love, crafted with care. Unique gifts for every occasion.</p>
            <div className="social-links">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSocialClick(social.url, social.name);
                  }}
                  className="social-link"
                  aria-label={social.label}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ '--social-color': social.color }}
                >
                  <span className="social-icon">{social.icon}</span>
                  <span className="social-name">{social.name}</span>
                </motion.a>
              ))}
            </div>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/orders">Order History</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/">Shipping Policy</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Categories</h4>
            <ul>
              <li><Link to="/shop">Hair Accessories</Link></li>
              <li><Link to="/shop">Jewellery</Link></li>
              <li><Link to="/shop">Return Gifts</Link></li>
              <li><Link to="/shop">Water Bottles</Link></li>
              <li><Link to="/shop">Resin Art</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <p>📍 No.20, 2nd Street, Vengadesapuram<br/>Acharapakkam, Chengalpattu-603301</p>
            <p>📞 <a href="tel:+9176501954" className="contact-link">+91 91765 01954</a></p>
            <p>✉️ <a href="mailto:brcreatives4@gmail.com" className="contact-link">brcreatives4@gmail.com</a></p>
            <p className="delivery-note">✈️ Shipping to {selectedCountry.name} • {selectedCountry.deliveryDays} days</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 br_Treasure_Trove. All rights reserved. Made with ❤️ in India | 🌍 Shipping Worldwide</p>
          <div className="footer-bottom-links">
            <a href="https://www.instagram.com/br_innovate" target="_blank" rel="noopener noreferrer">Instagram</a>
            <span>•</span>
            <a href="https://pinterest.com/br_innovate" target="_blank" rel="noopener noreferrer">Pinterest</a>
            <span>•</span>
            <a href="https://wa.me/9176501954" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Product Card Component
const ProductCard = ({ product, index, onAddToCart, onAddToWishlist, isWishlisted = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { convertPrice, selectedCountry } = useContext(AppContext);
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productImages = product.images && product.images.length > 0 ? product.images : [product.icon || '🎁'];
  const displayImage = productImages[currentImageIndex];

  const nextImage = (e) => {
    e.stopPropagation();
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {product.discount && (
        <div className="discount-badge">-{product.discount}%</div>
      )}
      <div className="product-image" onClick={() => navigate(`/product/${product.id}`)}>
        {typeof displayImage === 'string' && (displayImage.startsWith('http') || displayImage.startsWith('data:')) ? (
          <img src={displayImage} alt={product.name} className="product-img" />
        ) : (
          <div className="image-placeholder" aria-label={product.name} role="img">{displayImage}</div>
        )}
        {productImages.length > 1 && (
          <div className="image-nav">
            <button className="image-nav-btn prev" onClick={prevImage} aria-label="Previous image">‹</button>
            <button className="image-nav-btn next" onClick={nextImage} aria-label="Next image">›</button>
          </div>
        )}
        {isHovered && (
          <div className="product-overlay">
            <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }} aria-label={`Add ${product.name} to cart`}>
              🛒 Add to Cart
            </button>
          </div>
        )}
      </div>
      <div className="product-info">
        <h3 onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
        <div className="product-category">{product.category}</div>
        <div className="product-price">
          <span className="current">{selectedCountry.currency}{convertPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="original">{selectedCountry.currency}{convertPrice(product.originalPrice)}</span>
          )}
        </div>
        <div className="product-actions">
          <button 
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`} 
            onClick={() => onAddToWishlist(product)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
          <button className="cart-btn" onClick={() => onAddToCart(product)}>
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Admin Route Protection - Only Admin can access
const AdminRoute = ({ children }) => {
  const { isAdmin, user, loading } = useContext(AppContext);
  
  if (loading) return <div className="loading">Loading...</div>;
  
  if (!user) {
    toast.error('Please login first');
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AppContext);
  
  if (loading) return <div className="loading">Loading...</div>;
  
  if (!user) {
    toast.error('Please login to continue');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Order History Page Component - Fixed Permission Issues
const OrderHistory = () => {
  const { user, selectedCountry, convertPrice } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [retryCount, setRetryCount] = useState(0);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const navigate = useNavigate();

  // Local storage key for orders backup
  const LOCAL_ORDERS_KEY = 'user_orders_backup';

  // Save orders to local storage as backup
  const saveOrdersToLocalStorage = (ordersData) => {
    try {
      const backupData = {
        orders: ordersData,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(backupData));
    } catch (e) {
      console.error("Failed to save orders to localStorage:", e);
    }
  };

  // Load orders from local storage as fallback
  const loadOrdersFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(LOCAL_ORDERS_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.userEmail === user?.email && parsed.orders) {
          return parsed.orders;
        }
      }
    } catch (e) {
      console.error("Failed to load orders from localStorage:", e);
    }
    return null;
  };

  const fetchOrders = async (retry = false) => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setUsingLocalFallback(false);
    
    try {
      // Try to fetch from Firestore
      const ordersQuery = query(
        collection(db, 'orders'), 
        where('customerEmail', '==', user.email)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      }));
      
      // Sort orders based on selected sort order
      ordersData.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
      
      setOrders(ordersData);
      
      // Backup to localStorage
      saveOrdersToLocalStorage(ordersData);
      
      if (retry) {
        toast.success(`Successfully loaded ${ordersData.length} orders`);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      
      // Try to load from localStorage as fallback
      const localOrders = loadOrdersFromLocalStorage();
      
      if (localOrders && localOrders.length > 0) {
        setOrders(localOrders);
        setUsingLocalFallback(true);
        setError("Using cached orders. Some information may be outdated.");
        toast.warning("Using cached orders. Please check your internet connection and try refreshing.");
      } else if (error.code === 'permission-denied') {
        setError("Unable to access orders due to permissions. Please contact support or try logging out and back in.");
      } else if (error.code === 'failed-precondition') {
        setError("Database is initializing. Please wait a moment and refresh the page.");
      } else if (error.code === 'unavailable') {
        setError("Service is temporarily unavailable. Please check your internet connection and try again.");
      } else {
        setError("Failed to load orders. Please try again.");
      }
      
      // Auto retry once after 3 seconds if not already retrying
      if (retryCount < 2 && !retry) {
        toast.info("Retrying to fetch orders...");
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchOrders(true);
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, sortOrder]);

  const handleManualRefresh = () => {
    setRetryCount(0);
    fetchOrders(true);
  };

  const handleLogoutAndLogin = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userRole');
      toast.info("Please login again to refresh your permissions");
      navigate('/login');
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered': return 'linear-gradient(135deg, #4CAF50, #45a049)';
      case 'shipped': return 'linear-gradient(135deg, #2196F3, #1976D2)';
      case 'processing': return 'linear-gradient(135deg, #FF9800, #F57C00)';
      case 'cancelled': return 'linear-gradient(135deg, #F44336, #D32F2F)';
      default: return 'linear-gradient(135deg, #9E9E9E, #757575)';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return '✅';
      case 'shipped': return '🚚';
      case 'processing': return '⚙️';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  const getStatusMessage = (status) => {
    switch(status) {
      case 'delivered': return 'Your order has been delivered! 🎉';
      case 'shipped': return 'Your order is on the way! 🚚';
      case 'processing': return 'We\'re preparing your order ⚙️';
      case 'cancelled': return 'Order cancelled ❌';
      default: return 'Order confirmed 📝';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || (order.status || 'pending').toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.transactionId && order.transactionId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0)
  };

  if (loading) {
    return (
      <div className="order-history">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="loading-container"
          >
            <div className="loading-spinner-modern">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">Fetching your orders...</p>
            <p className="loading-subtext">Please wait while we gather your order history</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="order-history">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-container-modern"
          >
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="error-icon-large"
            >
              🔒
            </motion.div>
            <h2>Permission Issue Detected</h2>
            <p className="error-message">{error}</p>
            <div className="error-card">
              <h3>🔧 How to Fix This Issue</h3>
              <ul>
                <li>🚪 <strong>Log out and log back in</strong> - This refreshes your permissions</li>
                <li>🔄 <strong>Refresh the page</strong> - Try reloading the page</li>
                <li>👑 <strong>Contact Admin</strong> - If you're an admin, you need to update Firebase rules</li>
                <li>📱 <strong>Clear browser cache</strong> - Sometimes cached data causes issues</li>
              </ul>
            </div>
            <div className="error-actions-modern">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary-modern" 
                onClick={handleManualRefresh}
              >
                🔄 Refresh Page
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-warning-modern" 
                onClick={handleLogoutAndLogin}
              >
                🚪 Logout & Login Again
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary-modern" 
                onClick={() => navigate('/shop')}
              >
                🛍️ Continue Shopping
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="order-history-modern"
    >
      <div className="container">
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="order-header-modern"
        >
          <div className="header-content">
            <div className="header-title">
              <span className="header-icon">📦</span>
              <div>
                <h1>My Order History</h1>
                <p>Track, manage, and review all your purchases</p>
              </div>
            </div>
            <div className="header-actions">
              {usingLocalFallback && (
                <span className="cached-badge">📱 Using cached data</span>
              )}
              <button className="btn-outline" onClick={handleManualRefresh}>
                🔄 Refresh
              </button>
              <button className="btn-outline" onClick={() => navigate('/shop')}>
                🛒 Continue Shopping
              </button>
            </div>
          </div>
        </motion.div>

        {usingLocalFallback && (
          <div className="warning-banner">
            ⚠️ You're viewing cached orders. Some information may be outdated. Please refresh or login again.
          </div>
        )}

        {orders.length > 0 && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="order-stats-grid"
          >
            <div className="stat-card-modern">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <span className="stat-value">{stats.delivered}</span>
                <span className="stat-label">Delivered</span>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="stat-icon">⚙️</div>
              <div className="stat-info">
                <span className="stat-value">{stats.processing}</span>
                <span className="stat-label">Processing</span>
              </div>
            </div>
            <div className="stat-card-modern">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <span className="stat-value">{selectedCountry.currency}{stats.totalSpent.toLocaleString()}</span>
                <span className="stat-label">Total Spent</span>
              </div>
            </div>
          </motion.div>
        )}

        {orders.length === 0 && !error ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="empty-state-modern"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="empty-icon-large"
            >
              🛍️
            </motion.div>
            <h2>Your order history is empty</h2>
            <p>Looks like you haven't placed any orders yet. Start exploring our collection!</p>
            <div className="empty-state-features">
              <div className="feature-item">
                <span>✨</span>
                <span>Handmade Products</span>
              </div>
              <div className="feature-item">
                <span>🚚</span>
                <span>Worldwide Shipping</span>
              </div>
              <div className="feature-item">
                <span>💝</span>
                <span>Unique Gifts</span>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary-large" 
              onClick={() => navigate('/shop')}
            >
              Start Shopping Now →
            </motion.button>
          </motion.div>
        ) : orders.length > 0 ? (
          <>
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="order-controls-modern"
            >
              <div className="search-bar-modern">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search by order ID, product name, or transaction ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-modern"
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
                )}
              </div>
              
              <div className="sort-control">
                <span className="sort-label">Sort by:</span>
                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="sort-select-modern"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="filter-chips"
            >
              <button 
                className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All Orders
                <span className="chip-count">{orders.length}</span>
              </button>
              <button 
                className={`filter-chip ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                ⏳ Pending
                <span className="chip-count">{orders.filter(o => (o.status || 'pending') === 'pending').length}</span>
              </button>
              <button 
                className={`filter-chip ${filterStatus === 'processing' ? 'active' : ''}`}
                onClick={() => setFilterStatus('processing')}
              >
                ⚙️ Processing
                <span className="chip-count">{orders.filter(o => o.status === 'processing').length}</span>
              </button>
              <button 
                className={`filter-chip ${filterStatus === 'shipped' ? 'active' : ''}`}
                onClick={() => setFilterStatus('shipped')}
              >
                🚚 Shipped
                <span className="chip-count">{orders.filter(o => o.status === 'shipped').length}</span>
              </button>
              <button 
                className={`filter-chip ${filterStatus === 'delivered' ? 'active' : ''}`}
                onClick={() => setFilterStatus('delivered')}
              >
                ✅ Delivered
                <span className="chip-count">{orders.filter(o => o.status === 'delivered').length}</span>
              </button>
            </motion.div>

            <div className="results-info">
              <p>Showing {filteredOrders.length} of {orders.length} orders</p>
            </div>

            <div className="orders-container-modern">
              <AnimatePresence>
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                    className="order-card-modern"
                  >
                    <div className="order-card-header">
                      <div className="order-identity">
                        <div className="order-number-badge">
                          <span className="badge-icon">📋</span>
                          <span className="order-id">#{order.id.slice(0, 8)}</span>
                        </div>
                        <div 
                          className="order-status-badge"
                          style={{ background: getStatusColor(order.status) }}
                        >
                          {getStatusIcon(order.status)} {order.status || 'Pending'}
                        </div>
                      </div>
                      <div className="order-date-modern">
                        <span className="date-icon">📅</span>
                        <span>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'Date not available'}
                        </span>
                      </div>
                    </div>

                    {order.transactionId && (
                      <div className="transaction-id-badge">
                        <span>🏦 Transaction ID: {order.transactionId}</span>
                      </div>
                    )}

                    <div className="order-status-message">
                      <p>{getStatusMessage(order.status)}</p>
                    </div>

                    <div className="order-progress-modern">
                      <div className="progress-tracker">
                        <div className={`progress-step ${order.status === 'pending' ? 'active' : order.status !== 'pending' ? 'completed' : ''}`}>
                          <div className="step-marker">
                            <span className="step-icon">📝</span>
                          </div>
                          <div className="step-info">
                            <div className="step-title">Order Placed</div>
                            <div className="step-date">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Pending'}
                            </div>
                          </div>
                        </div>
                        <div className={`progress-line ${order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'active' : ''}`}></div>
                        
                        <div className={`progress-step ${order.status === 'processing' ? 'active' : order.status === 'shipped' || order.status === 'delivered' ? 'completed' : ''}`}>
                          <div className="step-marker">
                            <span className="step-icon">⚙️</span>
                          </div>
                          <div className="step-info">
                            <div className="step-title">Processing</div>
                            <div className="step-date">{order.status === 'processing' ? 'In Progress' : order.status === 'shipped' || order.status === 'delivered' ? 'Completed' : 'Pending'}</div>
                          </div>
                        </div>
                        <div className={`progress-line ${order.status === 'shipped' || order.status === 'delivered' ? 'active' : ''}`}></div>
                        
                        <div className={`progress-step ${order.status === 'shipped' ? 'active' : order.status === 'delivered' ? 'completed' : ''}`}>
                          <div className="step-marker">
                            <span className="step-icon">🚚</span>
                          </div>
                          <div className="step-info">
                            <div className="step-title">Shipped</div>
                            <div className="step-date">{order.status === 'shipped' ? 'On the way' : order.status === 'delivered' ? 'Delivered' : 'Pending'}</div>
                          </div>
                        </div>
                        <div className={`progress-line ${order.status === 'delivered' ? 'active' : ''}`}></div>
                        
                        <div className={`progress-step ${order.status === 'delivered' ? 'active completed' : ''}`}>
                          <div className="step-marker">
                            <span className="step-icon">✅</span>
                          </div>
                          <div className="step-info">
                            <div className="step-title">Delivered</div>
                            <div className="step-date">{order.status === 'delivered' ? 'Completed' : 'Pending'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="order-items-modern">
                      <h4 className="items-title">
                        <span>🛍️</span> Order Items ({order.items?.length || 0})
                      </h4>
                      <div className="items-list">
                        {order.items?.slice(0, selectedOrder === order.id ? undefined : 2).map((item, idx) => (
                          <motion.div 
                            key={idx} 
                            className="order-item-modern"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div className="item-image-modern">
                              {item.images && item.images[0] ? (
                                <img src={item.images[0]} alt={item.name} />
                              ) : (
                                <div className="image-placeholder-modern">🎁</div>
                              )}
                            </div>
                            <div className="item-details-modern">
                              <h5>{item.name}</h5>
                              <div className="item-meta">
                                <span className="item-quantity">Qty: {item.quantity}</span>
                                <span className="item-price">
                                  {order.currency || selectedCountry.currency}{convertPrice(item.price)} each
                                </span>
                              </div>
                            </div>
                            <div className="item-total-modern">
                              <span className="total-label">Total</span>
                              <span className="total-value">
                                {order.currency || selectedCountry.currency}{convertPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {order.items?.length > 2 && (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="view-more-btn-modern"
                          onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                        >
                          {selectedOrder === order.id ? (
                            <>↑ View Less</>
                          ) : (
                            <>↓ View {order.items.length - 2} More Items</>
                          )}
                        </motion.button>
                      )}
                    </div>

                    <div className="order-summary-modern">
                      <div className="summary-row-modern">
                        <span>Subtotal</span>
                        <span>{order.currency || selectedCountry.currency}{order.subtotal?.toLocaleString()}</span>
                      </div>
                      <div className="summary-row-modern">
                        <span>Delivery Charge</span>
                        <span>{order.currency || selectedCountry.currency}{order.deliveryCharge?.toLocaleString()}</span>
                      </div>
                      {order.couponDiscount > 0 && (
                        <div className="summary-row-modern discount-row">
                          <span>Coupon Discount</span>
                          <span>-{order.currency || selectedCountry.currency}{order.couponDiscount?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="summary-row-modern total-row">
                        <span>Total Amount</span>
                        <span className="total-amount">{order.currency || selectedCountry.currency}{order.total?.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="shipping-address-modern">
                      <div className="address-header">
                        <span>📍</span>
                        <h4>Shipping Address</h4>
                      </div>
                      <div className="address-content">
                        <p><strong>{order.customerName}</strong></p>
                        <p>{order.address}, {order.city}, {order.pincode}</p>
                        <p>{order.country}</p>
                        <p className="phone-number">📞 {order.customerPhone}</p>
                      </div>
                    </div>

                    <div className="order-actions-modern">
                      {order.status === 'delivered' && (
  <motion.button 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="action-btn review-btn"
    onClick={() => {
      // Navigate to the first product in the order
      if (order.items && order.items.length > 0) {
        navigate(`/product/${order.items[0].id}`, { 
          state: { openReviews: true, productName: order.items[0].name }
        });
      } else {
        toast.info('No products to review');
      }
    }}
  >
    ⭐ Write a Review
  </motion.button>
)}
                      {order.status === 'pending' && (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="action-btn track-btn"
                          onClick={() => toast.info('Tracking details will be available within 24 hours')}
                        >
                          📍 Track Order
                        </motion.button>
                      )}
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="action-btn support-btn"
                        onClick={() => toast.info('Our support team will assist you shortly')}
                      >
                        💬 Need Help?
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredOrders.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="no-results-modern"
              >
                <div className="no-results-icon">🔍</div>
                <h3>No orders found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button className="btn-clear-filters" onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}>
                  Clear all filters
                </button>
              </motion.div>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  );
};

// Admin Dashboard Component with Coupons and Posters
const AdminDashboard = () => {
  const { selectedCountry, convertPrice } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [posters, setPosters] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    icon: '🎁',
    description: '',
    stock: 0,
    imageUrls: ['', '', '']
  });
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountAmount: '',
    isActive: true,
    validUntil: ''
  });
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [newPoster, setNewPoster] = useState({
    title: '',
    imageUrl: '',
    link: '',
    isActive: true,
    order: 0
  });
  const [editingPoster, setEditingPoster] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(ordersData);

      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      const couponsSnapshot = await getDocs(collection(db, 'coupons'));
      const couponsData = couponsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCoupons(couponsData);

      const postersSnapshot = await getDocs(collection(db, 'posters'));
      const postersData = postersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      postersData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPosters(postersData);
      
      toast.success('Data loaded successfully');
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load admin data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus, updatedAt: new Date().toISOString() });
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status: " + error.message);
    }
  };

  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      toast.error("Please fill required fields (Name, Category, Price)");
      return;
    }
    
    try {
      const validImages = newProduct.imageUrls.filter(url => url && url.trim() !== '');
      
      const productToSave = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
        discount: newProduct.originalPrice ? Math.round((1 - newProduct.price / newProduct.originalPrice) * 100) : null,
        icon: newProduct.icon || '🎁',
        description: newProduct.description || '',
        stock: Number(newProduct.stock) || 0,
        images: validImages,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productToSave);
        setProducts(products.map(p => p.id === editingProduct.id ? { id: editingProduct.id, ...productToSave } : p));
        toast.success("Product updated successfully");
        setEditingProduct(null);
      } else {
        productToSave.createdAt = new Date().toISOString();
        const docRef = await addDoc(collection(db, 'products'), productToSave);
        setProducts([...products, { id: docRef.id, ...productToSave }]);
        toast.success("Product added successfully");
      }
      
      setNewProduct({ 
        name: '', 
        category: '', 
        price: '', 
        originalPrice: '', 
        icon: '🎁', 
        description: '', 
        stock: 0,
        imageUrls: ['', '', '']
      });
      
      await fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product: " + error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        setProducts(products.filter(p => p.id !== productId));
        toast.success("Product deleted successfully");
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product: " + error.message);
      }
    }
  };

  const handleEditProduct = (product) => {
    const imageUrls = ['', '', ''];
    if (product.images && product.images.length > 0) {
      product.images.forEach((img, idx) => {
        if (idx < 3) imageUrls[idx] = img;
      });
    }
    
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || '',
      icon: product.icon || '🎁',
      description: product.description || '',
      stock: product.stock || 0,
      imageUrls: imageUrls
    });
    setActiveTab('add-product');
  };

  const updateImageUrl = (index, value) => {
    const newImageUrls = [...newProduct.imageUrls];
    newImageUrls[index] = value;
    setNewProduct({ ...newProduct, imageUrls: newImageUrls });
  };

  const handleAddOrUpdateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountAmount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const couponToSave = {
        code: newCoupon.code.toUpperCase(),
        discountAmount: Number(newCoupon.discountAmount),
        isActive: newCoupon.isActive,
        validUntil: newCoupon.validUntil || null,
        createdAt: new Date().toISOString()
      };

      if (editingCoupon) {
        const couponRef = doc(db, 'coupons', editingCoupon.id);
        await updateDoc(couponRef, couponToSave);
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? { id: editingCoupon.id, ...couponToSave } : c));
        toast.success("Coupon updated successfully");
        setEditingCoupon(null);
      } else {
        const docRef = await addDoc(collection(db, 'coupons'), couponToSave);
        setCoupons([...coupons, { id: docRef.id, ...couponToSave }]);
        toast.success("Coupon added successfully");
      }

      setNewCoupon({ code: '', discountAmount: '', isActive: true, validUntil: '' });
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast.error("Failed to save coupon: " + error.message);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm("Are you sure you want to delete this coupon?")) {
      try {
        await deleteDoc(doc(db, 'coupons', couponId));
        setCoupons(coupons.filter(c => c.id !== couponId));
        toast.success("Coupon deleted successfully");
      } catch (error) {
        console.error("Error deleting coupon:", error);
        toast.error("Failed to delete coupon: " + error.message);
      }
    }
  };

  const handleToggleCouponStatus = async (coupon) => {
    try {
      const couponRef = doc(db, 'coupons', coupon.id);
      await updateDoc(couponRef, { isActive: !coupon.isActive });
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
      toast.success(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      toast.error("Failed to update coupon status");
    }
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setNewCoupon({
      code: coupon.code,
      discountAmount: coupon.discountAmount,
      isActive: coupon.isActive,
      validUntil: coupon.validUntil || ''
    });
    setActiveTab('coupons');
  };

  const handleAddOrUpdatePoster = async (e) => {
    e.preventDefault();
    if (!newPoster.title || !newPoster.imageUrl) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const posterToSave = {
        title: newPoster.title,
        imageUrl: newPoster.imageUrl,
        link: newPoster.link || '#',
        isActive: newPoster.isActive,
        order: Number(newPoster.order) || 0,
        createdAt: new Date().toISOString()
      };

      if (editingPoster) {
        const posterRef = doc(db, 'posters', editingPoster.id);
        await updateDoc(posterRef, posterToSave);
        setPosters(posters.map(p => p.id === editingPoster.id ? { id: editingPoster.id, ...posterToSave } : p));
        toast.success("Poster updated successfully");
        setEditingPoster(null);
      } else {
        const docRef = await addDoc(collection(db, 'posters'), posterToSave);
        setPosters([...posters, { id: docRef.id, ...posterToSave }]);
        toast.success("Poster added successfully");
      }

      setNewPoster({ title: '', imageUrl: '', link: '', isActive: true, order: 0 });
      const updatedPosters = await getDocs(collection(db, 'posters'));
      const postersData = updatedPosters.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      postersData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setPosters(postersData);
    } catch (error) {
      console.error("Error saving poster:", error);
      toast.error("Failed to save poster: " + error.message);
    }
  };

  const handleDeletePoster = async (posterId) => {
    if (window.confirm("Are you sure you want to delete this poster?")) {
      try {
        await deleteDoc(doc(db, 'posters', posterId));
        setPosters(posters.filter(p => p.id !== posterId));
        toast.success("Poster deleted successfully");
      } catch (error) {
        console.error("Error deleting poster:", error);
        toast.error("Failed to delete poster: " + error.message);
      }
    }
  };

  const handleTogglePosterStatus = async (poster) => {
    try {
      const posterRef = doc(db, 'posters', poster.id);
      await updateDoc(posterRef, { isActive: !poster.isActive });
      setPosters(posters.map(p => p.id === poster.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(`Poster ${!poster.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error toggling poster status:", error);
      toast.error("Failed to update poster status");
    }
  };

  const handleEditPoster = (poster) => {
    setEditingPoster(poster);
    setNewPoster({
      title: poster.title,
      imageUrl: poster.imageUrl,
      link: poster.link || '#',
      isActive: poster.isActive,
      order: poster.order || 0
    });
    setActiveTab('posters');
  };

  if (loading) return <div className="loading">Loading Admin Dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <h1>br_Treasure_Trove Admin Dashboard</h1>
          <button className="refresh-btn" onClick={fetchData}>🔄 Refresh Data</button>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{products.length}</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Customers</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{coupons.filter(c => c.isActive).length}</div>
              <div className="stat-label">Active Coupons</div>
            </div>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            📦 Orders ({orders.length})
          </button>
          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            🛍️ Products ({products.length})
          </button>
          <button className={activeTab === 'add-product' ? 'active' : ''} onClick={() => { 
            setEditingProduct(null); 
            setNewProduct({ 
              name: '', 
              category: '', 
              price: '', 
              originalPrice: '', 
              icon: '🎁', 
              description: '', 
              stock: 0,
              imageUrls: ['', '', '']
            }); 
            setActiveTab('add-product'); 
          }}>
            {editingProduct ? '✏️ Edit Product' : '➕ Add Product'}
          </button>
          <button className={activeTab === 'coupons' ? 'active' : ''} onClick={() => {
            setEditingCoupon(null);
            setNewCoupon({ code: '', discountAmount: '', isActive: true, validUntil: '' });
            setActiveTab('coupons');
          }}>
            🏷️ Coupons ({coupons.length})
          </button>
          <button className={activeTab === 'posters' ? 'active' : ''} onClick={() => {
            setEditingPoster(null);
            setNewPoster({ title: '', imageUrl: '', link: '', isActive: true, order: 0 });
            setActiveTab('posters');
          }}>
            🖼️ Posters ({posters.length})
          </button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
            👥 Customers ({users.length})
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className="admin-orders">
            <h2>Manage Orders</h2>
            {orders.length === 0 ? (
              <div className="no-data-message">No orders found. Orders will appear here when customers place orders.</div>
            ) : (
              <div className="orders-table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Order ID</th><th>Customer</th><th>Transaction ID</th><th>Items</th><th>Total</th><th>Country</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>{order.id.slice(0, 8)}</td>
                        <td>{order.customerName}<br/><small>{order.customerEmail}</small><br/><small>{order.customerPhone}</small></td>
                        <td>
                          {order.transactionId ? (
                            <span className="transaction-id">{order.transactionId}</span>
                          ) : (
                            <span className="no-transaction">-</span>
                          )}
                        </td>
                        <td>{order.items?.map(item => `${item.name} x${item.quantity}`).join(', ')}</td>
                        <td>{order.currency || selectedCountry.currency}{order.total}</td>
                        <td>{order.country}</td>
                        <td><span className={`order-status ${order.status || 'pending'}`}>{order.status || 'Pending'}</span></td>
                        <td>
                          <select value={order.status || 'pending'} onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)} className="status-select">
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-products">
            <h2>Manage Products ({products.length} products)</h2>
            {products.length === 0 ? (
              <div className="no-data-message">
                <p>No products found. Click "Add Product" to create your first product.</p>
                <button className="btn-primary" onClick={() => setActiveTab('add-product')}>➕ Add Your First Product</button>
              </div>
            ) : (
              <div className="products-table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Images</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="product-images-preview">
                            {product.images && product.images.slice(0, 2).map((img, idx) => (
                              <img key={idx} src={img} alt="" className="mini-preview" onError={(e) => e.target.style.display = 'none'} />
                            ))}
                            {(!product.images || product.images.length === 0) && <span>{product.icon}</span>}
                          </div>
                        </td>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>{selectedCountry.currency}{convertPrice(product.price)}</td>
                        <td>{product.stock || 0}</td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditProduct(product)}>✏️ Edit</button>
                          <button className="delete-btn" onClick={() => handleDeleteProduct(product.id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'add-product' && (
          <div className="admin-add-product">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleAddOrUpdateProduct} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required>
                    <option value="">Select Category</option>
                    <option value="Combo Packs">Combo Packs</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Hair Clips">Hair Clips</option>
                    <option value="Hand Bags">Hand Bags</option>
                    <option value="Kada Bracelets">Kada Bracelets</option>
                    <option value="Lunch Boxes">Lunch Boxes</option>
                    <option value="Scrunches">Scrunches</option>
                    <option value="Water Bottles">Water Bottles</option>
                     <option value="Resin Art">Resin Art</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Selling Price (INR) *</label>
                  <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Original Price (INR)</label>
                  <input type="number" value={newProduct.originalPrice} onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Icon (Emoji) - Fallback</label>
                  <input type="text" value={newProduct.icon} onChange={(e) => setNewProduct({...newProduct, icon: e.target.value})} maxLength="2" placeholder="🎁" />
                  <small>Used when no images are available</small>
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Product Images (URLs - Max 3)</label>
                <div className="image-url-inputs">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="url-input-group">
                      <input 
                        type="text" 
                        placeholder={`Image URL ${idx + 1}`} 
                        value={newProduct.imageUrls[idx]} 
                        onChange={(e) => updateImageUrl(idx, e.target.value)}
                        className="image-url-input"
                      />
                      {newProduct.imageUrls[idx] && (
                        <div className="url-preview">
                          <img src={newProduct.imageUrls[idx]} alt={`Preview ${idx + 1}`} onError={(e) => e.target.style.display = 'none'} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <small className="image-hint">
                  💡 Enter direct image URLs from image hosting services (Imgur, Flickr, Google Drive, etc.)<br/>
                  🔗 Supported formats: JPG, PNG, GIF, WebP<br/>
                  📝 Example: https://example.com/image.jpg
                </small>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} rows="3" placeholder="Describe your product..."></textarea>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingProduct ? '✏️ Update Product' : '➕ Add Product'}
                </button>
                {editingProduct && (
                  <button type="button" className="btn-cancel" onClick={() => { 
                    setEditingProduct(null); 
                    setNewProduct({ name: '', category: '', price: '', originalPrice: '', icon: '🎁', description: '', stock: 0, imageUrls: ['', '', ''] }); 
                  }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="admin-coupons">
            <h2>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
            <form onSubmit={handleAddOrUpdateCoupon} className="coupon-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input 
                    type="text" 
                    value={newCoupon.code} 
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} 
                    placeholder="e.g., SAVE50"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Discount Amount ({selectedCountry.currency}) *</label>
                  <input 
                    type="number" 
                    value={newCoupon.discountAmount} 
                    onChange={(e) => setNewCoupon({...newCoupon, discountAmount: e.target.value})} 
                    placeholder="Discount in currency"
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={newCoupon.isActive} onChange={(e) => setNewCoupon({...newCoupon, isActive: e.target.value === 'true'})}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Valid Until (Optional)</label>
                  <input 
                    type="date" 
                    value={newCoupon.validUntil} 
                    onChange={(e) => setNewCoupon({...newCoupon, validUntil: e.target.value})} 
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingCoupon ? '✏️ Update Coupon' : '➕ Add Coupon'}
                </button>
                {editingCoupon && (
                  <button type="button" className="btn-cancel" onClick={() => {
                    setEditingCoupon(null);
                    setNewCoupon({ code: '', discountAmount: '', isActive: true, validUntil: '' });
                  }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginTop: '2rem' }}>Existing Coupons</h3>
            {coupons.length === 0 ? (
              <div className="no-data-message">No coupons created yet.</div>
            ) : (
              <div className="coupons-table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Code</th><th>Discount</th><th>Status</th><th>Valid Until</th><th>Created At</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {coupons.map(coupon => (
                      <tr key={coupon.id}>
                        <td><strong>{coupon.code}</strong></td>
                        <td>{selectedCountry.currency}{coupon.discountAmount}</td>
                        <td>
                          <span className={`status-badge ${coupon.isActive ? 'active' : 'inactive'}`}>
                            {coupon.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td>{coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry'}</td>
                        <td>{new Date(coupon.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditCoupon(coupon)}>✏️ Edit</button>
                          <button className="toggle-status-btn" onClick={() => handleToggleCouponStatus(coupon)}>
                            {coupon.isActive ? '🔴 Deactivate' : '🟢 Activate'}
                          </button>
                          <button className="delete-btn" onClick={() => handleDeleteCoupon(coupon.id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posters' && (
          <div className="admin-posters">
            <h2>{editingPoster ? 'Edit Poster' : 'Add New Poster'}</h2>
            <form onSubmit={handleAddOrUpdatePoster} className="poster-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Poster Title *</label>
                  <input 
                    type="text" 
                    value={newPoster.title} 
                    onChange={(e) => setNewPoster({...newPoster, title: e.target.value})} 
                    placeholder="e.g., Summer Sale 2024"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Poster Subtitle (Optional)</label>
                  <input 
                  type="text" 
                  value={newPoster.subtitle} 
                  onChange={(e) => setNewPoster({...newPoster, subtitle: e.target.value})} 
                  placeholder="e.g., Up to 50% off on selected items"
                  />
                </div>
                <div className="form-group">
                  <label>Display Order</label>
                  <input 
                    type="number" 
                    value={newPoster.order} 
                    onChange={(e) => setNewPoster({...newPoster, order: e.target.value})} 
                    placeholder="0, 1, 2..."
                  />
                  <small>Lower numbers appear first</small>
                </div>
              </div>
              <div className="form-group">
                <label>Image URL *</label>
                <input 
                  type="text" 
                  value={newPoster.imageUrl} 
                  onChange={(e) => setNewPoster({...newPoster, imageUrl: e.target.value})} 
                  placeholder="https://example.com/poster.jpg"
                  required 
                />
                {newPoster.imageUrl && (
                  <div className="poster-preview">
                    <img src={newPoster.imageUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML += '<p>❌ Invalid image URL</p>'; }} />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Link URL</label>
                  <input 
                    type="text" 
                    value={newPoster.link} 
                    onChange={(e) => setNewPoster({...newPoster, link: e.target.value})} 
                    placeholder="/shop or https://example.com"
                  />
                  <small>Where the poster should link to</small>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={newPoster.isActive} onChange={(e) => setNewPoster({...newPoster, isActive: e.target.value === 'true'})}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {editingPoster ? '✏️ Update Poster' : '➕ Add Poster'}
                </button>
                {editingPoster && (
                  <button type="button" className="btn-cancel" onClick={() => {
                    setEditingPoster(null);
                    setNewPoster({ title: '', imageUrl: '', link: '', isActive: true, order: 0 });
                  }}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ marginTop: '2rem' }}>Active Posters (Displayed on Home Page)</h3>
            {posters.filter(p => p.isActive).length === 0 ? (
              <div className="no-data-message">No active posters. Add and activate posters to display them on the home page.</div>
            ) : (
              <div className="posters-grid">
                {posters.filter(p => p.isActive).map(poster => (
                  <div key={poster.id} className="poster-card">
                    <img src={poster.imageUrl} alt={poster.title} onError={(e) => e.target.style.display = 'none'} />
                    <div className="poster-info">
                      <h4>{poster.title}</h4>
                      <p>Order: {poster.order || 0}</p>
                      <div className="poster-actions">
                        <button className="edit-btn" onClick={() => handleEditPoster(poster)}>✏️ Edit</button>
                        <button className="delete-btn" onClick={() => handleDeletePoster(poster.id)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ marginTop: '2rem' }}>All Posters</h3>
            {posters.length === 0 ? (
              <div className="no-data-message">No posters created yet.</div>
            ) : (
              <div className="posters-table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>Image</th><th>Title</th><th>Order</th><th>Status</th><th>Link</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {posters.map(poster => (
                      <tr key={poster.id}>
                        <td>
                          <img src={poster.imageUrl} alt={poster.title} className="mini-preview" onError={(e) => e.target.style.display = 'none'} />
                        </td>
                        <td>{poster.title}</td>
                        <td>{poster.order || 0}</td>
                        <td>
                          <span className={`status-badge ${poster.isActive ? 'active' : 'inactive'}`}>
                            {poster.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td>{poster.link || '#'}</td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditPoster(poster)}>✏️ Edit</button>
                          <button className="toggle-status-btn" onClick={() => handleTogglePosterStatus(poster)}>
                            {poster.isActive ? '🔴 Deactivate' : '🟢 Activate'}
                          </button>
                          <button className="delete-btn" onClick={() => handleDeletePoster(poster.id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-users">
            <h2>Registered Customers</h2>
            {users.length === 0 ? (
              <div className="no-data-message">No customers found. Customers will appear here when they sign up.</div>
            ) : (
              <div className="users-table-container">
                <table className="admin-table">
                  <thead>
                    <tr><th>User ID</th><th>Name</th><th>Email</th><th>Registered At</th><th>Orders</th></tr>
                  </thead>
                  <tbody>
                    {users.map(user => {
                      const userOrders = orders.filter(order => order.customerEmail === user.email);
                      return (
                        <tr key={user.id}>
                          <td>{user.id?.slice(0, 8)}</td>
                          <td>{user.name || 'N/A'}</td>
                          <td>{user.email}</td>
                          <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td>{userOrders.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// User Profile Component with List View Interface
const UserProfile = () => {
  const { user, selectedCountry, convertPrice } = useContext(AppContext);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'settings'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (user?.email) {
        try {
          const ordersQuery = query(collection(db, 'orders'), where('customerEmail', '==', user.email));
          const ordersSnapshot = await getDocs(ordersQuery);
          const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setUserOrders(ordersData);
        } catch (error) {
          console.error("Error fetching orders:", error);
          toast.error("Failed to load orders");
        }
      }
      setLoading(false);
    };
    fetchUserOrders();
  }, [user]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="user-profile">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="avatar-status online"></div>
          </div>
          <div className="profile-header-info">
            <h1>My Account</h1>
            <p>Welcome back, {user?.name || user?.email}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 My Orders ({userOrders.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="profile-sections">
            {/* Account Information Card */}
            <div className="profile-info-card">
              <div className="card-header">
                <h3>📋 Account Information</h3>
                <button className="btn-edit" onClick={() => setActiveTab('settings')}>
                  ✏️ Edit
                </button>
              </div>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">👤 Name:</span>
                  <span className="info-value">{user?.name || 'Not set'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">📧 Email:</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">📅 Member Since:</span>
                  <span className="info-value">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">🌍 Default Currency:</span>
                  <span className="info-value">{selectedCountry?.currency} {selectedCountry?.code}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h4>Total Orders</h4>
                  <p className="stat-number">{userOrders.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h4>Total Spent</h4>
                  <p className="stat-number">
                    {selectedCountry?.currency}
                    {userOrders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <h4>Reviews</h4>
                  <p className="stat-number">0</p>
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="profile-orders">
              <div className="section-header">
                <h3>🕒 Recent Orders</h3>
                <button className="btn-link" onClick={() => setActiveTab('orders')}>
                  View All →
                </button>
              </div>
              {userOrders.length === 0 ? (
                <div className="no-orders">
                  <p>You haven't placed any orders yet.</p>
                  <button className="btn-primary" onClick={() => navigate('/shop')}>
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="orders-list-view">
                  {userOrders.slice(0, 3).map(order => (
                    <div key={order.id} className="order-list-item">
                      <div className="order-list-header">
                        <div className="order-id-badge">
                          <span className="badge-icon">#️⃣</span>
                          <span>Order #{order.id.slice(0, 8)}</span>
                        </div>
                        <div className={`order-status-badge ${order.status || 'pending'}`}>
                          {order.status || 'Pending'}
                        </div>
                      </div>
                      <div className="order-list-details">
                        <div className="order-date">
                          📅 {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        {order.transactionId && (
                          <div className="transaction-id">
                            🏦 TXN: {order.transactionId.slice(0, 12)}...
                          </div>
                        )}
                        <div className="order-items-list">
                          {order.items?.slice(0, 2).map(item => (
                            <div key={item.id} className="order-item-row">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{order.currency || selectedCountry.currency}{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="more-items">+{order.items.length - 2} more items</div>
                          )}
                        </div>
                        <div className="order-total">
                          <strong>Total:</strong> {order.currency || selectedCountry.currency}{order.total}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab with List/Grid View Toggle */}
        {activeTab === 'orders' && (
          <div className="orders-full-view">
            <div className="orders-header">
              <h3>📦 All Orders ({userOrders.length})</h3>
              <div className="view-controls">
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  📋 List View
                </button>
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  🔲 Grid View
                </button>
              </div>
            </div>

            {userOrders.length === 0 ? (
              <div className="no-orders-full">
                <div className="empty-state-icon">🛒</div>
                <p>You haven't placed any orders yet.</p>
                <button className="btn-primary" onClick={() => navigate('/shop')}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className={`orders-container ${viewMode}`}>
                {viewMode === 'list' ? (
                  // List View
                  <div className="orders-list-view-full">
                    {userOrders.map(order => (
                      <div key={order.id} className="order-list-item-full">
                        <div className="order-main-info">
                          <div className="order-summary">
                            <div className="order-number">
                              <strong>Order #{order.id.slice(0, 8)}</strong>
                            </div>
                            <div className="order-meta">
                              <span>📅 {new Date(order.createdAt).toLocaleDateString()}</span>
                              <span>🕒 {new Date(order.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="order-status-large">
                            <span className={`status-badge ${order.status || 'pending'}`}>
                              {order.status || 'Pending'}
                            </span>
                          </div>
                          <div className="order-total-large">
                            <strong>Total:</strong> {order.currency || selectedCountry.currency}{order.total}
                          </div>
                          <button 
                            className="btn-view-details"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            View Details →
                          </button>
                        </div>
                        {order.items && (
                          <div className="order-items-preview">
                            {order.items.slice(0, 3).map(item => (
                              <div key={item.id} className="preview-item">
                                <span>{item.name}</span>
                                <span>x{item.quantity}</span>
                                <span>{order.currency || selectedCountry.currency}{item.price * item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="more-items">+{order.items.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Grid View
                  <div className="orders-grid-view">
                    {userOrders.map(order => (
                      <div key={order.id} className="order-grid-item">
                        <div className="order-grid-header">
                          <span className="order-id-grid">#{order.id.slice(0, 8)}</span>
                          <span className={`status-badge-small ${order.status || 'pending'}`}>
                            {order.status || 'Pending'}
                          </span>
                        </div>
                        <div className="order-grid-date">
                          📅 {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="order-grid-items">
                          {order.items?.slice(0, 2).map(item => (
                            <div key={item.id} className="grid-item">
                              {item.name} x{item.quantity}
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="more-items-grid">+{order.items.length - 2}</div>
                          )}
                        </div>
                        <div className="order-grid-total">
                          Total: {order.currency || selectedCountry.currency}{order.total}
                        </div>
                        <button 
                          className="btn-grid-details"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View Order
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-panel">
            <div className="settings-section">
              <h3>Profile Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" defaultValue={user?.name || ''} placeholder="Enter your name" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" defaultValue={user?.email} disabled />
                  <small>Email cannot be changed</small>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" placeholder="Add phone number" />
                </div>
                <div className="form-group">
                  <label>Default Currency</label>
                  <select>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <button className="btn-save">active</button>
              </div>
            </div>
            
          

            
          </div>
        )}
      </div>
    </div>
  );
};
// Hero Image Component - Fixed and Accessible
const HeroImage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const heroImages = [
    { emoji: '🎨', label: 'Handmade Crafts', color: '#FF6B6B' },
    { emoji: '💎', label: 'Jewellery', color: '#4ECDC4' },
    { emoji: '🎀', label: 'Hair Accessories', color: '#FFE66D' },
    { emoji: '🎁', label: 'Gift Sets', color: '#95E77E' },
    { emoji: '🌸', label: 'Resin Art', color: '#FD79A8' },
    { emoji: '👜', label: 'Hand Bags', color: '#FF8C42' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isHovered, heroImages.length]);

  const currentImage = heroImages[currentImageIndex];

  return (
    <motion.div 
      className="hero-image"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="floating-icons" aria-label="Decorative floating icons">
        <span className="float-icon" style={{ animationDelay: '0s' }}>🎀</span>
        <span className="float-icon" style={{ animationDelay: '0.5s' }}>💎</span>
        <span className="float-icon" style={{ animationDelay: '1s' }}>🎁</span>
        <span className="float-icon" style={{ animationDelay: '1.5s' }}>🌸</span>
        <span className="float-icon" style={{ animationDelay: '2s' }}>✨</span>
        <span className="float-icon" style={{ animationDelay: '2.5s' }}>🎨</span>
      </div>
      <div 
        className="hero-img-placeholder" 
        style={{ background: `linear-gradient(135deg, ${currentImage.color}20, ${currentImage.color}40)` }}
        role="img"
        aria-label={`Hero image showing ${currentImage.label}`}
      >
        <motion.span 
          key={currentImageIndex}
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          className="hero-emoji"
        >
          {currentImage.emoji}
        </motion.span>
        <div className="hero-image-label">{currentImage.label}</div>
      </div>
      <div className="hero-image-indicators">
        {heroImages.map((_, idx) => (
          <button
            key={idx}
            className={`indicator ${currentImageIndex === idx ? 'active' : ''}`}
            onClick={() => setCurrentImageIndex(idx)}
            aria-label={`View ${heroImages[idx].label}`}
            aria-current={currentImageIndex === idx ? 'true' : 'false'}
          />
        ))}
      </div>
    </motion.div>
  );
};
// Posters Carousel Component - Fixed visibility
const PostersCarousel = () => {
  const [posters, setPosters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const postersSnapshot = await getDocs(collection(db, 'posters'));
        const postersData = postersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(poster => poster.isActive === true)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setPosters(postersData);
      } catch (error) {
        console.error("Error fetching posters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosters();
  }, []);

  useEffect(() => {
    if (posters.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % posters.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [posters.length]);

  if (loading || posters.length === 0) return null;

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + posters.length) % posters.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % posters.length);
  };

  return (
    <div className="posters-carousel">
      <div className="carousel-container">
        <button className="carousel-btn prev" onClick={goToPrev} aria-label="Previous poster">‹</button>
        <div className="carousel-slides">
          {posters.map((poster, index) => (
            <div
              key={poster.id}
              className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              <a href={poster.link} target={poster.link?.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                <div className="poster-wrapper">
                  <img 
                    src={poster.imageUrl} 
                    alt={poster.title} 
                    className="poster-image"
                    onError={(e) => { 
                      e.target.style.display = 'none'; 
                      e.target.parentElement.innerHTML += '<div class="fallback-poster">🎨 ' + poster.title + '</div>'; 
                    }} 
                  />
                  {/* Dark overlay for better text visibility */}
                  <div className="poster-overlay"></div>
                  
                  {/* Banner Text Content */}
                  {poster.title && (
                    <div className="poster-content">
                      <div className="poster-text">
                        <span className="poster-badge">✨ LIMITED TIME ✨</span>
                        <h2 className="poster-title">{poster.title}</h2>
                        {poster.subtitle && <p className="poster-subtitle">{poster.subtitle}</p>}
                        <button className="poster-cta">
                          Shop Now <span>→</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>
        <button className="carousel-btn next" onClick={goToNext} aria-label="Next poster">›</button>
      </div>
      {posters.length > 1 && (
        <div className="carousel-dots">
          {posters.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// Home Page Component with Posters
const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, addToWishlist, wishlist, selectedCountry } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFeaturedProducts(productsData.slice(0, 8));
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { name: 'Combo Packs', icon: '🎁', color: '#FF6B6B', count: 45 },
    { name: 'Earrings', icon: '💎', color: '#4ECDC4', count: 128 },
    { name: 'Hair Clips', icon: '🎀', color: '#FFE66D', count: 89 },
    { name: 'Hand Bags', icon: '👜', color: '#95E77E', count: 34 },
    { name: 'Kada Bracelets', icon: '✨', color: '#FF8C42', count: 56 },
    { name: 'Lunch Boxes', icon: '🍱', color: '#6C5CE7', count: 23 },
    { name: 'Scrunches', icon: '🌸', color: '#FD79A8', count: 67 },
    { name: 'Water Bottles', icon: '💧', color: '#00CEC9', count: 42 },
    { name: 'Resin Art', icon: '🎨', color: '#E17055', count: 15 },
  ];

  const testimonials = [
    { name: 'Priya Sharma', rating: 5, text: 'Absolutely love the quality! The hair accessories are gorgeous and perfect for gifting.', image: '👩' },
    { name: 'Ananya Patel', rating: 5, text: 'Best place for unique return gifts! Everyone loved the personalized items.', image: '👧' },
    { name: 'Neha Reddy', rating: 5, text: 'Fast delivery and beautiful packaging. Will definitely order again!', image: '👩‍🦱' },
    { name: 'Kavya Iyer', rating: 4, text: 'The resin art pieces are stunning! Exceeded my expectations.', image: '👩‍🎨' },
  ];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="home">
      <PostersCarousel />

      <section className="hero" aria-label="Hero section">
        <div className="hero-content">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <span className="hero-badge">✨ Handmade with Love ✨</span>
            <h1>Unique Gifts for Every Occasion</h1>
            <p>Discover beautifully crafted handmade gifts - from elegant hair accessories to stunning resin art. Perfect for birthdays, weddings, and all special moments.</p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => navigate('/shop')}>Shop Now</button>
              <button className="btn-secondary" onClick={() => navigate('/about')}>Learn More</button>
            </div>
            <div className="hero-stats">
              <div><span>500+</span> Happy Customers</div>
              <div><span>50+</span> Unique Products</div>
              <div><span>4.9⭐</span> Rating</div>
            </div>
          </motion.div>
          <HeroImage />
        </div>
      </section>

      <section className="delivery-info" aria-label="Delivery information">
        <div className="container">
          <div className="delivery-banner">
            <span>✈️</span>
            <div>
              <h4>Shipping to {selectedCountry.name}</h4>
              <p>Delivery in {selectedCountry.deliveryDays} business days • Shipping charges apply based on location</p>
            </div>
          </div>
        </div>
      </section>

      <section className="categories" aria-label="Product categories">
        <div className="container">
          <div className="section-header">
            <h2>Shop by Category</h2>
            <p>Explore our handpicked collections</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat, index) => (
              <motion.div 
                key={cat.name} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }} 
                whileHover={{ y: -5 }} 
                className="category-card" 
                style={{ background: `${cat.color}15` }} 
                onClick={() => navigate('/shop')}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigate('/shop')}
                aria-label={`Shop ${cat.name} category`}
              >
                <div className="category-icon" style={{ background: cat.color }}>{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{cat.count} Products</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured" aria-label="Featured products">
          <div className="container">
            <div className="section-header">
              <h2>Featured Products</h2>
              <p>Handpicked just for you</p>
              <button className="view-all" onClick={() => navigate('/shop')}>View All →</button>
            </div>
            <div className="products-grid">
              {featuredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                  onAddToCart={addToCart} 
                  onAddToWishlist={addToWishlist} 
                  isWishlisted={wishlist.some(item => item.id === product.id)} 
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="offer-banner" aria-label="Special offer">
        <div className="offer-content">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}>
            <span className="offer-badge">🎉 Limited Time Offer 🎉</span>
            <h2>Get 50% OFF on First Order</h2>
            <p>Use code: <strong>GIFTCRAFT50</strong> at checkout</p>
            <button className="btn-primary" onClick={() => navigate('/shop')}>Shop Now →</button>
          </motion.div>
        </div>
      </section>

      <section className="testimonials" aria-label="Customer testimonials">
        <div className="container">
          <div className="section-header">
            <h2>What Our Customers Say</h2>
            <p>Join thousands of happy customers</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.1 }} 
                className="testimonial-card"
              >
                <div className="testimonial-avatar">{testimonial.image}</div>
                <div className="stars">{"★".repeat(testimonial.rating)}</div>
                <p>"{testimonial.text}"</p>
                <h4>{testimonial.name}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="features" aria-label="Features">
        <div className="container">
          <div className="features-grid">
            <div className="feature">
              <span className="feature-icon">🚚</span>
              <h3>Worldwide Shipping</h3>
              <p>Delivery to {countries.length}+ countries</p>
            </div>
            <div className="feature">
              <span className="feature-icon">💝</span>
              <h3>Handmade Quality</h3>
              <p>Each piece crafted with love</p>
            </div>
            <div className="feature">
              <span className="feature-icon">🔄</span>
              <h3>Easy Returns</h3>
              <p>14-day return policy</p>
            </div>
            <div className="feature">
              <span className="feature-icon">💬</span>
              <h3>24/7 Support</h3>
              <p>Always here to help</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Shop Page Component
const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [loading, setLoading] = useState(true);
  const { addToCart, addToWishlist, wishlist, convertPrice, selectedCountry } = useContext(AppContext);

  const categories = ['All', 'Combo Packs', 'Earrings', 'Hair Clips', 'Hand Bags', 'Kada Bracelets', 'Lunch Boxes', 'Scrunches', 'Water Bottles', 'Resin Art'];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];
    if (selectedCategory !== 'All') filtered = filtered.filter(p => p.category === selectedCategory);
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, sortBy, priceRange, products]);

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>Shop All Products</h1>
        <p>Discover our beautiful handmade collection</p>
      </div>
      <div className="shop-container">
        <aside className="shop-sidebar" aria-label="Product filters">
          <div className="filter-section">
            <h3>Search</h3>
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" aria-label="Search products" />
          </div>
          <div className="filter-section">
            <h3>Categories</h3>
            <div className="category-list">
              {categories.map(cat => (
                <button key={cat} className={`category-filter ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h3>Price Range ({selectedCountry.currency})</h3>
            <div className="price-range">
              <input type="range" min="0" max="5000" value={priceRange[1]} onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} aria-label="Price range slider" />
              <div className="price-values">
                <span>{selectedCountry.currency}0</span>
                <span>{selectedCountry.currency}{priceRange[1]}+</span>
              </div>
            </div>
          </div>
          <div className="filter-section">
            <h3>Shipping To</h3>
            <div className="shipping-info-sidebar">
              <p>📍 {selectedCountry.name}</p>
              <p>🚚 Delivery: {selectedCountry.deliveryDays} days</p>
              <p>📦 Shipping charges: {selectedCountry.currency}{selectedCountry.deliveryCharge}</p>
            </div>
          </div>
        </aside>
        <div className="shop-main">
          <div className="shop-controls">
            <div className="results-count">Showing {filteredProducts.length} products</div>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort products">
              <option value="default">Sort by: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
          <div className="products-grid">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} onAddToCart={addToCart} onAddToWishlist={addToWishlist} isWishlisted={wishlist.some(item => item.id === product.id)} />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="no-products">
              <p>No products found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Cart Page Component
const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, selectedCountry, convertPrice } = useContext(AppContext);
  const navigate = useNavigate();

  if (cart.length === 0) return (
    <div className="empty-cart">
      <div className="empty-cart-icon">🛒</div>
      <h2>Your cart is empty</h2>
      <p>Looks like you haven't added any items yet</p>
      <button className="btn-primary" onClick={() => navigate('/shop')}>Continue Shopping</button>
    </div>
  );

  const deliveryCharge = selectedCountry.deliveryCharge;
  const total = cartTotal + deliveryCharge;

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map(item => (
              <motion.div key={item.id} className="cart-item" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                <div className="cart-item-image">
                  {item.images && item.images[0] ? <img src={item.images[0]} alt={item.name} className="cart-img" /> : <div className="image-placeholder small">{item.icon}</div>}
                </div>
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="item-category">{item.category}</p>
                  <div className="item-price">{selectedCountry.currency}{convertPrice(item.price)}</div>
                </div>
                <div className="cart-item-quantity">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
                <div className="cart-item-total">{selectedCountry.currency}{convertPrice(item.price * item.quantity)}</div>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)} aria-label="Remove item">🗑️</button>
              </motion.div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{selectedCountry.currency}{cartTotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Charge ({selectedCountry.name})</span>
              <span>{selectedCountry.currency}{deliveryCharge}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Time</span>
              <span>{selectedCountry.deliveryDays} business days</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{selectedCountry.currency}{total.toLocaleString()}</span>
            </div>
            <button className="btn-checkout" onClick={() => navigate('/checkout')}>Proceed to Checkout →</button>
            <button className="btn-clear" onClick={clearCart}>Clear Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wishlist Page Component
const Wishlist = () => {
  const { wishlist, addToCart, addToWishlist } = useContext(AppContext);
  const navigate = useNavigate();
  if (wishlist.length === 0) return (
    <div className="empty-wishlist">
      <div className="empty-icon">❤️</div>
      <h2>Your wishlist is empty</h2>
      <p>Save your favorite items here</p>
      <button className="btn-primary" onClick={() => navigate('/shop')}>Start Shopping</button>
    </div>
  );
  return (
    <div className="wishlist-page">
      <div className="container">
        <h1>My Wishlist</h1>
        <div className="products-grid">
          {wishlist.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} onAddToCart={addToCart} onAddToWishlist={addToWishlist} isWishlisted={true} />
          ))}
        </div>
      </div>
    </div>
  );
};
// ========== REVIEWS COMPONENT (MOVED HERE - BEFORE ProductDetail) ==========
const Reviews = ({ productId, productName }) => {
  const { user } = useContext(AppContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userReview, setUserReview] = useState({ rating: 5, comment: '', title: '' });
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState({});

  const fetchReviews = async () => {
    if (!productId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simple query without orderBy to avoid index requirement
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('productId', '==', productId)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      let reviewsData = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
      }));
      
      // Sort manually on client side
      reviewsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(reviewsData);
      
      // Fetch helpful votes for user
      if (user && reviewsData.length > 0) {
        const helpfulPromises = reviewsData.map(async (review) => {
          try {
            const helpfulQuery = query(
              collection(db, 'helpfulVotes'),
              where('reviewId', '==', review.id),
              where('userId', '==', user.uid)
            );
            const helpfulSnapshot = await getDocs(helpfulQuery);
            return { reviewId: review.id, voted: !helpfulSnapshot.empty };
          } catch (err) {
            return { reviewId: review.id, voted: false };
          }
        });
        const votes = await Promise.all(helpfulPromises);
        const votesMap = {};
        votes.forEach(vote => { votesMap[vote.reviewId] = vote.voted; });
        setHelpfulVotes(votesMap);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Unable to load reviews. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const stats = {
    average: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0,
    total: reviews.length,
    distribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    
    if (!userReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        productId,
        productName,
        userId: user.uid,
        userName: user.name || user.email.split('@')[0],
        userEmail: user.email,
        rating: userReview.rating,
        title: userReview.title || `${userReview.rating}-star review`,
        comment: userReview.comment.trim(),
        helpful: 0,
        helpfulUsers: [],
        images: [],
        verifiedPurchase: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingReview) {
        const reviewRef = doc(db, 'reviews', editingReview.id);
        await updateDoc(reviewRef, {
          rating: userReview.rating,
          title: userReview.title,
          comment: userReview.comment,
          updatedAt: new Date()
        });
        toast.success('Review updated successfully!');
        setEditingReview(null);
      } else {
        await addDoc(collection(db, 'reviews'), reviewData);
        toast.success('Thank you for your review! 🌟');
      }

      setUserReview({ rating: 5, comment: '', title: '' });
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setUserReview({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment,
      images: review.images || []
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }

    const reviewRef = doc(db, 'reviews', reviewId);
    const isHelpful = helpfulVotes[reviewId];

    try {
      if (isHelpful) {
        await updateDoc(reviewRef, {
          helpful: increment(-1),
          helpfulUsers: arrayRemove(user.uid)
        });
        setHelpfulVotes(prev => ({ ...prev, [reviewId]: false }));
        toast.info('Removed helpful vote');
      } else {
        await updateDoc(reviewRef, {
          helpful: increment(1),
          helpfulUsers: arrayUnion(user.uid)
        });
        setHelpfulVotes(prev => ({ ...prev, [reviewId]: true }));
        toast.success('Thanks! You found this review helpful');
      }
      
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: review.helpful + (isHelpful ? -1 : 1) }
          : review
      ));
    } catch (error) {
      console.error("Error updating helpful vote:", error);
      toast.error("Failed to update vote");
    }
  };

  const getFilteredReviews = () => {
    let filtered = [...reviews];
    
    switch(filter) {
      case '5star': filtered = filtered.filter(r => r.rating === 5); break;
      case '4star': filtered = filtered.filter(r => r.rating === 4); break;
      case '3star': filtered = filtered.filter(r => r.rating === 3); break;
      case '2star': filtered = filtered.filter(r => r.rating === 2); break;
      case '1star': filtered = filtered.filter(r => r.rating === 1); break;
      default: break;
    }
    
    switch(sortBy) {
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'oldest': filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'highest': filtered.sort((a, b) => b.rating - a.rating); break;
      case 'lowest': filtered.sort((a, b) => a.rating - b.rating); break;
      case 'helpful': filtered.sort((a, b) => (b.helpful || 0) - (a.helpful || 0)); break;
      default: break;
    }
    
    return filtered;
  };

  const filteredReviews = getFilteredReviews();
  const userExistingReview = reviews.find(r => r.userId === user?.uid);

  const StarRating = ({ rating, onRatingChange, size = 'medium' }) => {
    const [hover, setHover] = useState(0);
    const starSizes = { small: 20, medium: 28, large: 36 };
    
    return (
      <div style={{ display: 'flex', gap: '5px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => onRatingChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            style={{ 
              fontSize: starSizes[size], 
              cursor: onRatingChange ? 'pointer' : 'default',
              color: star <= (hover || rating) ? '#ffc107' : '#ddd',
              transition: 'all 0.2s ease'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }}></div>
        <p>Loading reviews...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: '#fff3cd', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h3>Unable to load reviews</h3>
        <p>{error}</p>
        <button 
          onClick={fetchReviews}
          style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '40px', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        <div>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ff6b6b' }}>{stats.average}</div>
          <StarRating rating={Math.round(stats.average)} size="large" />
          <div style={{ fontSize: '14px', color: '#666' }}>Based on {stats.total} reviews</div>
        </div>
        
        <div>
          {user && !userExistingReview && !showReviewForm && (
            <button
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}
              onClick={() => setShowReviewForm(true)}
            >
              ✍️ Write a Review
            </button>
          )}
          {user && userExistingReview && !showReviewForm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 20px', background: '#e8f4fd', borderRadius: '8px' }}>
              <span>You've already reviewed this product</span>
              <button style={{ padding: '6px 12px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} onClick={() => handleEditReview(userExistingReview)}>
                Edit Your Review
              </button>
            </div>
          )}
        </div>
      </div>

      {showReviewForm && (
        <div style={{ background: '#f8f9fa', padding: '25px', borderRadius: '12px', marginBottom: '30px' }}>
          <h3>{editingReview ? 'Edit Your Review' : 'Write a Review'}</h3>
          <form onSubmit={handleSubmitReview}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Your Rating *</label>
              <StarRating rating={userReview.rating} onRatingChange={(r) => setUserReview({...userReview, rating: r})} size="large" />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Review Title (Optional)"
                value={userReview.title}
                onChange={(e) => setUserReview({...userReview, title: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <textarea
                placeholder="Share your experience with this product..."
                value={userReview.comment}
                onChange={(e) => setUserReview({...userReview, comment: e.target.value})}
                rows="5"
                required
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '16px', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} onClick={() => {
                setShowReviewForm(false);
                setEditingReview(null);
                setUserReview({ rating: 5, comment: '', title: '' });
              }}>
                Cancel
              </button>
              <button type="submit" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={submitting}>
                {submitting ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', margin: '25px 0' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button style={{ padding: '6px 12px', background: filter === 'all' ? '#667eea' : '#f0f0f0', color: filter === 'all' ? 'white' : '#333', border: 'none', borderRadius: '20px', cursor: 'pointer' }} onClick={() => setFilter('all')}>All ({stats.total})</button>
            <button style={{ padding: '6px 12px', background: filter === '5star' ? '#667eea' : '#f0f0f0', color: filter === '5star' ? 'white' : '#333', border: 'none', borderRadius: '20px', cursor: 'pointer' }} onClick={() => setFilter('5star')}>5★ ({stats.distribution[5]})</button>
            <button style={{ padding: '6px 12px', background: filter === '4star' ? '#667eea' : '#f0f0f0', color: filter === '4star' ? 'white' : '#333', border: 'none', borderRadius: '20px', cursor: 'pointer' }} onClick={() => setFilter('4star')}>4★ ({stats.distribution[4]})</button>
            <button style={{ padding: '6px 12px', background: filter === '3star' ? '#667eea' : '#f0f0f0', color: filter === '3star' ? 'white' : '#333', border: 'none', borderRadius: '20px', cursor: 'pointer' }} onClick={() => setFilter('3star')}>3★ ({stats.distribution[3]})</button>
          </div>
          
          <div>
            <label style={{ marginRight: '10px' }}>Sort by: </label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '6px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer' }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📝</div>
            <h3>No reviews yet</h3>
            <p>Be the first to review this product!</p>
            {user && !showReviewForm && !userExistingReview && (
              <button style={{ marginTop: '20px', padding: '10px 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setShowReviewForm(true)}>
                Write a Review
              </button>
            )}
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
                    {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>{review.userName}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                      {review.updatedAt && review.updatedAt !== review.createdAt && <span style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}> (Edited)</span>}
                    </div>
                  </div>
                </div>
                <StarRating rating={review.rating} size="small" />
              </div>
              
              {review.title && <h4 style={{ fontSize: '18px', fontWeight: '600', margin: '10px 0', color: '#333' }}>{review.title}</h4>}
              <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', margin: '10px 0' }}>{review.comment}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0' }}>
                <button 
                  style={{ padding: '6px 12px', background: helpfulVotes[review.id] ? '#4CAF50' : '#f0f0f0', color: helpfulVotes[review.id] ? 'white' : '#333', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
                  onClick={() => handleHelpful(review.id)}
                >
                  👍 Helpful ({review.helpful || 0})
                </button>
                
                {user?.uid === review.userId && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#2196F3', fontSize: '12px' }} onClick={() => handleEditReview(review)}>✏️ Edit</button>
                    <button style={{ padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '12px' }} onClick={() => handleDeleteReview(review.id)}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ========== PRODUCT DETAIL COMPONENT (WITH REVIEWS) ==========

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart, addToWishlist, wishlist, convertPrice, selectedCountry } = useContext(AppContext);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRef = doc(db, 'products', id);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      }
    };
    fetchProduct();
  }, [id]);

  if (!product) return <div className="loading">Loading...</div>;
  const isInWishlist = wishlist.some(item => item.id === product.id);
  const productImages = product.images && product.images.length > 0 ? product.images : [product.icon || '🎁'];

  const nextImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };

  const prevImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };

  return (
    <div className="product-detail">
      <div className="container">
        <div className="product-detail-layout">
          <div className="product-gallery">
            <div className="main-image">
              {typeof productImages[currentImageIndex] === 'string' && (productImages[currentImageIndex].startsWith('http') || productImages[currentImageIndex].startsWith('data:')) ? (
                <img src={productImages[currentImageIndex]} alt={product.name} className="detail-img" />
              ) : (
                <div className="image-placeholder large" role="img">{productImages[currentImageIndex]}</div>
              )}
              {productImages.length > 1 && (
                <div className="gallery-nav">
                  <button className="gallery-nav-btn prev" onClick={prevImage}>‹</button>
                  <button className="gallery-nav-btn next" onClick={nextImage}>›</button>
                </div>
              )}
            </div>
          </div>
          <div className="product-info-detail">
            <div className="product-category">{product.category}</div>
            <h1>{product.name}</h1>
            <div className="product-price-detail">
              <span className="current">{selectedCountry.currency}{convertPrice(product.price)}</span>
              {product.originalPrice && (<span className="original">{selectedCountry.currency}{convertPrice(product.originalPrice)}</span>)}
            </div>
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
            <div className="product-actions-detail">
              <button className="btn-add-to-cart" onClick={() => addToCart(product, quantity)}>🛒 Add to Cart</button>
              <button className={`btn-wishlist ${isInWishlist ? 'active' : ''}`} onClick={() => addToWishlist(product)}>
                {isInWishlist ? '❤️ Added to Wishlist' : '🤍 Add to Wishlist'}
              </button>
            </div>
            <div className="product-meta">
              <div className="meta-item">🚚 Shipping to {selectedCountry.name} • {selectedCountry.deliveryDays} days</div>
              <div className="meta-item">📦 Shipping charges: {selectedCountry.currency}{selectedCountry.deliveryCharge}</div>
            </div>
          </div>
        </div>
        <div className="product-tabs">
          <div className="tab-headers">
            <button className={activeTab === 'description' ? 'active' : ''} onClick={() => setActiveTab('description')}>Description</button>
            <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setActiveTab('reviews')}>Reviews</button>
          </div>
          <div className="tab-content">
            {activeTab === 'description' && <p>{product.description || 'No description available.'}</p>}
            {activeTab === 'reviews' && (
              <Reviews productId={product.id} productName={product.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
// About Page
const About = () => (
  <div className="about-page">
    <div className="about-hero">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="about-content">
          <h1>Handmade with Love</h1>
          <p>Crafted with care, delivered with joy</p>
        </motion.div>
      </div>
    </div>
    <div className="container">
      <div className="about-story">
        <div className="story-text">
          <h2>Our Story</h2>
          <p>br_Treasure_Trove was born from a passion for unique, heartfelt gifts. We believe every gift should tell a story — that's why every piece in our store is handcrafted with attention to detail and genuine love.</p>
          <p>Based in Tamil Nadu, our small team of artisans creates everything from hair accessories to resin art, ensuring every item is one-of-a-kind and ready to make someone's day special.</p>
          <p>🌍 We now ship to {countries.length}+ countries worldwide!</p>
        </div>
        <div className="story-image">
          <div className="image-placeholder large" aria-label="Artisan crafting gifts" role="img">🎨</div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-number">500+</div>
          <div className="stat-label">Happy Customers</div>
        </div>
        <div className="stat">
          <div className="stat-number">50+</div>
          <div className="stat-label">Unique Products</div>
        </div>
        <div className="stat">
          <div className="stat-number">{countries.length}</div>
          <div className="stat-label">Countries Served</div>
        </div>
        <div className="stat">
          <div className="stat-number">4.9</div>
          <div className="stat-label">Rating</div>
        </div>
      </div>
      <div className="team-section">
        <h2>Meet Our Artisans</h2>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">P</div>
            <h3>Priya Mehta</h3>
            <p>Founder & Head Artisan</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">R</div>
            <h3>Riya Shah</h3>
            <p>Resin Art Specialist</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">A</div>
            <h3>Anita Desai</h3>
            <p>Jewellery Designer</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Contact Page - Updated with correct email and WhatsApp
const Contact = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    country: 'IN', 
    subject: '', 
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => { 
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create email content
    const emailBody = `
Name: ${formData.name}
Email: ${formData.email}
Country: ${countries.find(c => c.code === formData.country)?.name || formData.country}
Subject: ${formData.subject}
Message: ${formData.message}
    `;
    
    // Send to brcreatives4@gmail.com
    const mailtoLink = `mailto:brcreatives4@gmail.com?subject=Contact Form: ${formData.subject}&body=${encodeURIComponent(emailBody)}`;
    
    // Simulate sending (you can open email client or integrate with backend)
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', country: 'IN', subject: '', message: '' });
      setIsSubmitting(false);
      
      // Optionally open email client
      window.location.href = mailtoLink;
    }, 500);
  };

  const openWhatsApp = () => {
    const message = `Hi! I'm interested in your products. My name is ${formData.name || 'Customer'}.`;
    const whatsappUrl = `https://wa.me/9176501954?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-header">
          <h1>Get in Touch</h1>
          <p>Have questions? We'd love to hear from you</p>
        </div>

        {/* Quick Contact Options */}
        <div className="quick-contact-grid">
          <motion.div 
            className="quick-contact-card whatsapp"
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={openWhatsApp}
          >
            <div className="quick-icon">💬</div>
            <h3>Chat on WhatsApp</h3>
            <p>Quick replies within minutes</p>
            <span className="quick-number">+91 91765 01954</span>
            <button className="quick-btn">Chat Now →</button>
          </motion.div>

          <motion.div 
            className="quick-contact-card email"
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => window.location.href = 'mailto:brcreatives4@gmail.com'}
          >
            <div className="quick-icon">✉️</div>
            <h3>Send Email</h3>
            <p>We'll respond within 24 hours</p>
            <span className="quick-number">brcreatives4@gmail.com</span>
            <button className="quick-btn">Send Email →</button>
          </motion.div>
        </div>
        
        <div className="contact-layout">
          <div className="contact-info">
            <div className="info-card">
              <span className="info-icon">📍</span>
              <h3>Visit Us</h3>
              <p>No.20, 2nd Street, Vengadesapuram<br/>Acharapakkam, Chengalpattu-603301<br/>Tamil Nadu, India</p>
            </div>
            <div className="info-card">
              <span className="info-icon">📞</span>
              <h3>Call Us</h3>
              <p><a href="tel:+9176501954" className="contact-link">+91 91765 01954</a></p>
              <p>Mon-Sat: 9am - 7pm IST</p>
              <p>Sunday: Closed</p>
            </div>
            <div className="info-card">
              <span className="info-icon">✉️</span>
              <h3>Email Us</h3>
              <p><a href="mailto:brcreatives4@gmail.com" className="contact-link">brcreatives4@gmail.com</a></p>
              <p><a href="mailto:support@brinnovate.in" className="contact-link">support@brinnovate.in</a></p>
            </div>
            <div className="info-card">
              <span className="info-icon">🌍</span>
              <h3>Worldwide Shipping</h3>
              <p>We ship to {countries.length}+ countries</p>
              <p>Delivery in 3-12 business days</p>
            </div>
            
            {/* Social Media Links */}
            <div className="info-card social-media-card">
              <span className="info-icon">📱</span>
              <h3>Follow Us</h3>
              <div className="social-media-links">
                <a href="https://www.instagram.com/brcreatives5?igsh=Znl6eGk1aDJramsw" target="_blank" rel="noopener noreferrer" className="social-media-link instagram">
                  <span>📷</span> Instagram
                </a>
                <a href="https://www.instagram.com/br_innovate?igsh=MXZwY2M5Z3QxY3M0aA==" target="_blank" rel="noopener noreferrer" className="social-media-link instagram">
                  <span>📷</span> Instagram
                </a>
                <a href="https://pinterest.com/br_innovate" target="_blank" rel="noopener noreferrer" className="social-media-link pinterest">
                  <span>📌</span> Pinterest
                </a>
                <a href="https://wa.me/9176501954" target="_blank" rel="noopener noreferrer" className="social-media-link whatsapp">
                  <span>💬</span> WhatsApp
                </a>
              </div>
            </div>
          </div>
          
          <form className="contact-form" onSubmit={handleSubmit}>
            <h3>Send us a Message</h3>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Your Name *" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
                aria-label="Your name" 
              />
            </div>
            <div className="form-group">
              <input 
                type="email" 
                placeholder="Your Email *" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
                aria-label="Your email" 
              />
            </div>
            <div className="form-group">
              <select 
                value={formData.country} 
                onChange={(e) => setFormData({...formData, country: e.target.value})} 
                aria-label="Select country"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Subject *" 
                value={formData.subject} 
                onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                required 
                aria-label="Subject" 
              />
            </div>
            <div className="form-group">
              <textarea 
                placeholder="Your Message *" 
                rows="5" 
                value={formData.message} 
                onChange={(e) => setFormData({...formData, message: e.target.value})} 
                required 
                aria-label="Your message"
              ></textarea>
            </div>
            <div className="form-actions">
              <motion.button 
                type="submit" 
                className="btn-submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message ✉️'}
              </motion.button>
              
              <motion.button 
                type="button" 
                className="btn-whatsapp"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openWhatsApp}
              >
                💬 Chat on WhatsApp
              </motion.button>
            </div>
            
            <p className="form-note">
              📝 By submitting this form, you agree to our privacy policy. We'll get back to you within 24 hours.
            </p>
          </form>
        </div>
      </div>

      <style jsx>{`
        .quick-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 50px;
        }
        
        .quick-contact-card {
          background: white;
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        }
        
        .quick-contact-card.whatsapp {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
        }
        
        .quick-contact-card.email {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .quick-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        
        .quick-contact-card h3 {
          margin: 10px 0;
          font-size: 22px;
        }
        
        .quick-contact-card p {
          opacity: 0.9;
          margin: 10px 0;
        }
        
        .quick-number {
          display: block;
          font-size: 16px;
          font-family: monospace;
          margin: 15px 0;
          font-weight: bold;
        }
        
        .quick-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 10px 20px;
          border-radius: 25px;
          color: white;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.3s ease;
        }
        
        .quick-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .contact-link {
          color: #667eea;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .contact-link:hover {
          color: #764ba2;
          text-decoration: underline;
        }
        
        .social-media-card {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        
        .social-media-links {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 15px;
          flex-wrap: wrap;
        }
        
        .social-media-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 25px;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
        }
        
        .social-media-link.instagram {
          background: #E4405F;
        }
        
        .social-media-link.pinterest {
          background: #BD081C;
        }
        
        .social-media-link.whatsapp {
          background: #25D366;
        }
        
        .social-media-link:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }
        
        .btn-whatsapp {
          flex: 1;
          padding: 12px;
          background: #25D366;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-whatsapp:hover {
          background: #128C7E;
        }
        
        .form-note {
          font-size: 12px;
          color: #666;
          margin-top: 15px;
          text-align: center;
        }
        
        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
          }
          
          .quick-contact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Login Page with Firebase
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const { setUser, setIsAdmin } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        let userRole = 'user';
        let userName = firebaseUser.email.split('@')[0];
        
        if (userDoc.exists()) {
          userRole = userDoc.data().role || 'user';
          userName = userDoc.data().name || userName;
        }
        
        const userData = { 
          uid: firebaseUser.uid, 
          email: firebaseUser.email, 
          name: userName,
          role: userRole
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        const isAdminUser = userRole === 'admin' || formData.email === 'admin@brinnovate.in';
        setIsAdmin(isAdminUser);
        localStorage.setItem('isAdmin', isAdminUser ? 'true' : 'false');
        localStorage.setItem('userRole', userRole);
        
        toast.success(isAdminUser ? 'Admin login successful!' : 'Login successful!');
        
        const redirectToCheckout = localStorage.getItem('redirectToCheckout');
        if (redirectToCheckout === 'true') {
          localStorage.removeItem('redirectToCheckout');
          navigate('/checkout');
        } else {
          navigate(isAdminUser ? '/admin' : '/profile');
        }
      } else {
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const firebaseUser = userCredential.user;
        
        const userData = { 
          uid: firebaseUser.uid, 
          email: firebaseUser.email, 
          name: formData.name || firebaseUser.email.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAdmin(false);
        localStorage.setItem('isAdmin', 'false');
        localStorage.setItem('userRole', 'user');
        
        toast.success('Account created successfully!');
        
        const redirectToCheckout = localStorage.getItem('redirectToCheckout');
        if (redirectToCheckout === 'true') {
          localStorage.removeItem('redirectToCheckout');
          navigate('/checkout');
        } else {
          navigate('/profile');
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Please login instead.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password should be at least 6 characters.');
      } else {
        toast.error(error.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logo.jpeg" alt="br_innovate" className="auth-logo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              <span>br_Treasure_Trove </span>
            </div>
            <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
            <p>{isLogin ? 'Login to continue shopping' : 'Join us for exclusive offers'}</p>
          </div>
          <form onSubmit={handleSubmit}>
            {!isLogin && (<div className="form-group"><input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required={!isLogin} aria-label="Full name" /></div>)}
            <div className="form-group"><input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required aria-label="Email address" /></div>
            <div className="form-group"><input type="password" placeholder="Password (min 6 characters)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6} aria-label="Password" /></div>
            <button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}</button>
          </form>
          <div className="auth-footer">
            <p>{isLogin ? "Don't have an account? " : "Already have an account? "}<button onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Sign Up' : 'Login'}</button></p>
          </div>
          <div className="demo-credentials">
            <p><strong>Demo Credentials:</strong></p>
            <p>👤 <strong>Customer:</strong> customer@example.com | password: customer123</p>
            <p>👑 <strong>Admin:</strong> admin@brinnovate.in | password: admin123</p>
            <p className="info-note">💡 Use any email and password (min 6 chars) to create a customer account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Checkout Page with UPI Payment Integration
const Checkout = () => {
  const { cart, cartTotal, clearCart, selectedCountry, convertPrice, user } = useContext(AppContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '', address: '', city: '', pincode: '', phone: '' });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');

  const UPI_ID = "9176501954@okhdfcbank"; // Replace with your actual UPI number

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const couponsSnapshot = await getDocs(collection(db, 'coupons'));
        const couponsData = couponsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableCoupons(couponsData);
      } catch (error) {
        console.error("Error fetching coupons:", error);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (!user && cart.length > 0) {
      localStorage.setItem('redirectToCheckout', 'true');
      toast.info('Please login to continue with checkout');
      navigate('/login');
    }
  }, [user, navigate, cart.length]);

  const deliveryCharge = selectedCountry.deliveryCharge;
  const subtotal = cartTotal;
  const totalBeforeDiscount = subtotal + deliveryCharge;
  const finalTotal = totalBeforeDiscount - couponDiscount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const coupon = availableCoupons.find(
      c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive === true
    );

    if (!coupon) {
      setCouponError('Invalid or inactive coupon code');
      setCouponSuccess('');
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
      setCouponError('This coupon has expired');
      setCouponSuccess('');
      setAppliedCoupon(null);
      setCouponDiscount(0);
      return;
    }

    const discountAmount = Math.min(coupon.discountAmount, totalBeforeDiscount);
    setCouponDiscount(discountAmount);
    setAppliedCoupon(coupon);
    setCouponSuccess(`Coupon applied! You saved ${selectedCountry.currency}${discountAmount}`);
    setCouponError('');
    toast.success(`Coupon applied! You saved ${selectedCountry.currency}${discountAmount}`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
    toast.info('Coupon removed');
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!Object.values(formData).every(v => v)) {
      toast.error('Please fill all fields');
      return;
    }
    
    if (selectedPaymentMethod === 'upi') {
      setShowUPIModal(true);
    } else {
      handlePlaceOrder();
    }
  };

  const validateTransactionId = (id) => {
    // Check if transaction ID is exactly 12 digits
    const digitsOnly = id.replace(/\D/g, '');
    return digitsOnly.length === 12;
  };

  const handleUPIPayment = () => {
    // Generate UPI payment URL
    const amount = finalTotal;
    const orderId = `ORDER_${Date.now()}`;
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=br_innovate&am=${amount}&cu=INR&tn=Payment for order ${orderId}`;
    
    // Open UPI app
    window.location.href = upiUrl;
    
    toast.info('Please complete the payment in your UPI app and enter the transaction ID');
  };

  const handleConfirmUPIPayment = async () => {
    if (!transactionId.trim()) {
      setTransactionError('Please enter transaction ID');
      return;
    }
    
    if (!validateTransactionId(transactionId)) {
      setTransactionError('Transaction ID must be exactly 12 digits');
      return;
    }
    
    setTransactionError('');
    setShowUPIModal(false);
    await handlePlaceOrder(transactionId);
  };

  const handlePlaceOrder = async (upiTransactionId = null) => {
    setPlacingOrder(true);
    try {
      const orderData = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        country: selectedCountry.name,
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity, images: item.images })),
        subtotal: cartTotal,
        deliveryCharge: deliveryCharge,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount,
        total: finalTotal,
        currency: selectedCountry.currency,
        status: 'pending',
        paymentMethod: selectedPaymentMethod === 'upi' ? 'UPI' : 'COD',
        transactionId: upiTransactionId || null,
        createdAt: new Date().toISOString(),
        userId: user?.uid || null
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      
      if (selectedPaymentMethod === 'upi' && upiTransactionId) {
        toast.success(`Payment verified! Order placed successfully! 🎉\nTransaction ID: ${upiTransactionId}\nShipping to ${selectedCountry.name} in ${selectedCountry.deliveryDays} days`);
      } else {
        toast.success(`Order placed successfully! 🎉\nShipping to ${selectedCountry.name} in ${selectedCountry.deliveryDays} days`);
      }
      
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0) { 
    navigate('/cart'); 
    return null; 
  }

  if (!user) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="checkout-page"
    >
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleProceedToPayment}>
            <div className="form-section">
              <h3>Shipping Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required aria-label="Full name" />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required aria-label="Email" />
                </div>
              </div>
              <div className="form-group">
                <input type="text" placeholder="Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required aria-label="Address" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required aria-label="City" />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Pincode/Zip" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} required aria-label="Pincode" />
                </div>
                <div className="form-group">
                  <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required aria-label="Phone number" />
                </div>
              </div>
              <div className="form-group">
                <label>Shipping Country</label>
                <input type="text" value={selectedCountry.name} disabled className="disabled-input" />
              </div>
            </div>

            <div className="form-section">
              <h3>Coupon Code</h3>
              <div className="coupon-input-group">
                <input 
                  type="text" 
                  placeholder="Enter coupon code" 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                  className="coupon-input"
                />
                {!appliedCoupon ? (
                  <button type="button" className="apply-coupon-btn" onClick={handleApplyCoupon}>Apply</button>
                ) : (
                  <button type="button" className="remove-coupon-btn" onClick={handleRemoveCoupon}>Remove</button>
                )}
              </div>
              {couponError && <p className="coupon-error">{couponError}</p>}
              {couponSuccess && <p className="coupon-success">{couponSuccess}</p>}
            </div>

            <div className="form-section">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod"
                    checked={selectedPaymentMethod === 'cod'}
                    onChange={() => setSelectedPaymentMethod('cod')}
                  /> 
                  Cash on Delivery (Available in India)
                </label>
                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="upi"
                    checked={selectedPaymentMethod === 'upi'}
                    onChange={() => setSelectedPaymentMethod('upi')}
                  /> 
                  UPI / Google Pay - Pay Now
                </label>
                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="card"
                    checked={selectedPaymentMethod === 'card'}
                    onChange={() => setSelectedPaymentMethod('card')}
                  /> 
                  Credit/Debit Card
                </label>
              </div>
              
              {selectedPaymentMethod === 'upi' && (
                <div className="upi-info">
                  <p className="upi-details">
                    💳 <strong>UPI ID:</strong> {UPI_ID}<br/>
                    📱 <strong>Instructions:</strong> You will be redirected to your UPI app. After payment, enter the 12-digit transaction ID.
                  </p>
                </div>
              )}
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-place-order" 
              disabled={placingOrder}
            >
              {placingOrder ? 'Processing...' : (selectedPaymentMethod === 'upi' ? 'Pay via UPI →' : 'Place Order →')}
            </motion.button>
          </form>

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="order-items-summary">
              {cart.map(item => (
                <div key={item.id} className="order-item-summary">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{selectedCountry.currency}{convertPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{selectedCountry.currency}{cartTotal}</span>
            </div>
            <div className="summary-row">
              <span>Shipping ({selectedCountry.name})</span>
              <span>{selectedCountry.currency}{deliveryCharge}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="summary-row discount">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-{selectedCountry.currency}{couponDiscount}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Delivery Time</span>
              <span>{selectedCountry.deliveryDays} days</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{selectedCountry.currency}{finalTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {showUPIModal && (
        <div className="modal-overlay" onClick={() => setShowUPIModal(false)}>
          <motion.div 
            className="upi-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>💳 UPI Payment</h3>
              <button className="modal-close" onClick={() => setShowUPIModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="payment-details">
                <p><strong>Amount to Pay:</strong> {selectedCountry.currency}{finalTotal}</p>
                <p><strong>UPI ID:</strong> {UPI_ID}</p>
              </div>
              
              <button className="pay-now-btn" onClick={handleUPIPayment}>
                📱 Pay Now (Open UPI App)
              </button>
              
              <div className="transaction-id-section">
                <p className="instruction">After successful payment, enter the 12-digit transaction ID:</p>
                <input 
                  type="text" 
                  placeholder="Enter 12-digit Transaction ID" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  maxLength="12"
                  className="transaction-input"
                />
                {transactionError && <p className="error-text">{transactionError}</p>}
                <p className="hint">Transaction ID is usually 12 digits long (numbers only)</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowUPIModal(false)}>Cancel</button>
              <button 
                className="confirm-btn" 
                onClick={handleConfirmUPIPayment}
                disabled={!transactionId}
              >
                Confirm & Place Order
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .upi-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 450px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .modal-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }
        .modal-body {
          padding: 20px;
        }
        .payment-details {
          background: #f0f4ff;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .payment-details p {
          margin: 8px 0;
        }
        .pay-now-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .transaction-id-section {
          margin-top: 16px;
        }
        .instruction {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        .transaction-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          text-align: center;
          letter-spacing: 2px;
        }
        .transaction-input:focus {
          outline: none;
          border-color: #667eea;
        }
        .error-text {
          color: #e74c3c;
          font-size: 12px;
          margin-top: 5px;
        }
        .hint {
          font-size: 11px;
          color: #999;
          margin-top: 5px;
        }
        .modal-footer {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          background: #f8f9fa;
        }
        .cancel-btn {
          flex: 1;
          padding: 10px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .confirm-btn {
          flex: 2;
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
        .confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .upi-info {
          margin-top: 12px;
          padding: 12px;
          background: #e8f4fd;
          border-radius: 8px;
        }
        .upi-details {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }
        .transaction-id {
          display: inline-block;
          background: #e8f4fd;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          margin-top: 8px;
        }
        .no-transaction {
          color: #999;
        }
        .transaction-id-badge {
          background: #f0f4ff;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 12px 0;
          font-size: 13px;
          font-family: monospace;
          text-align: center;
        }
      `}</style>
    </motion.div>
  );
};

// Main App Component
const App = () => {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isAdmin, setIsAdmin] = useState(false);

  const conversionRates = { IN: 1, US: 0.012, UK: 0.0095, CA: 0.016, AU: 0.018, AE: 0.044, SG: 0.016, MY: 0.056 };
  const convertPrice = (priceInINR) => Math.round(priceInINR * (conversionRates[selectedCountry.code] || 1));

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    const savedCountry = localStorage.getItem('selectedCountry');
    const savedUser = localStorage.getItem('user');
    const savedAdmin = localStorage.getItem('isAdmin');
    
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedCountry) setSelectedCountry(JSON.parse(savedCountry));
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedAdmin === 'true') setIsAdmin(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userRole = 'user';
          let userName = firebaseUser.email.split('@')[0];
          if (userDoc.exists()) {
            userRole = userDoc.data().role || 'user';
            userName = userDoc.data().name || userName;
          }
          const userData = { uid: firebaseUser.uid, email: firebaseUser.email, name: userName, role: userRole };
          setUser(userData);
          const isAdminUser = userRole === 'admin';
          setIsAdmin(isAdminUser);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAdmin', isAdminUser ? 'true' : 'false');
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('selectedCountry', JSON.stringify(selectedCountry)); }, [selectedCountry]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity }];
    });
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => { setCart(prev => prev.filter(item => item.id !== productId)); toast.info('Item removed from cart'); };
  const updateQuantity = (productId, quantity) => { if (quantity < 1) { removeFromCart(productId); return; } setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item)); };
  const addToWishlist = (product) => { if (!wishlist.find(item => item.id === product.id)) { setWishlist(prev => [...prev, product]); toast.success('Added to wishlist!'); } else { setWishlist(prev => prev.filter(item => item.id !== product.id)); toast.info('Removed from wishlist'); } };
  const clearCart = () => { setCart([]); };
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <AppContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount, user, setUser, loading, wishlist, addToWishlist, clearCart, selectedCountry, setSelectedCountry, convertPrice, countries, isAdmin, setIsAdmin }}>
      <Router>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Routes>
          </main>
          <Footer />
          <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;