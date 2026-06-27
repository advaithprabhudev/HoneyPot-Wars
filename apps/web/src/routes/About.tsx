import { Link } from 'react-router-dom';
import { PixelButton, PixelPanel } from '../components/pixel/index';

export function About() {
  return (
    <div className="p-4 sm:p-8 flex flex-col gap-4 max-w-3xl">
      <h2 className="font-display text-coin text-base tracking-widest">ABOUT</h2>
      <PixelPanel title="WHAT WE MEASURE" accent="teal">
        <p className="font-body text-lg uppercase text-[#c7cdd4]">
          Detection rate on NOVEL attacks — parameter combinations the swarm has never seen.
          Repeating a known attack never counts. That is the only number worth selling.
        </p>
      </PixelPanel>
      <PixelPanel title="SAFETY BY CONSTRUCTION" accent="threat">
        <p className="font-body text-lg uppercase text-[#c7cdd4]">
          The generator only ever emits abstract parameter vectors over a fixed taxonomy. No
          phishing copy, no fake listings, no deployable artifact can leave the arena. Outputs are
          scores and verdicts.
        </p>
      </PixelPanel>
      <PixelPanel title="HOW A ROUND WORKS" accent="gold">
        <ol className="font-body text-lg uppercase text-[#c7cdd4] list-decimal pl-6 space-y-1">
          <li>Generator emits an attack vector.</li>
          <li>Four defender agents score it in parallel.</li>
          <li>Orchestrator fuses the signals (seller-graph weighted highest).</li>
          <li>Referee decides caught or slipped, and whether it was novel.</li>
        </ol>
      </PixelPanel>
      <Link to="/arena">
        <PixelButton variant="teal">SEE IT LIVE</PixelButton>
      </Link>
    </div>
  );
}
