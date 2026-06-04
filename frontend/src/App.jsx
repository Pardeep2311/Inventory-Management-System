import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [productForm, setProductForm] = useState({ sku: '', name: '', price: '', stock_quantity: '' });
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '' });
  const [orderForm, setOrderForm] = useState({ customer_id: '', product_id: '', quantity: 1 });

  // Fetch Data on Load
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [resProducts, resCustomers, resOrders] = await Promise.all([
        fetch(`${API_BASE_URL}/products`).then(res => res.json()),
        fetch(`${API_BASE_URL}/customers`).then(res => res.json()),
        fetch(`${API_BASE_URL}/orders`).then(res => res.json())
      ]);
      setProducts(resProducts || []);
      setCustomers(resCustomers || []);
      setOrders(resOrders || []);
    } catch (err) {
      setError('Failed to fetch data from backend API. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, isSuccess = true) => {
    if (isSuccess) {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(''), 5000);
    }
  };

  // Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          stock_quantity: parseInt(productForm.stock_quantity)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add product');
      
      showToast('Product added successfully!');
      setProductForm({ sku: '', name: '', price: '', stock_quantity: '' });
      fetchData();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  // Add Customer Submit
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add customer');

      showToast('Customer registered successfully!');
      setCustomerForm({ name: '', email: '', phone: '' });
      fetchData();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  // Place Order Submit (Handles Stock Validation)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.customer_id || !orderForm.product_id) {
      showToast('Please select both a customer and a product.', false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(orderForm.customer_id),
          product_id: parseInt(orderForm.product_id),
          quantity: parseInt(orderForm.quantity)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to place order');

      showToast('Order placed successfully! Stock updated.');
      setOrderForm({ customer_id: '', product_id: '', quantity: 1 });
      fetchData();
    } catch (err) {
      showToast(err.message, false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Top Banner / Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-bold tracking-wider text-xl">IMS</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Inventory & Order System</h1>
              <p className="text-xs text-slate-400">Enterprise Control Panel</p>
            </div>
          </div>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🔄 Sync System Data
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-xl flex items-center gap-2 text-sm animate-pulse">
            🚨 <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-900/50 border border-emerald-500 text-emerald-200 rounded-xl flex items-center gap-2 text-sm">
            ✅ <strong>Success:</strong> {success}
          </div>
        )}

        {/* Quick Insights Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/60 p-6 rounded-2xl shadow-xl">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total SKUs Tracked</p>
            <h3 className="text-3xl font-extrabold text-blue-400 mt-2">{products.length}</h3>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/60 p-6 rounded-2xl shadow-xl">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Registered Customers</p>
            <h3 className="text-3xl font-extrabold text-purple-400 mt-2">{customers.length}</h3>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/60 p-6 rounded-2xl shadow-xl">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Processed Orders</p>
            <h3 className="text-3xl font-extrabold text-emerald-400 mt-2">{orders.length}</h3>
          </div>
        </div>

        {/* Dynamic Section Navigation Tabs */}
        <div className="flex border-b border-slate-700 mb-8 overflow-x-auto">
          {['products', 'customers', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold text-sm capitalize border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400 bg-slate-800/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {tab === 'products' && '📦 Product Registry'}
              {tab === 'customers' && '👥 Customer Database'}
              {tab === 'orders' && '🛒 Order Fullfillment'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading live data arrays...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT 2 COLUMNS: Main Data Explorer Table */}
            <div className="lg:col-span-2 bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 shadow-xl overflow-hidden">
              
              {activeTab === 'products' && (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">Inventory Status Overview</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 font-medium">
                          <th className="py-3 px-4">SKU</th>
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4 text-center">Available Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {products.length === 0 ? (
                          <tr><td colSpan="4" className="py-6 text-center text-slate-500">No products logged in database.</td></tr>
                        ) : products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-700/30 transition">
                            <td className="py-3 px-4 font-mono text-xs text-blue-300 font-semibold">{p.sku}</td>
                            <td className="py-3 px-4 text-slate-200 font-medium">{p.name}</td>
                            <td className="py-3 px-4 text-slate-300">${p.price?.toFixed(2)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                p.stock_quantity > 10 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                                p.stock_quantity > 0 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                'bg-red-950 text-red-400 border border-red-800'
                              }`}>
                                {p.stock_quantity} units
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'customers' && (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">Active Accounts</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 font-medium">
                          <th className="py-3 px-4">Customer ID</th>
                          <th className="py-3 px-4">Full Name</th>
                          <th className="py-3 px-4">Email Address</th>
                          <th className="py-3 px-4">Phone Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {customers.length === 0 ? (
                          <tr><td colSpan="4" className="py-6 text-center text-slate-500">No customer accounts registered yet.</td></tr>
                        ) : customers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-700/30 transition">
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">#CUST-{c.id}</td>
                            <td className="py-3 px-4 text-slate-200 font-medium">{c.name}</td>
                            <td className="py-3 px-4 text-purple-300 font-mono text-xs">{c.email}</td>
                            <td className="py-3 px-4 text-slate-400">{c.phone || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">System Transaction Logs</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-700 text-slate-400 font-medium">
                          <th className="py-3 px-4">Order String</th>
                          <th className="py-3 px-4">Customer ID</th>
                          <th className="py-3 px-4">Product ID</th>
                          <th className="py-3 px-4">Quantity Ordered</th>
                          <th className="py-3 px-4 text-right">Total Invoiced</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {orders.length === 0 ? (
                          <tr><td colSpan="5" className="py-6 text-center text-slate-500">No sales transactions processed yet.</td></tr>
                        ) : orders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-700/30 transition">
                            <td className="py-3 px-4 font-mono text-xs text-emerald-400 font-bold">#ORD-{o.id}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs font-mono">ID: {o.customer_id}</td>
                            <td className="py-3 px-4 text-slate-300 text-xs font-mono">ID: {o.product_id}</td>
                            <td className="py-3 px-4 text-center font-semibold text-slate-200">{o.quantity}</td>
                            <td className="py-3 px-4 text-right text-emerald-300 font-semibold">${o.total_price?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Operational Contextual Control Forms */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl h-fit">
              {activeTab === 'products' && (
                <div>
                  <h3 className="text-md font-bold mb-4 text-slate-200 flex items-center gap-2">📦 Track New SKU</h3>
                  <form onSubmit={handleAddProduct} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Unique Code SKU</label>
                      <input type="text" required placeholder="e.g. PROD-LAP-001" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 font-mono text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Product Display Name</label>
                      <input type="text" required placeholder="MacBook Pro M3" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Unit Price ($)</label>
                        <input type="number" step="0.01" required placeholder="1299.99" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-white" />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Initial Stock</label>
                        <input type="number" required placeholder="25" value={productForm.stock_quantity} onChange={e => setProductForm({...productForm, stock_quantity: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 text-white" />
                      </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-semibold p-3 rounded-lg text-white transition mt-2 shadow-lg shadow-blue-900/20">Commit SKU to Registry</button>
                  </form>
                </div>
              )}

              {activeTab === 'customers' && (
                <div>
                  <h3 className="text-md font-bold mb-4 text-slate-200 flex items-center gap-2">👥 Provision Customer Account</h3>
                  <form onSubmit={handleAddCustomer} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Customer Full Name</label>
                      <input type="text" required placeholder="Jane Doe" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 text-white" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Unique Email Address</label>
                      <input type="email" required placeholder="jane.doe@example.com" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 text-white font-mono" />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Phone String (Optional)</label>
                      <input type="text" placeholder="+1 (555) 019-2834" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 text-white" />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 font-semibold p-3 rounded-lg text-white transition mt-2 shadow-lg shadow-purple-900/20">Save Profile Account</button>
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h3 className="text-md font-bold mb-4 text-slate-200 flex items-center gap-2">🛒 Process Transaction Order</h3>
                  <form onSubmit={handlePlaceOrder} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Target Customer Account</label>
                      <select required value={orderForm.customer_id} onChange={e => setOrderForm({...orderForm, customer_id: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-white">
                        <option value="">-- Choose Account Profile --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Product Item Selection</label>
                      <select required value={orderForm.product_id} onChange={e => setOrderForm({...orderForm, product_id: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-white">
                        <option value="">-- Select SKU Asset --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                            {p.name} [{p.sku}] - Stock: {p.stock_quantity} left (${p.price})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Purchase Quantity</label>
                      <input type="number" min="1" required value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-white" />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold p-3 rounded-lg text-white transition mt-2 shadow-lg shadow-emerald-900/20">Execute Order Transaction</button>
                  </form>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;