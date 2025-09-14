import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { 
  LayoutDashboard, Users, Phone, MapPin, BarChart3, 
  DollarSign, Settings, LogOut, UserCheck, Calendar, Building2 
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ];

    switch (user.role) {
      case 'admin':
        return [
          ...baseItems,
          { to: '/organizations', icon: Building2, label: 'Organizations' },
          { to: '/users', icon: Users, label: 'Team Management' },
          { to: '/leads', icon: UserCheck, label: 'Leads' },
          { to: '/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/commissions', icon: DollarSign, label: 'Commissions' },
        ];
      case 'supervisor':
        return [
          ...baseItems,
          { to: '/team', icon: Users, label: 'Team' },
          { to: '/leads', icon: UserCheck, label: 'Leads' },
          { to: '/meetings', icon: Calendar, label: 'Meetings' },
          { to: '/analytics', icon: BarChart3, label: 'Analytics' },
          { to: '/commissions', icon: DollarSign, label: 'Commissions' },
        ];
      case 'call_center':
        return [
          ...baseItems,
          { to: '/leads', icon: UserCheck, label: 'Leads' },
          { to: '/calls', icon: Phone, label: 'Calls' },
          { to: '/meetings', icon: Calendar, label: 'Meetings' },
          { to: '/performance', icon: BarChart3, label: 'Performance' },
        ];
      case 'field_agent':
        return [
          ...baseItems,
          { to: '/meetings', icon: Calendar, label: 'Meetings' },
          { to: '/field-visits', icon: MapPin, label: 'Field Visits' },
          { to: '/leads', icon: UserCheck, label: 'My Leads' },
          { to: '/performance', icon: BarChart3, label: 'Performance' },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">Sales Hub</h1>
        <p className="text-sm text-gray-400 mt-1">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;