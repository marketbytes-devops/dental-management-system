export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">System overview and clinic performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Patients</p>
            <h3 className="text-2xl font-bold text-gray-900">2,543</h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> 12% this month
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-secondary/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">₹45,200</h3>
            <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
              <span>↑</span> 8% vs yesterday
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-warning/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Doctors</p>
            <h3 className="text-2xl font-bold text-gray-900">12</h3>
            <p className="text-xs text-gray-500 font-medium mt-2">
              Across 3 departments
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group hover:border-danger/30 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">System Alerts</p>
            <h3 className="text-2xl font-bold text-gray-900">3</h3>
            <p className="text-xs text-danger font-medium mt-2">
              Requires attention
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                👤
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New User Registered</p>
                <p className="text-xs text-gray-500">Dr. Sarah Smith was added to the Orthodontics department.</p>
              </div>
              <span className="text-xs text-gray-400">2 min ago</span>
            </div>
            <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                💸
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">High-Value Payment Received</p>
                <p className="text-xs text-gray-500">Invoice #INV-052 paid in full (₹45,000).</p>
              </div>
              <span className="text-xs text-gray-400">1 hr ago</span>
            </div>
            <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                ⚙️
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Role Permissions Updated</p>
                <p className="text-xs text-gray-500">Lab Technician permissions modified by Admin.</p>
              </div>
              <span className="text-xs text-gray-400">3 hrs ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Module Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Patient Portal</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Doctor Module</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-warning"></span>
                <span className="text-sm font-medium text-gray-700">Lab Technician</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-warning/10 text-warning rounded-md">High Load</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm font-medium text-gray-700">Billing System</span>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-success/10 text-success rounded-md">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
