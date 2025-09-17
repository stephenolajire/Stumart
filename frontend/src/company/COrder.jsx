import { useState } from "react";
import {
  Package,
  User,
  MapPin,
  Clock,
  Shuffle,
  UserCheck,
  Filter,
  AlertCircle,
  CheckCircle,
  Timer,
  Phone,
  Navigation,
} from "lucide-react";

export default function OrderAssignmentInterface() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Mock data - replace with real API data
  const pendingOrders = [
    {
      id: "ORD001",
      customer: "John Doe",
      address: "Block A, Room 205",
      phone: "+234 801 234 5678",
      items: 3,
      value: 4500,
      priority: "high",
      timeCreated: "2 mins ago",
      vendor: "Campus Eats",
      estimatedTime: "25 mins",
      distance: "0.8 km",
    },
    {
      id: "ORD002",
      customer: "Sarah Smith",
      address: "Block B, Room 118",
      phone: "+234 802 345 6789",
      items: 1,
      value: 2200,
      priority: "medium",
      timeCreated: "8 mins ago",
      vendor: "Quick Mart",
      estimatedTime: "30 mins",
      distance: "1.2 km",
    },
    {
      id: "ORD003",
      customer: "Alex Brown",
      address: "Block C, Room 302",
      phone: "+234 803 456 7890",
      items: 2,
      value: 3800,
      priority: "high",
      timeCreated: "12 mins ago",
      vendor: "Campus Books",
      estimatedTime: "20 mins",
      distance: "0.5 km",
    },
    {
      id: "ORD004",
      customer: "Emma Davis",
      address: "Block D, Room 156",
      phone: "+234 804 567 8901",
      items: 4,
      value: 6200,
      priority: "medium",
      timeCreated: "15 mins ago",
      vendor: "Student Store",
      estimatedTime: "35 mins",
      distance: "1.5 km",
    },
    {
      id: "ORD005",
      customer: "Michael Johnson",
      address: "Block E, Room 221",
      phone: "+234 805 678 9012",
      items: 1,
      value: 1800,
      priority: "low",
      timeCreated: "22 mins ago",
      vendor: "Tech Hub",
      estimatedTime: "40 mins",
      distance: "2.1 km",
    },
  ];

  const availableRiders = [
    {
      id: 1,
      name: "Mike Johnson",
      currentLocation: "Block A Area",
      status: "available",
      rating: 4.8,
      completedToday: 12,
      estimatedArrival: "5 mins",
      phone: "+234 801 234 5678",
    },
    {
      id: 2,
      name: "David Wilson",
      currentLocation: "Block B Area",
      status: "available",
      rating: 4.6,
      completedToday: 8,
      estimatedArrival: "8 mins",
      phone: "+234 802 345 6789",
    },
    {
      id: 3,
      name: "James Lee",
      currentLocation: "Block C Area",
      status: "available",
      rating: 4.9,
      completedToday: 15,
      estimatedArrival: "3 mins",
      phone: "+234 803 456 7890",
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrders(
      selectedOrders.length === pendingOrders.length
        ? []
        : pendingOrders.map((o) => o.id)
    );
  };

  const handleRandomAssign = () => {
    if (selectedOrders.length === 0) {
      alert("Please select orders to assign");
      return;
    }

    // Simulate random assignment
    const assignments = selectedOrders.map((orderId) => {
      const randomRider =
        availableRiders[Math.floor(Math.random() * availableRiders.length)];
      return { orderId, riderId: randomRider.id, riderName: randomRider.name };
    });

    console.log("Random assignments:", assignments);
    alert(
      `Randomly assigned ${selectedOrders.length} orders to available riders`
    );
    setSelectedOrders([]);
  };

  const handleManualAssign = () => {
    if (selectedOrders.length === 0 || !selectedRider) {
      alert("Please select orders and a rider");
      return;
    }

    const rider = availableRiders.find(
      (r) => r.id.toString() === selectedRider
    );
    console.log(`Assigned ${selectedOrders.length} orders to ${rider?.name}`);
    alert(`Assigned ${selectedOrders.length} orders to ${rider?.name}`);
    setSelectedOrders([]);
    setSelectedRider("");
    setShowAssignModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Assignment
          </h1>
          <p className="text-gray-600">
            Assign pending orders to available riders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingOrders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Riders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableRiders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingOrders.filter((o) => o.priority === "high").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Timer className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦
                  {pendingOrders
                    .reduce((sum, order) => sum + order.value, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Pending Orders
                </h2>
                <div className="flex items-center space-x-3">
                  {selectedOrders.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {selectedOrders.length} selected
                    </span>
                  )}
                  <button
                    onClick={handleRandomAssign}
                    disabled={selectedOrders.length === 0}
                    className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Random Assign</span>
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={selectedOrders.length === 0}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Assign to Rider</span>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === pendingOrders.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500 mr-2"
                />
                <label className="text-sm text-gray-700">
                  Select All Orders
                </label>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4 p-6">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`border rounded-xl p-4 transition-all cursor-pointer ${
                      selectedOrders.includes(order.id)
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleSelectOrder(order.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {order.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {order.customer}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                            order.priority
                          )}`}
                        >
                          {order.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          {order.timeCreated}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {order.address}
                        </p>
                        <p className="flex items-center text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {order.phone}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">{order.items}</span>{" "}
                          items •
                          <span className="font-medium text-green-600">
                            {" "}
                            ₦{order.value.toLocaleString()}
                          </span>
                        </p>
                        <p className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {order.estimatedTime} • {order.distance}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Vendor: {order.vendor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Available Riders */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Available Riders
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {availableRiders.map((rider) => (
                <div
                  key={rider.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {rider.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {rider.currentLocation}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ★ {rider.rating}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rider.completedToday} today
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600 flex items-center">
                      <Navigation className="w-3 h-3 mr-1" />
                      {rider.estimatedArrival} away
                    </p>
                    <button className="text-yellow-600 hover:text-yellow-700 font-medium">
                      Assign Orders
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Assign to Rider
              </h2>
              <p className="text-gray-600 mb-6">
                Assign {selectedOrders.length} selected order(s) to a specific
                rider
              </p>

              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Select Rider
                </label>
                <select
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a rider...</option>
                  {availableRiders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} - {rider.currentLocation} (★ {rider.rating})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  disabled={!selectedRider}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
                >
                  Assign Orders
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
