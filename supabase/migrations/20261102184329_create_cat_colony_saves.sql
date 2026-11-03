/*
# Create Cat Colony save slots

1. New Tables
- `cat_colony_saves` stores one playable colony state for each browser-generated save key.
- `id` is the durable save identifier.
- `save_key` is a unique browser-generated key used to find the save without requiring an account.
- `player_name` stores the child-friendly name shown in the game.
- `game_state` stores the current month, money, cats, actions, and messages as JSON.
- `created_at` and `updated_at` record save timing.

2. Security
- Row Level Security is enabled.
- This is a no-sign-in game, so anonymous and authenticated app visitors can use the table through the public game save flow.
- Separate CRUD policies are included for the roles used by the browser client.

3. Important Notes
- The frontend always filters by its generated save key and only updates that same save.
- No account or personal profile data is collected.
*/

CREATE TABLE IF NOT EXISTS public.cat_colony_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  save_key text NOT NULL UNIQUE,
  player_name text NOT NULL,
  game_state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cat_colony_saves ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cat_colony_saves TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read cat colony saves" ON public.cat_colony_saves;
CREATE POLICY "Public can read cat colony saves"
  ON public.cat_colony_saves FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create cat colony saves" ON public.cat_colony_saves;
CREATE POLICY "Public can create cat colony saves"
  ON public.cat_colony_saves FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update cat colony saves" ON public.cat_colony_saves;
CREATE POLICY "Public can update cat colony saves"
  ON public.cat_colony_saves FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete cat colony saves" ON public.cat_colony_saves;
CREATE POLICY "Public can delete cat colony saves"
  ON public.cat_colony_saves FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS cat_colony_saves_save_key_idx ON public.cat_colony_saves (save_key);