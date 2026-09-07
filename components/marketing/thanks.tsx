import { site } from '@/lib/site';
import styles from './thanks.module.css';

/**
 * The last thing on the homepage before the footer.
 *
 * It used to sit in the marketing *layout*, which meant every public page ended
 * by thanking you — including the catalogue you had not bought anything from
 * yet, and the page where you pick a placement. Thanking someone for a thing
 * they have not done is the one way to make the thanks worth nothing, so it
 * lives on the homepage now and nowhere else.
 */
export function Thanks() {
  return (
    <section className={`${styles.section} border-t border-line-subtle py-24`}>
      <p
        className={`${styles.text} text-balance text-center font-display text-6xl font-bold tracking-tighter sm:text-8xl`}
      >
        Thanks, truly.
      </p>
      <p className="mt-4 text-center text-muted-foreground">
        Every placement and every membership here funds {site.creator}&rsquo;s work directly.
      </p>
    </section>
  );
}
