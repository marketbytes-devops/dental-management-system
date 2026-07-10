"use client";

import {
    Bell,
    Search,
    Plus,
    MessageCircle,
    Phone,
    Mail,
    HelpCircle,
    CheckCircle2,
    Clock3,
    AlertCircle,
    Users,
    BarChart3,
} from "lucide-react";

const stats = [
    {
        title: "Open Tickets",
        value: "24",
        icon: <HelpCircle className="h-6 w-6 text-blue-600" />,
        color: "bg-blue-100",
    },
    {
        title: "Live Chats",
        value: "12",
        icon: <MessageCircle className="h-6 w-6 text-green-600" />,
        color: "bg-green-100",
    },
    {
        title: "Resolved Today",
        value: "38",
        icon: <CheckCircle2 className="h-6 w-6 text-purple-600" />,
        color: "bg-purple-100",
    },
    {
        title: "Customers",
        value: "142",
        icon: <Users className="h-6 w-6 text-orange-600" />,
        color: "bg-orange-100",
    },
];

const tickets = [
    {
        id: "#1042",
        issue: "Unable to login",
        customer: "John Smith",
        status: "Pending",
    },
    {
        id: "#1041",
        issue: "Billing inquiry",
        customer: "Emma Wilson",
        status: "Resolved",
    },
    {
        id: "#1039",
        issue: "Password reset",
        customer: "Michael Brown",
        status: "In Progress",
    },
    {
        id: "#1038",
        issue: "Appointment change",
        customer: "Sophia Davis",
        status: "Pending",
    },
];

const activities = [
    "New ticket received from John Smith",
    "Billing issue resolved",
    "Customer started live chat",
    "Support call completed",
];

export default function ReceptionistSupport() {
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Receptionist Support
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Manage customer requests and support services
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                className="pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button className="relative p-2 rounded-lg hover:bg-gray-100">
                            <Bell className="h-6 w-6" />
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Welcome Card */}
                <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow-lg">
                    <h2 className="text-3xl font-bold">
                        Welcome Back 👋
                    </h2>

                    <p className="mt-2 text-blue-100 max-w-xl">
                        Easily manage support tickets, appointments, live chats,
                        and customer inquiries from one dashboard.
                    </p>

                    <button className="mt-6 bg-white text-blue-600 px-5 py-3 rounded-xl font-semibold hover:bg-gray-100">
                        Create New Ticket
                    </button>
                </div>

                {/* Stats */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item) => (
                        <div
                            key={item.title}
                            className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center hover:shadow-lg transition"
                        >
                            <div>
                                <p className="text-gray-500">{item.title}</p>
                                <h3 className="text-3xl font-bold mt-2">
                                    {item.value}
                                </h3>
                            </div>

                            <div
                                className={`${item.color} h-14 w-14 rounded-xl flex items-center justify-center`}
                            >
                                {item.icon}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-xl font-bold mb-4">
                        Quick Actions
                    </h2>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <ActionCard
                            icon={<Plus />}
                            title="New Ticket"
                            subtitle="Create support request"
                        />

                        <ActionCard
                            icon={<MessageCircle />}
                            title="Live Chat"
                            subtitle="Chat with customers"
                        />

                        <ActionCard
                            icon={<Phone />}
                            title="Call Support"
                            subtitle="Contact customer"
                        />

                        <ActionCard
                            icon={<Mail />}
                            title="Send Email"
                            subtitle="Respond quickly"
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Tickets */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">
                                Recent Tickets
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-left">
                                        <th className="p-4">Ticket</th>
                                        <th>Issue</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            className="border-t hover:bg-gray-50"
                                        >
                                            <td className="p-4 font-semibold">
                                                {ticket.id}
                                            </td>

                                            <td>{ticket.issue}</td>

                                            <td>{ticket.customer}</td>

                                            <td>
                                                <StatusBadge status={ticket.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-lg mb-5">
                                Today's Summary
                            </h3>

                            <SummaryRow
                                icon={<BarChart3 />}
                                label="Total Requests"
                                value="54"
                            />

                            <SummaryRow
                                icon={<Clock3 />}
                                label="Pending"
                                value="14"
                            />

                            <SummaryRow
                                icon={<CheckCircle2 />}
                                label="Completed"
                                value="38"
                            />

                            <SummaryRow
                                icon={<AlertCircle />}
                                label="Urgent"
                                value="2"
                            />
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-lg mb-5">
                                Recent Activity
                            </h3>

                            <div className="space-y-4">
                                {activities.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 items-start"
                                    >
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-600"></div>

                                        <p className="text-sm text-gray-600">
                                            {activity}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-blue-600 text-white p-6 shadow-lg">
                            <MessageCircle className="h-10 w-10 mb-4" />

                            <h3 className="text-xl font-bold">
                                Need Immediate Help?
                            </h3>

                            <p className="text-blue-100 mt-2">
                                Connect with customers instantly using live chat.
                            </p>

                            <button className="mt-5 w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-gray-100">
                                Start Live Chat
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ActionCard({ icon, title, subtitle }) {
    return (
        <button className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                {icon}
            </div>

            <h3 className="mt-5 font-semibold text-lg">
                {title}
            </h3>

            <p className="text-gray-500 text-sm mt-1">
                {subtitle}
            </p>
        </button>
    );
}

function SummaryRow({ icon, label, value }) {
    return (
        <div className="flex justify-between items-center py-3 border-b last:border-0">
            <div className="flex gap-3 items-center text-gray-600">
                {icon}
                <span>{label}</span>
            </div>

            <span className="font-bold">{value}</span>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        Pending: "bg-yellow-100 text-yellow-700",
        Resolved: "bg-green-100 text-green-700",
        "In Progress": "bg-blue-100 text-blue-700",
    };

    return (
        <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]
                }`}
        >
            {status}
        </span>
    );
}