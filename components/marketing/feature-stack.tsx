import { Activity, Coins, Globe, Megaphone, ShieldCheck, ShieldOff } from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'No middleman',
    body: 'You deal with me directly — not an account manager, not an agency, nobody taking a cut in between.'
  },
  {
    icon: Coins,
    title: 'The price is the price',
    body: 'No auction, no reserve, no spend minimum. What is listed is exactly what you pay.'
  },
  {
    icon: ShieldOff,
    title: 'No tracking',
    body: 'No third-party cookies and no cross-site tracking of my readers — not for you, not for anyone.'
  },
  {
    icon: Megaphone,
    title: 'Always disclosed',
    body: 'Every sponsored placement says so, plainly, wherever it appears — never dressed up as editorial.'
  },
  {
    icon: Activity,
    title: 'Proof, not promises',
    body: 'See the exact views and clicks your placement gets, live, on the same public page you bought it from.'
  },
  {
    icon: Globe,
    title: 'Seen everywhere I build',
    body: 'Join the wall and your name is shown as a supporter across every site I run — not just this one.'
  }
];

/**
 * Each card IS the sticky element — no extra wrapper. It rides up the normal
 * document flow, pins at its own `top`, and stays pinned until the next card
 * (a touch deeper, a touch higher z-index) arrives and covers it. Pure CSS
 * `position: sticky`, no scroll listener, no library. `mb-6` is the only
 * thing giving the scroll room that makes the hold-then-cover read as
 * "stacking" rather than the cards replacing each other instantly.
 */
export function FeatureStack() {
  return (
    <div className="relative">
      {FEATURES.map((f, i) => (
        <div
          key={f.title}
          className="sticky mb-6 rounded-card border border-border bg-surface p-7 shadow-lg shadow-black/[0.03]"
          style={{ top: `${5 + i * 1.25}rem`, zIndex: i + 1 }}
        >
          <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
            <f.icon className="size-5" />
          </span>
          <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{f.title}</h3>
          <p className="mt-2 max-w-lead text-pretty text-sm text-muted-foreground">{f.body}</p>
        </div>
      ))}
    </div>
  );
}
