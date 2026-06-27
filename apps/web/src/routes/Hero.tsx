import { Link } from 'react-router-dom';
import { PixelButton, PixelPanel, Sprite } from '../components/pixel/index';

export function Hero() {
  return (
    <div className="p-4 sm:p-8 flex flex-col gap-6">
      <div className="pixel-sky border-4 border-frame-teal p-6 sm:p-10 text-center">
        <div className="flex justify-center gap-4 mb-4">
          <Sprite glyph="👾" size={56} className="anim-hop" title="generator" />
          <Sprite glyph="🛡️" size={56} title="defender swarm" />
        </div>
        <h1 className="font-display text-coin text-xl sm:text-3xl tracking-widest drop-shadow-[3px_3px_0_#000]">
          HONEYPOT WARS
        </h1>
        <p className="font-body text-lg sm:text-xl uppercase text-[#0b0c0f] mt-3 max-w-2xl mx-auto">
          An adversarial self-play arena for fraud defence. A generator invents novel
          marketplace scams; a four-agent swarm hunts them down. We sell coverage assurance —
          detection rate on attacks you have never seen.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link to="/arena">
            <PixelButton variant="teal">ENTER ARENA</PixelButton>
          </Link>
          <Link to="/contact">
            <PixelButton variant="gold">REQUEST COVERAGE REPORT</PixelButton>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <PixelPanel title="GENERATOR" accent="threat">
          <p className="font-body text-base uppercase text-[#c7cdd4]">
            Invents attacks as abstract parameter vectors over a fixed taxonomy — never real
            scam content. Safety by construction.
          </p>
        </PixelPanel>
        <PixelPanel title="DEFENDER SWARM" accent="teal">
          <p className="font-body text-base uppercase text-[#c7cdd4]">
            Four specialists — text, listing image, price anomaly, seller graph — score every
            attack in parallel.
          </p>
        </PixelPanel>
        <PixelPanel title="REFEREE" accent="gold">
          <p className="font-body text-base uppercase text-[#c7cdd4]">
            The only source of truth for a verdict. Scores novelty and fuses the swarm's signals
            into caught or slipped.
          </p>
        </PixelPanel>
      </div>
    </div>
  );
}
