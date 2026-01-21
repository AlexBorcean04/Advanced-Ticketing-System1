import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Ticket, Shield, User } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const navItems = useMemo(
    () => [
      { label: 'Events', path: '/', icon: Ticket, matchPaths: ['/'] },
      { label: 'Admin', path: '/admin', icon: Shield, matchPaths: ['/admin', '/admin/login'] },
      { label: 'Account', path: '/login', icon: User, matchPaths: ['/login', '/register'] },
    ],
    []
  );
  const linkRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const [activeStyle, setActiveStyle] = useState({ width: 0, left: 0 });

  const isRouteActive = (item) =>
    item.matchPaths?.some((path) => location.pathname.startsWith(path)) ??
    location.pathname.startsWith(item.path);

  useEffect(() => {
    const activeItem = navItems.find((item) => isRouteActive(item));
    if (!activeItem) {
      return;
    }
    const node = linkRefs.current[activeItem.path];
    if (node) {
      const { offsetLeft, offsetWidth } = node;
      const nextStyle = { left: offsetLeft, width: offsetWidth };
      setIndicatorStyle(nextStyle);
      setActiveStyle(nextStyle);
    }
  }, [location.pathname, navItems]);

  const handleHover = (path) => {
    const node = linkRefs.current[path];
    if (!node) return;
    const { offsetLeft, offsetWidth } = node;
    setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
  };

  const handleHoverEnd = () => {
    setIndicatorStyle(activeStyle);
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-night-900/70 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent-500/20 border border-accent-500/40 flex items-center justify-center">
              <Ticket className="text-accent-500" size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold">NovaSeat</p>
              <p className="text-xs text-white/60">Premium ticketing</p>
            </div>
          </div>

          <div
            className="relative flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1"
            onMouseLeave={handleHoverEnd}
          >
            <span
              className="absolute top-1 bottom-1 rounded-full bg-accent-500/20 border border-accent-500/40 transition-all duration-300"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  ref={(node) => {
                    if (node) linkRefs.current[item.path] = node;
                  }}
                  onMouseEnter={() => handleHover(item.path)}
                  onFocus={() => handleHover(item.path)}
                  onBlur={handleHoverEnd}
                  className={() => {
                    const isActive = isRouteActive(item);
                    return `relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'text-white' : 'text-white/60 hover:text-white'
                    }`;
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
