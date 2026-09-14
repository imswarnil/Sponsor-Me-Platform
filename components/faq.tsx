import { site } from '@/lib/site';

/**
 * THE RULES, IN THE WORDS SOMEBODY WOULD ASK THEM IN.
 *
 * Native `<details>`: it works with JavaScript off, the browser's own
 * find-in-page searches closed answers, and there is no open state for this
 * app to get wrong.
 *
 * Every answer here is the actual behaviour of the code. The unflattering
 * ones are the reason this section exists — a sponsor who finds out about the
 * no-refund-on-overtake rule at a checkout has been tricked, and one who
 * reads it here has been told.
 */
const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'What is the difference between buying and bidding?',
    a: (
      <>
        A <strong>fixed</strong> slot has one price and one buyer: you pay for a month and it
        is yours for that month, with nothing to outbid. A <strong>bid</strong> slot is a
        race — everybody&rsquo;s bid is public, the highest one serves, and everyone else sits
        on the board waiting to overtake it.
      </>
    )
  },
  {
    q: 'Is a bid a monthly price?',
    a: (
      <>
        No. A bid is a <strong>lifetime total</strong>. Paying again adds to the number you
        already have, and that is how you climb — so a ₹2,000 bid followed by a ₹3,000 bid
        makes you a ₹5,000 bidder, not a ₹3,000 one. Nothing expires and nothing renews.
      </>
    )
  },
  {
    q: 'What happens when somebody outbids me?',
    a: (
      <>
        Your ad stops serving and stays on the board at its amount, and you can bid again to
        pass them. <strong>You are not refunded for being overtaken.</strong> That is the
        deal that makes the board mean anything — if the loser got their money back, the
        leader would be bidding against nobody.
      </>
    )
  },
  {
    q: 'Does paying put my ad up?',
    a: (
      <>
        Paying gets you the position. It does not get you published: every creative is
        reviewed before it serves, so an ad goes <em>draft → paid → live</em> and the last
        step is a person. If it is refused you are told why, and you can edit and resubmit.
      </>
    )
  },
  {
    q: 'What do you collect about the people who see my ad?',
    a: (
      <>
        Nothing. No cookies, no IP addresses, no user agents, no visitor ids, no third-party
        scripts. You get a count of views and clicks per day — that is genuinely all that
        exists, which is why the numbers you see here are small and true rather than large
        and modelled.
      </>
    )
  },
  {
    q: 'Can I ship my own HTML?',
    a: (
      <>
        Yes, and it runs in a sandboxed frame: your markup and styles work, scripts do not.
        Nothing a sponsor writes is ever injected into the pages of{' '}
        {site.ownerLabel} — that would be a cross-site scripting hole with a price list
        attached, for anybody who bought a slot.
      </>
    )
  },
  {
    q: 'Where does it actually appear?',
    a: (
      <>
        Wherever the tag is pasted. One script tag, one slot, and the unit serves on every
        page it sits on across {site.ownerLabel}. Ads are labelled as ads, and links leave
        through a redirect that counts the click and then reads your destination out of the
        database — never out of the URL.
      </>
    )
  }
];

export function Faq() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {QUESTIONS.map((item) => (
        <details key={item.q} className="sp-faq h-fit">
          <summary>{item.q}</summary>
          <div className="sp-faq-body">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
