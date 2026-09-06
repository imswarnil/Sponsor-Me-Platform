// Marketing shell (repurposed from the starter's dashboard group).
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { site } from '@/lib/site';
import styles from './thanks-parallax.module.css';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <div className={`${styles.section} py-24`}>
        <p
          className={`${styles.text} text-balance text-center font-display text-6xl font-bold tracking-tighter sm:text-8xl`}
        >
          Thanks, truly.
        </p>
        <p className="mt-4 text-center text-muted-foreground">
          Every placement here funds {site.creator}&rsquo;s work directly.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
