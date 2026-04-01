export function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-purple-600 text-white",
    zone_lead: "bg-teal-600 text-white",
    volunteer: "bg-blue-500 text-white",
    instructor: "bg-amber-500 text-white",
    vendor: "bg-orange-500 text-white",
    reset_space_partner: "bg-emerald-600 text-white",
    guest: "bg-gray-400 text-white",
  };

  const labels: Record<string, string> = {
    admin: "Admin",
    zone_lead: "Zone Lead",
    volunteer: "Volunteer",
    instructor: "Instructor",
    vendor: "Vendor",
    reset_space_partner: "Reset Space Partner",
    guest: "Guest",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${colors[role] || "bg-gray-200 text-gray-700"}`}>
      {labels[role] || role}
    </span>
  );
}

export function ZoneBadge({ zone }: { zone: string }) {
  const colors: Record<string, string> = {
    "Move Floor": "bg-purple-200 text-purple-800",
    "Reset Space": "bg-teal-200 text-teal-800",
    "Link-Up": "bg-amber-200 text-amber-800",
    "Vendor Row": "bg-orange-200 text-orange-800",
    General: "bg-gray-200 text-gray-800",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors[zone] || "bg-gray-200 text-gray-700"}`}>
      {zone}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors[priority] || colors.low}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    declined: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}
