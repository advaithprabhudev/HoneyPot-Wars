'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const C = {
  bg: '#0D0D0D',
  gold: '#FFD700',
  cyan: '#00E5FF',
  panel: '#1A1A2E',
  text: '#F0F0F0',
  red: '#FF3B3B',
  green: '#39FF14',
};
const PRESS = 'var(--font-press-start), monospace';
const hexClip = 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)';

function PageBreak({ pt = '40px', pb = '40px' }: { pt?: string; pb?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center', padding: `${pt} 40px ${pb}`, background: C.bg }}
    >
      <div style={{ height: '4px', flex: '1', background: C.panel }} />
      <span className="font-press" style={{ fontSize: '11px', color: C.gold, letterSpacing: '4px' }}>⬡ ⬡ ⬡</span>
      <div style={{ height: '4px', flex: '1', background: C.panel }} />
    </div>
  );
}

function Hex({ left, top, bg, label, color, delay, fontSize }: { left: string; top: string; bg: string; label: string; color: string; delay: string; fontSize: string }) {
  return (
    <div
      className="hw-hex"
      data-anim
      data-hex
      style={{ opacity: '1', animation: `hex-in .5s ease-out both`, animationDelay: delay, position: 'absolute', left, top, width: '96px', height: '84px', transform: 'translate(-50%,-50%)', clipPath: hexClip, background: bg }}
    >
      <div style={{ position: 'absolute', inset: '3px', clipPath: hexClip, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize, color, letterSpacing: '1px', lineHeight: '1.1', padding: '6px' }}>
        {label}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current ?? document;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // nav border tick
    const nav = root.querySelector<HTMLElement>('[data-nav]');
    const onScroll = () => {
      if (nav) nav.style.borderBottomColor = window.scrollY > 100 ? C.cyan : C.gold;
    };
    if (nav) {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // count-up stats
    const runCount = (el: Element) => {
      const target = parseInt(el.getAttribute('data-countup') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (reduce) { el.textContent = target + suffix; return; }
      const dur = 1500;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    root.querySelectorAll('[data-countup]').forEach((el) => cObs.observe(el));

    // scroll reveals
    const reveals = root.querySelectorAll<HTMLElement>('[data-reveal]');
    reveals.forEach((el) => {
      const delay = el.getAttribute('data-delay');
      if (delay) el.style.transitionDelay = delay + 'ms';
    });
    let rObs: IntersectionObserver | null = null;
    if (reduce) {
      reveals.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    } else {
      rObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = '1';
            (e.target as HTMLElement).style.transform = 'none';
            rObs?.unobserve(e.target);
          }
        });
      }, { threshold: 0.15 });
      reveals.forEach((el) => rObs?.observe(el));
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      cObs.disconnect();
      rObs?.disconnect();
    };
  }, []);

  const revealUp = { opacity: '0', transform: 'translateY(16px)', transition: 'opacity .5s cubic-bezier(.22,1,.36,1), transform .5s cubic-bezier(.22,1,.36,1)' } as const;
  const revealUpCard = { opacity: '0', transform: 'translateY(28px)', transition: 'opacity .55s cubic-bezier(.22,1,.36,1), transform .55s cubic-bezier(.22,1,.36,1)' } as const;
  const revealLeft = { opacity: '0', transform: 'translateX(-24px)', transition: 'opacity .4s cubic-bezier(.22,1,.36,1), transform .4s cubic-bezier(.22,1,.36,1)' } as const;
  const revealScale = { opacity: '0', transform: 'scale(0.95)', transition: 'opacity .35s ease-out, transform .35s ease-out' } as const;

  return (
    <div ref={rootRef} style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-vt323), monospace' }}>
      <div style={{ width: '100%', background: C.bg }}>
      <div>

        {/* NAV */}
        <nav data-nav style={{ position: 'sticky', top: '0', zIndex: 50, height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: C.bg, borderBottom: `2px solid ${C.gold}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="font-press" style={{ fontSize: '13px', color: C.gold, letterSpacing: '1px' }}>[H·W]</span>
            <span style={{ fontSize: '26px', lineHeight: '1' }} title="Honeypot Wars">🍯</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="hw-navlinks" style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '22px', color: C.text, letterSpacing: '2px', whiteSpace: 'nowrap' }}>
              <a href="#problem" className="hw-link">THE PROBLEM</a>
              <span style={{ color: C.panel }}>|</span>
              <a href="#how" className="hw-link">HOW IT WORKS</a>
              <span style={{ color: C.panel }}>|</span>
              <a href="#what" className="hw-link">WHAT YOU GET</a>
            </div>
            <Link href="/login" className="font-press hw-btn hw-btn-gold hw-btn-gold-sm" style={{ fontSize: '9px', letterSpacing: '1px', padding: '8px 14px', whiteSpace: 'nowrap' }}>▓ LOGIN ▓</Link>
          </div>
        </nav>

        <main>
          {/* HERO */}
          <section aria-label="Hero" style={{ padding: '64px 40px 0', background: C.bg }}>
            <div className="hw-hero">
              <div>
                <p style={{ fontSize: '20px', color: C.cyan, letterSpacing: '5px', margin: '0 0 28px' }}>FRAUD DEFENCE · COVERAGE ASSURANCE · MARKETPLACE SECURITY</p>
                <h1 className="font-press" style={{ color: C.gold, fontSize: '38px', lineHeight: '1.45', letterSpacing: '1px', margin: '0 0 28px' }}>
                  <span style={{ display: 'block' }}>YOUR FRAUD</span>
                  <span style={{ display: 'block' }}>DETECTORS</span>
                  <span style={{ display: 'block' }}>HAVE BLIND SPOTS.</span>
                </h1>
                <p style={{ fontSize: '27px', color: C.text, letterSpacing: '2px', lineHeight: '1.5', margin: '0 0 36px', maxWidth: '640px', textWrap: 'pretty' }}>HONEYPOT WARS FINDS THEM BEFORE ATTACKERS DO. WE STRESS-TEST YOUR FRAUD DEFENCES AGAINST NOVEL ATTACK PATTERNS AND TELL YOU EXACTLY WHERE YOUR COVERAGE FAILS.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                  <Link href="/signup" className="font-press hw-btn hw-btn-gold" style={{ fontSize: '12px', letterSpacing: '1px', padding: '16px 20px' }}>▓▓ START NOW ▓▓</Link>
                  <a href="#how" className="font-press hw-btn hw-btn-cyan" style={{ fontSize: '12px', letterSpacing: '1px', padding: '16px 20px' }}>▷ SEE HOW IT WORKS</a>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px', height: '320px' }}>
                  <div data-anim data-hex style={{ opacity: '1', animation: 'hex-pulse 2s ease-in-out infinite, hex-in .55s ease-out both', position: 'absolute', left: '150px', top: '160px', width: '96px', height: '84px', transform: 'translate(-50%,-50%)', clipPath: hexClip }}>
                    <div style={{ position: 'absolute', inset: '3px', clipPath: hexClip, background: C.panel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', color: C.gold }}>⬡</div>
                  </div>
                  <Hex left="150px" top="77px" bg={C.gold} color={C.gold} label="ADVANCE FEE" delay="150ms" fontSize="13px" />
                  <Hex left="222px" top="118.5px" bg={C.cyan} color={C.cyan} label="TRIANGULATION" delay="300ms" fontSize="12px" />
                  <Hex left="222px" top="201.5px" bg={C.gold} color={C.gold} label="ACCOUNT TAKEOVER" delay="450ms" fontSize="11px" />
                  <Hex left="150px" top="243px" bg={C.cyan} color={C.cyan} label="REFUND FRAUD" delay="600ms" fontSize="13px" />
                  <Hex left="78px" top="201.5px" bg={C.gold} color={C.gold} label="PHISHING" delay="750ms" fontSize="13px" />
                  <Hex left="78px" top="118.5px" bg={C.cyan} color={C.cyan} label="IDENTITY" delay="900ms" fontSize="13px" />
                </div>
              </div>
            </div>

            {/* stat strip */}
            <div className="hw-statgrid" style={{ margin: '64px -40px 0', padding: '32px 40px', background: C.panel, borderTop: `4px solid ${C.gold}`, borderBottom: `4px solid ${C.gold}` }}>
              <div>
                <div data-countup="4" className="font-press" style={{ fontSize: '42px', color: C.gold }}>0</div>
                <div style={{ fontSize: '20px', color: C.text, letterSpacing: '3px', marginTop: '14px' }}>ATTACK ARCHETYPES TESTED</div>
              </div>
              <div>
                <div data-countup="23" data-suffix="%" className="font-press" style={{ fontSize: '42px', color: C.gold }}>0%</div>
                <div style={{ fontSize: '20px', color: C.text, letterSpacing: '3px', marginTop: '14px' }}>AVERAGE COVERAGE GAP FOUND</div>
              </div>
              <div>
                <div data-countup="100" data-suffix="+" className="font-press" style={{ fontSize: '42px', color: C.gold }}>0+</div>
                <div style={{ fontSize: '20px', color: C.text, letterSpacing: '3px', marginTop: '14px' }}>NOVEL THREATS SURFACED</div>
              </div>
            </div>
          </section>

          <PageBreak />

          {/* PROBLEM */}
          <section id="problem" aria-label="The problem" style={{ padding: '40px 40px 80px', background: C.bg }}>
            <p data-reveal="up" style={{ ...revealUp, textAlign: 'center', fontSize: '20px', color: C.cyan, letterSpacing: '6px', margin: '0 0 16px' }}>THE PROBLEM</p>
            <h2 data-reveal="up" data-delay="120" className="font-press" style={{ ...revealUp, textAlign: 'center', color: C.text, fontSize: '24px', lineHeight: '1.5', letterSpacing: '1px', margin: '0 0 56px' }}>YOU DON&apos;T KNOW WHAT YOU&apos;RE MISSING</h2>
            <div className="hw-cols2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div data-reveal="up" style={{ ...revealUpCard, background: C.panel, border: `2px solid ${C.red}`, boxShadow: `4px 4px 0px ${C.red}`, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <span data-anim style={{ animation: 'blink 1.2s ease-in-out infinite', fontSize: '26px', color: C.red }}>◌</span>
                    <h3 className="font-press" style={{ fontSize: '12px', color: C.text, lineHeight: '1.5', letterSpacing: '1px', margin: '0' }}>YOUR DETECTORS TRAIN ON YESTERDAY&apos;S FRAUD</h3>
                  </div>
                  <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>ATTACKERS ROTATE TACTICS FASTER THAN YOUR RULES UPDATE. THE PATTERNS THAT SLIP THROUGH TODAY AREN&apos;T IN LAST QUARTER&apos;S INCIDENT LOGS.</p>
                </div>
                <div data-reveal="up" data-delay="200" style={{ ...revealUpCard, background: C.panel, border: `2px solid ${C.red}`, boxShadow: `4px 4px 0px ${C.red}`, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <span data-anim style={{ display: 'inline-block', animation: 'rock 2s ease-in-out alternate infinite', fontSize: '26px', color: C.red }}>▲</span>
                    <h3 className="font-press" style={{ fontSize: '12px', color: C.text, lineHeight: '1.5', letterSpacing: '1px', margin: '0' }}>BLIND SPOTS DON&apos;T ANNOUNCE THEMSELVES</h3>
                  </div>
                  <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>YOU CAN&apos;T AUDIT FOR COVERAGE YOU DIDN&apos;T KNOW TO MEASURE. IF YOUR STACK HAS NEVER SEEN A NOVEL ATTACK ARCHETYPE, YOUR METRICS WON&apos;T SHOW THE GAP.</p>
                </div>
                <div data-reveal="up" data-delay="400" style={{ ...revealUpCard, background: C.panel, border: `2px solid ${C.red}`, boxShadow: `4px 4px 0px ${C.red}`, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <span data-anim style={{ animation: 'threat-pulse 1.5s steps(2) infinite', fontSize: '26px', color: C.red }}>◈</span>
                    <h3 className="font-press" style={{ fontSize: '12px', color: C.text, lineHeight: '1.5', letterSpacing: '1px', margin: '0' }}>THE COST SHOWS UP IN CHARGEBACKS, NOT IN DASHBOARDS</h3>
                  </div>
                  <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>BY THE TIME A NEW TACTIC APPEARS IN YOUR FRAUD QUEUE, YOU&apos;VE ALREADY PAID FOR IT.</p>
                </div>
              </div>
              <div className="hw-hide-sm" data-reveal="up" data-delay="250" style={{ ...revealUpCard, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <span data-anim style={{ display: 'inline-block', animation: 'rock 2s ease-in-out alternate infinite', fontSize: '200px', lineHeight: '1', color: C.red }}>▲</span>
                <p style={{ fontSize: '24px', color: C.text, letterSpacing: '2px', lineHeight: '1.4', margin: '40px 0 12px', maxWidth: '380px' }}>THE AVERAGE MARKETPLACE HAS 23% UNCOVERED ATTACK SURFACE.</p>
                <p style={{ fontSize: '24px', color: C.red, letterSpacing: '2px', margin: '0' }}>MOST FIND OUT WHEN IT&apos;S TOO LATE.</p>
              </div>
            </div>
          </section>

          <PageBreak pt="0" />

          {/* HOW IT WORKS */}
          <section id="how" aria-label="How it works" style={{ padding: '40px 40px 80px', background: C.bg }}>
            <p data-reveal="up" style={{ ...revealUp, textAlign: 'center', fontSize: '20px', color: C.cyan, letterSpacing: '6px', margin: '0 0 16px' }}>HOW IT WORKS</p>
            <h2 data-reveal="up" data-delay="120" className="font-press" style={{ ...revealUp, textAlign: 'center', color: C.gold, fontSize: '24px', letterSpacing: '1px', margin: '0 0 56px' }}>STRESS-TEST YOUR DEFENCES</h2>
            <div className="hw-steps">
              <div data-reveal="left" style={{ ...revealLeft, flex: '1', maxWidth: '300px', background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.cyan}`, padding: '26px' }}>
                <div style={{ fontSize: '18px', color: C.cyan, letterSpacing: '3px', marginBottom: '16px' }}>STEP 1</div>
                <span style={{ fontSize: '34px', color: C.cyan }}>▦</span>
                <h3 className="font-press" style={{ fontSize: '13px', color: C.gold, lineHeight: '1.5', letterSpacing: '1px', margin: '14px 0 16px' }}>WE MAP YOUR STACK</h3>
                <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0 0 16px' }}>TELL US WHICH FRAUD SIGNALS AND RULES YOU RUN TODAY.</p>
                <p className="font-press" style={{ fontSize: '9px', color: C.green, letterSpacing: '1px', lineHeight: '1.6', margin: '0' }}>NO AGENTS. NO CODE.</p>
              </div>
              <div className="hw-arrow font-press" style={{ display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: '16px', color: C.gold }}>▶</div>
              <div data-reveal="left" data-delay="150" style={{ ...revealLeft, flex: '1', maxWidth: '300px', background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.cyan}`, padding: '26px' }}>
                <div style={{ fontSize: '18px', color: C.cyan, letterSpacing: '3px', marginBottom: '16px' }}>STEP 2</div>
                <span data-anim style={{ display: 'inline-block', animation: 'threat-pulse 1.5s steps(2) infinite', fontSize: '34px', color: C.red }}>◈</span>
                <h3 className="font-press" style={{ fontSize: '13px', color: C.gold, lineHeight: '1.5', letterSpacing: '1px', margin: '14px 0 16px' }}>WE PROBE YOUR DEFENCES</h3>
                <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>WE SIMULATE HUNDREDS OF NOVEL ATTACK PATTERNS ACROSS EVERY ARCHETYPE AGAINST YOUR STACK.</p>
              </div>
              <div className="hw-arrow font-press" style={{ display: 'flex', alignItems: 'center', padding: '0 6px', fontSize: '16px', color: C.gold }}>▶</div>
              <div data-reveal="left" data-delay="300" style={{ ...revealLeft, flex: '1', maxWidth: '300px', background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.cyan}`, padding: '26px' }}>
                <div style={{ fontSize: '18px', color: C.cyan, letterSpacing: '3px', marginBottom: '16px' }}>STEP 3</div>
                <span data-anim style={{ display: 'inline-block', animation: 'star-rock 1.5s ease-in-out alternate infinite', fontSize: '34px', color: C.gold }}>★</span>
                <h3 className="font-press" style={{ fontSize: '13px', color: C.gold, lineHeight: '1.5', letterSpacing: '1px', margin: '14px 0 16px' }}>YOU GET YOUR REPORT</h3>
                <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>A FULL COVERAGE MAP: WHAT YOU CATCH, WHAT SLIPS, AND EXACTLY WHERE TO CLOSE GAPS.</p>
              </div>
            </div>
            <p data-reveal="up" data-delay="200" style={{ ...revealUp, textAlign: 'center', fontSize: '24px', color: C.text, letterSpacing: '2px', margin: '48px 0 0' }}>NO INTEGRATION REQUIRED. NO CODE. NO AGENTS TO DEPLOY. RESULTS IN 48 HOURS.</p>
          </section>

          <PageBreak pt="0" />

          {/* WHAT YOU GET */}
          <section id="what" aria-label="What you get" style={{ padding: '40px 40px 80px', background: C.bg }}>
            <p data-reveal="up" style={{ ...revealUp, textAlign: 'center', fontSize: '20px', color: C.cyan, letterSpacing: '6px', margin: '0 0 16px' }}>WHAT YOU GET</p>
            <h2 data-reveal="up" data-delay="120" className="font-press" style={{ ...revealUp, textAlign: 'center', color: C.text, fontSize: '24px', letterSpacing: '1px', margin: '0 0 56px' }}>YOUR COVERAGE REPORT</h2>
            <div className="hw-cols3">
              <div data-reveal="scale" className="hw-card-what" style={{ ...revealScale, background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.gold}`, padding: '30px' }}>
                <span data-anim style={{ animation: 'blink 1.2s ease-in-out infinite', fontSize: '38px', color: C.red }}>◌</span>
                <h3 className="font-press" style={{ fontSize: '13px', color: C.gold, lineHeight: '1.5', letterSpacing: '1px', margin: '18px 0 16px' }}>BLIND SPOT MAP</h3>
                <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>A FULL MAP OF WHICH ATTACK ARCHETYPES AND PARAM VARIANTS CURRENTLY BYPASS YOUR DETECTORS.</p>
              </div>
              <div data-reveal="scale" data-delay="150" className="hw-card-what" style={{ ...revealScale, background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.gold}`, padding: '30px' }}>
                <span data-anim style={{ display: 'inline-block', animation: 'star-rock 1.5s ease-in-out alternate infinite', fontSize: '38px', color: C.gold }}>★</span>
                <h3 className="font-press" style={{ fontSize: '13px', color: C.gold, lineHeight: '1.5', letterSpacing: '1px', margin: '18px 0 16px' }}>NOVEL ATTACK TAXONOMY</h3>
                <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>EVERY ARCHETYPE VARIANT YOUR STACK HAS NEVER BEEN TESTED AGAINST — MAPPED AND SCORED.</p>
              </div>
              <div data-reveal="scale" data-delay="300" className="hw-card-what" style={{ ...revealScale, background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.gold}`, padding: '30px' }}>
                <span style={{ fontSize: '38px', color: C.cyan }}>▦</span>
                <h3 className="font-press" style={{ fontSize: '13px', color: C.gold, lineHeight: '1.5', letterSpacing: '1px', margin: '18px 0 16px' }}>REMEDIATION PLAYBOOK</h3>
                <p style={{ fontSize: '20px', color: C.text, letterSpacing: '1px', lineHeight: '1.45', margin: '0' }}>PRIORITISED, ACTIONABLE STEPS TO CLOSE EACH GAP, RANKED BY RISK EXPOSURE.</p>
              </div>
            </div>
            <div style={{ marginTop: '56px', background: C.panel, border: `2px solid ${C.gold}`, boxShadow: `4px 4px 0px ${C.cyan}`, padding: '30px' }}>
              <div style={{ fontSize: '22px', color: C.text, letterSpacing: '3px', marginBottom: '18px' }}>YOUR CURRENT ESTIMATED COVERAGE</div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3, 4].map((i) => (<div key={i} style={{ width: '46px', height: '30px', background: C.gold }} />))}
                {[0, 1, 2].map((i) => (<div key={`d${i}`} data-anim style={{ animation: 'dimpulse 1.4s ease-in-out infinite', width: '46px', height: '30px', background: C.bg, border: `2px solid ${C.red}` }} />))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ fontSize: '24px', color: C.green, letterSpacing: '2px' }}>FIND OUT YOUR REAL NUMBER.</span>
                <Link href="/signup" className="font-press hw-btn hw-btn-gold hw-btn-gold-sm" style={{ fontSize: '11px', letterSpacing: '1px', padding: '14px 18px' }}>▓▓ START NOW ▓▓</Link>
              </div>
            </div>
          </section>

          {/* SOCIAL PROOF */}
          <section aria-label="Social proof" style={{ padding: '64px 40px', background: C.panel, borderTop: `4px solid ${C.gold}`, borderBottom: `4px solid ${C.gold}`, textAlign: 'center' }}>
            <p style={{ fontSize: '22px', color: C.text, letterSpacing: '3px', margin: '0 0 28px' }}>TRUSTED BY FRAUD &amp; TRUST TEAMS PROTECTING OVER $2B IN GMV</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', margin: '0 0 40px' }}>
              {['[ TIER-1 MARKETPLACE ]', '[ REGIONAL E-COMMERCE ]', '[ FINTECH PLATFORM ]', '[ B2B PAYMENTS ]'].map((t) => (
                <span key={t} className="font-press" style={{ fontSize: '10px', color: C.gold, letterSpacing: '1px', border: `2px solid ${C.gold}`, padding: '12px 16px' }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '32px', color: C.text, letterSpacing: '1px', lineHeight: '1.4', margin: '0 auto 18px', maxWidth: '820px', textWrap: 'pretty' }}>&quot;WE FOUND 3 NOVEL SLIP ARCHETYPES IN OUR FIRST REPORT. WE HAD ZERO COVERAGE ON ALL THREE.&quot;</p>
            <p style={{ fontSize: '20px', color: C.cyan, letterSpacing: '3px', margin: '0' }}>— TRUST &amp; SAFETY LEAD, TIER-1 MARKETPLACE</p>
          </section>

          {/* FINAL CTA */}
          <section id="request" aria-label="Request your coverage report" style={{ padding: '72px 40px', background: C.gold, color: C.bg, textAlign: 'center' }}>
            <div data-anim style={{ animation: 'hex-slow-pulse 3s ease-in-out infinite', display: 'inline-block', fontSize: '34px', letterSpacing: '8px', lineHeight: '1.1', color: C.bg, marginBottom: '8px' }}>
              <div>⬡ ⬡ ⬡</div>
              <div style={{ paddingLeft: '18px' }}>⬡ ⬡ ⬡</div>
              <div>⬡ ⬡ ⬡</div>
            </div>
            <h2 className="font-press" style={{ fontSize: '26px', letterSpacing: '2px', margin: '28px 0 0' }}>PRESS START</h2>
            <div style={{ width: '280px', height: '4px', background: C.bg, margin: '32px auto' }} />
            <p className="font-press" style={{ fontSize: '18px', lineHeight: '1.6', letterSpacing: '1px', margin: '0 0 36px' }}>FIND YOUR BLIND SPOTS BEFORE<br />THE NEXT ATTACK DOES.</p>
            <Link href="/request-session" className="font-press hw-btn hw-btn-dark" style={{ fontSize: '14px', letterSpacing: '1px', padding: '18px 24px' }}>▓▓▓ CONSULT WITH US NOW ▓▓▓</Link>
            <p style={{ fontSize: '22px', letterSpacing: '3px', margin: '36px 0 0' }}>NO INTEGRATION. NO CODE. RESULTS IN 48 HOURS.</p>
          </section>
        </main>

        {/* FOOTER */}
        <footer style={{ padding: '36px 40px', background: C.bg }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="font-press" style={{ fontSize: '12px', color: C.gold, letterSpacing: '1px' }}>[H·W]</span>
              <span style={{ fontSize: '22px', lineHeight: '1' }} title="Honeypot Wars">🍯</span>
            </div>
            <div style={{ display: 'flex', gap: '18px', fontSize: '20px', color: C.text, letterSpacing: '2px' }}>
              <a href="#" className="hw-link">PRIVACY</a>
              <span style={{ color: C.panel }}>·</span>
              <a href="#" className="hw-link">TERMS</a>
              <span style={{ color: C.panel }}>·</span>
              <a href="#" className="hw-link">CONTACT</a>
            </div>
          </div>
          <div style={{ height: '2px', background: C.gold, margin: '20px 0' }} />
          <p style={{ fontSize: '18px', color: C.text, letterSpacing: '2px', margin: '0 0 6px' }}>© 2026 HONEYPOT WARS. ALL RIGHTS RESERVED.</p>
          <p style={{ fontSize: '18px', color: C.cyan, letterSpacing: '2px', margin: '0' }}>COVERAGE ASSURANCE FOR THE FRAUD-DEFENCE GENERATION.</p>
        </footer>

      </div>
      </div>
    </div>
  );
}
