-- The previous platform's tables.
--
-- This repo was a points-and-placements marketplace before it was SponsorBid.
-- None of these tables is read by any code that still exists, so they are
-- removed rather than left to rot — `\dt` should describe the application, not
-- its history.
--
-- CASCADE because they reference each other. IF EXISTS so that a fresh
-- database, which never had them, applies this file without complaint.
--
-- Not idempotency theatre: this genuinely is safe to re-run, and it is the
-- only file here that destroys anything. It runs as part of `npm run db:legacy`
-- rather than `db:setup`, so nobody drops the old data by reflex.

DROP TABLE IF EXISTS
  bms_message,
  bms_thread,
  bms_offer,
  bms_member,
  bms_notification,
  bms_event,
  bms_txn,
  bms_sponsorship_history,
  bms_channel_connection,
  bms_slot,
  bms_profile
CASCADE;
