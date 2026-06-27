import { NavLink } from 'react-router-dom';
import { PixelButton } from '../pixel/index';

const LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/arena', label: 'ARENA' },
  { to: '/leaderboard', label: 'LEADERBOARD' },
  { to: '/about', label: 'ABOUT' },
  { to: '/contact', label: 'CONTACT' },
];

export function TopNav() {
  return (
    <nav className="flex flex-wrap items-center gap-3 px-4 py-3 border-b-4 border-frame-teal bg-panel">
      <span className="font-display text-coin text-[12px] sm:text-sm mr-2 tracking-widest">
        HONEYPOT WARS
      </span>
      <div className="flex flex-wrap gap-2 grow">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `font-display text-[9px] uppercase tracking-widest px-3 py-2 border-2 ${
                isActive
                  ? 'bg-defender text-panel border-frame-teal'
                  : 'bg-row text-frame-teal border-[#243038] hover:text-coin'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <NavLink to="/contact">
        <PixelButton variant="gold">REQUEST COVERAGE REPORT</PixelButton>
      </NavLink>
    </nav>
  );
}
