import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/today" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">&#x1F3C3;</span>
        <span className="nav-label">오늘</span>
      </NavLink>
      <NavLink to="/schedule" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">&#x1F4C5;</span>
        <span className="nav-label">스케줄</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">&#x1F464;</span>
        <span className="nav-label">프로필</span>
      </NavLink>
    </nav>
  );
}
