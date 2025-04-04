import { Route, Routes, useNavigate } from "react-router-dom";
import UserProfile from "../UserProfile";
import AddressComponent from "../AddressComponent";
import PanCardComponent from "../PanCardComponent";
import CreateProduct from "./CreateProduct";
import AllProducts from "./AllProducts";
import Users from "./Users";
import Deactivate from "../Auth/Deactivate";
import EditProduct from "./EditProduct";
import SeoData from "../../SEO/SeoData";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/auth";
import axios from "axios";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner";
import { 
  FaBox, 
  FaUsers, 
  FaShoppingCart,
  FaStore,
  FaChartLine, 
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaSearch,
  FaBell,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";
import { MdInventory, MdCategory, MdDashboard } from "react-icons/md";
import { BsCurrencyDollar, BsGraphUp } from "react-icons/bs";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { auth, setAuth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
      totalProducts: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      lowStockProducts: 0,
      categories: 0,
      monthlyRevenue: 0,
      dailyOrders: 0,
      activeUsers: 0,
      pendingOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [selectedTimeRange, setSelectedTimeRange] = useState("week");
    const [revenueChartData, setRevenueChartData] = useState({
      labels: [],
      datasets: [
        {
          label: 'Revenue',
          data: [],
          fill: true,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    });
    const [ordersChartData, setOrdersChartData] = useState({
      labels: [],
      datasets: [
        {
          label: 'Orders',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }
      ]
    });
    const [categoryChartData, setCategoryChartData] = useState({
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)'
          ],
          borderWidth: 1
        }
      ]
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                // Check if auth token exists
                if (!auth?.token) {
                    console.error("No auth token available");
                    setLoading(false);
                    return;
                }
                
                console.log("Fetching dashboard data with token:", auth.token.substring(0, 10) + "...");
                
                // Fetch products
                const productsRes = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/product/seller-product`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                
                // Fetch orders
                const ordersRes = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/admin-orders`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                
                // Fetch users
                const usersRes = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/user/all-users`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                
                // Process data
                const products = productsRes.data.products || [];
                const orders = ordersRes.data.orders || [];
                const users = usersRes.data.users || [];
                
                console.log(`Fetched ${products.length} products, ${orders.length} orders, and ${users.length} users`);
                
                // Calculate statistics
                const totalRevenue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
                const lowStockProducts = products.filter(product => product.stock < 10).length;
                const monthlyRevenue = orders
                    .filter(order => new Date(order.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                    .reduce((sum, order) => sum + (order.amount || 0), 0);
                const dailyOrders = orders.filter(order => 
                    new Date(order.createdAt).toDateString() === new Date().toDateString()
                ).length;
                const activeUsers = users.filter(user => 
                    new Date(user.lastLogin || user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ).length;
                const pendingOrders = orders.filter(order => order.orderStatus === "Processing").length;
                
                // Get unique categories
                const categories = [...new Set(products.map(product => product.category))];
                
                // Set stats
                setStats({
                    totalProducts: products.length,
                    totalUsers: users.length,
                    totalOrders: orders.length,
                    totalRevenue,
                    lowStockProducts,
                    categories: categories.length,
                    monthlyRevenue,
                    dailyOrders,
                    activeUsers,
                    pendingOrders
                });
                
                // Set recent data
                setRecentOrders(orders.slice(0, 5));
                setRecentProducts(products.slice(0, 5));

                // Generate dynamic chart data
                generateChartData(orders, products);

                // Generate sample notifications
                setNotifications([
                    {
                        id: 1,
                        type: "order",
                        message: "New order received",
                        time: "5 minutes ago",
                        read: false
                    },
                    {
                        id: 2,
                        type: "stock",
                        message: `Low stock alert for ${lowStockProducts} products`,
                        time: "1 hour ago",
                        read: false
                    },
                    {
                        id: 3,
                        type: "user",
                        message: "New user registration",
                        time: "2 hours ago",
                        read: true
                    }
                ]);
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                
                // Log detailed error information
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error("Error response data:", error.response.data);
                    console.error("Error response status:", error.response.status);
                    console.error("Error response headers:", error.response.headers);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error("Error request:", error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error("Error message:", error.message);
                }
                
                // Check if it's an authentication error
                if (error.response?.status === 401) {
                    console.error("Authentication error - token may be invalid or expired");
                }
                
                setLoading(false);
            }
        };
        
        if (auth?.token) {
            fetchDashboardData();
        } else {
            console.log("No auth token available, skipping dashboard data fetch");
            setLoading(false);
        }
    }, [auth?.token]);

    // Function to generate dynamic chart data
    const generateChartData = (orders, products) => {
        // Generate revenue chart data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        
        const dailyRevenue = last7Days.map(day => {
            const dayOrders = orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.toLocaleDateString('en-US', { weekday: 'short' }) === day;
            });
            return dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        });
        
        setRevenueChartData({
            labels: last7Days,
            datasets: [
                {
                    label: 'Revenue',
                    data: dailyRevenue,
                    fill: true,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                }
            ]
        });
        
        // Generate orders chart data (last 7 days)
        const dailyOrders = last7Days.map(day => {
            return orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.toLocaleDateString('en-US', { weekday: 'short' }) === day;
            }).length;
        });
        
        setOrdersChartData({
            labels: last7Days,
            datasets: [
                {
                    label: 'Orders',
                    data: dailyOrders,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }
            ]
        });
        
        // Generate category distribution chart data
        const categoryCounts = {};
        products.forEach(product => {
            if (categoryCounts[product.category]) {
                categoryCounts[product.category]++;
            } else {
                categoryCounts[product.category] = 1;
            }
        });
        
        const categoryLabels = Object.keys(categoryCounts);
        const categoryValues = Object.values(categoryCounts);
        
        // Generate colors for categories
        const colors = [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(201, 203, 207, 0.5)',
            'rgba(255, 99, 71, 0.5)',
            'rgba(50, 205, 50, 0.5)',
            'rgba(147, 112, 219, 0.5)'
        ];
        
        const borderColors = colors.map(color => color.replace('0.5', '1'));
        
        setCategoryChartData({
            labels: categoryLabels,
            datasets: [
                {
                    data: categoryValues,
                    backgroundColor: colors.slice(0, categoryLabels.length),
                    borderColor: borderColors.slice(0, categoryLabels.length),
                    borderWidth: 1
                }
            ]
        });
        
        console.log("Chart data generated successfully");
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    const handleLogout = () => {
        setAuth({
            ...auth,
            user: null,
            token: null
        });
        localStorage.removeItem("auth");
    };

    const DashboardContent = () => {
        return (
            <div className="min-h-screen bg-gray-100">
                {/* Top Navigation Bar */}
                <div className="bg-white shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <MdDashboard className="text-2xl text-primaryBlue mr-2" />
                                <span className="text-xl font-semibold">Admin Dashboard</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                </div>
                                <div className="relative">
                                    <button className="p-2 hover:bg-gray-100 rounded-full">
                                        <FaBell className="text-xl text-gray-600" />
                                        {notifications.filter(n => !n.read).length > 0 && (
                                            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                {notifications.filter(n => !n.read).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Link to="/admin/dashboard/profile" className="p-2 hover:bg-gray-100 rounded-full">
                                        <FaUsers className="text-xl text-gray-600" />
                                    </Link>
                                    <Link to="/admin/dashboard/all-products" className="p-2 hover:bg-gray-100 rounded-full">
                                        <FaBox className="text-xl text-gray-600" />
                                    </Link>
                                    <Link to="/admin/orders" className="p-2 hover:bg-gray-100 rounded-full">
                                        <FaShoppingCart className="text-xl text-gray-600" />
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <FaSignOutAlt className="text-xl text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Time Range Selector */}
                    <div className="mb-6 flex justify-end">
                        <select
                            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primaryBlue"
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                        >
                            <option value="day">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Products</p>
                                    <h3 className="text-2xl font-bold">{stats.totalProducts}</h3>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <FaBox className="text-blue-600 text-xl" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                {stats.lowStockProducts > 0 ? (
                                    <>
                                        <FaExclamationTriangle className="text-yellow-500 mr-1" />
                                        <span className="text-yellow-500">{stats.lowStockProducts} low stock</span>
                                    </>
                                ) : (
                                    <>
                                        <FaArrowUp className="text-green-500 mr-1" />
                                        <span className="text-green-500">All stocked</span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Users</p>
                                    <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <FaUsers className="text-green-600 text-xl" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                <FaArrowUp className="text-green-500 mr-1" />
                                <span className="text-green-500">{stats.activeUsers} active</span>
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Orders</p>
                                    <h3 className="text-2xl font-bold">{stats.totalOrders}</h3>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <FaShoppingCart className="text-purple-600 text-xl" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                {stats.pendingOrders > 0 ? (
                                    <>
                                        <FaExclamationTriangle className="text-yellow-500 mr-1" />
                                        <span className="text-yellow-500">{stats.pendingOrders} pending</span>
                                    </>
                                ) : (
                                    <>
                                        <FaArrowUp className="text-green-500 mr-1" />
                                        <span className="text-green-500">All processed</span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Revenue</p>
                                    <h3 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</h3>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <BsCurrencyDollar className="text-yellow-600 text-xl" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                <FaArrowUp className="text-green-500 mr-1" />
                                <span className="text-green-500">{formatCurrency(stats.monthlyRevenue)} this month</span>
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm">Active Users</p>
                                    <h3 className="text-2xl font-bold">{stats.activeUsers}</h3>
                                </div>
                                <div className="bg-indigo-100 p-3 rounded-full">
                                    <FaUsers className="text-indigo-600 text-xl" />
                                </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                <FaArrowUp className="text-green-500 mr-1" />
                                <span className="text-green-500">{stats.dailyOrders} orders today</span>
                            </div>
                        </div>
                    </div>



                    {/* Quick Actions */}
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <Link to="/admin/dashboard/add-product" className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                <FaBox className="text-blue-600 text-2xl mb-2" />
                                <span className="text-sm font-medium text-center">Add Product</span>
                            </Link>
                            
                            <Link to="/admin/dashboard/all-products" className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                <MdInventory className="text-green-600 text-2xl mb-2" />
                                <span className="text-sm font-medium text-center">Manage Products</span>
                            </Link>
                            
                            <Link to="/admin/orders" className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                <FaShoppingCart className="text-purple-600 text-2xl mb-2" />
                                <span className="text-sm font-medium text-center">Manage Orders</span>
                            </Link>
                            
                            <Link to="/admin/dashboard/users" className="flex flex-col items-center justify-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                                <FaUsers className="text-yellow-600 text-2xl mb-2" />
                                <span className="text-sm font-medium text-center">Manage Users</span>
                            </Link>
                            
                            <Link to="/admin/dashboard/profile" className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                <FaUsers className="text-indigo-600 text-2xl mb-2" />
                                <span className="text-sm font-medium text-center">Profile Settings</span>
                            </Link>

                            <Link to="/admin/dashboard/profile" className="flex flex-col items-center justify-center p-4 bg-grey-50 rounded-lg hover:bg-indigo-100 transition-colors">
                                <FaStore className="text-indigo-600 text-2xl mb-2" />
                                <span className="text-sm font-medium text-center">View Store</span>
                            </Link>
                        </div>
                    </div>




                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Revenue Chart */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Revenue Overview</h2>
                                <BsGraphUp className="text-xl text-gray-600" />
                            </div>
                            <div className="h-64">
                                <Line 
                                    data={revenueChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Orders Chart */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Orders Overview</h2>
                                <FaShoppingCart className="text-xl text-gray-600" />
                            </div>
                            <div className="h-64">
                                <Bar 
                                    data={ordersChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats and Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Category Distribution */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Category Distribution</h2>
                                <MdCategory className="text-xl text-gray-600" />
                            </div>
                            <div className="h-48">
                                <Doughnut 
                                    data={categoryChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'bottom'
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Recent Orders</h2>
                                <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline">
                                    View All
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentOrders.length > 0 ? (
                                            recentOrders.map((order) => (
                                                <tr key={order._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {order._id.substring(0, 8)}...
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {order.buyer?.name || "Guest"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(order.createdAt)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(order.amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            order.orderStatus === "Delivered" 
                                                                ? "bg-green-100 text-green-800" 
                                                                : order.orderStatus === "Processing" 
                                                                ? "bg-yellow-100 text-yellow-800" 
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}>
                                                            {order.orderStatus || "Pending"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No orders found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Recent Products */}
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Recent Products</h2>
                            <Link to="/admin/dashboard/all-products" className="text-blue-600 text-sm hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentProducts.length > 0 ? (
                                        recentProducts.map((product) => (
                                            <tr key={product._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <img 
                                                                className="h-10 w-10 rounded-full object-cover" 
                                                                src={product.images[0]?.url || "https://via.placeholder.com/40"} 
                                                                alt={product.name} 
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {product.brand?.name || "No Brand"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatCurrency(product.discountPrice)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.stock}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        product.stock > 10 
                                                            ? "bg-green-100 text-green-800" 
                                                            : product.stock > 0 
                                                            ? "bg-yellow-100 text-yellow-800" 
                                                            : "bg-red-100 text-red-800"
                                                    }`}>
                                                        {product.stock > 10 ? "In Stock" : product.stock > 0 ? "Low Stock" : "Out of Stock"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                                No products found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    
                </div>
            </div>
        );
    };

    return (
        <>
            <SeoData title="Admin Dashboard" />
            <div className="min-h-screen bg-gray-100">
                <Routes>
                    <Route path="" element={loading ? <div className="flex justify-center items-center h-[80vh]"><Spinner /></div> : <DashboardContent />} />
                    <Route path="profile" element={<UserProfile />} />
                    <Route path="address" element={<AddressComponent />} />
                    <Route path="pan" element={<PanCardComponent />} />
                    <Route path="add-product" element={<CreateProduct />} />
                    <Route path="all-products" element={<AllProducts />} />
                    <Route path="users" element={<Users />} />
                    <Route path="profile/deactivate" element={<Deactivate />} />
                    <Route path="product/:productId" element={<EditProduct />} />
                </Routes>
            </div>
        </>
    );
};

export default AdminDashboard;
