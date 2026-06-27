import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CabinetFrame } from './components/layout/CabinetFrame';
import { TopNav } from './components/layout/Sidebar';

const Hero = lazy(() => import('./routes/Hero.js').then((m) => ({ default: m.Hero })));
const Arena = lazy(() => import('./routes/Arena.js').then((m) => ({ default: m.Arena })));
const Leaderboard = lazy(() =>
  import('./routes/Leaderboard.js').then((m) => ({ default: m.Leaderboard })),
);
const About = lazy(() => import('./routes/About.js').then((m) => ({ default: m.About })));
const Contact = lazy(() => import('./routes/Contact.js').then((m) => ({ default: m.Contact })));

function Loading() {
  return (
    <p className="font-display text-coin text-xs p-8 anim-blink tracking-widest">LOADING…</p>
  );
}

export function App() {
  return (
    <CabinetFrame>
      <TopNav />
      <main>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Hero />} />
          </Routes>
        </Suspense>
      </main>
    </CabinetFrame>
  );
}
