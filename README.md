# StudyQuest

A cozy study RPG made with HTML, CSS and JavaScript, with Supabase cloud auth/database.

## Publish

This is a static frontend. GitHub Pages, InfinityFree, Netlify, Vercel, Cloudflare Pages and similar hosts can serve it. No PHP server is required for the app itself.

For cloud features, the site needs a Supabase project and HTTPS (normal on modern hosts).

## Supabase setup

1. Open your Supabase project's SQL Editor.
2. Run **all** of `supabase-setup.sql`.
3. In `js/config.js`, replace the placeholder values with your Supabase **Project URL** and **anon/publishable key**.
4. In Supabase Auth settings, configure your site's URL and redirect URL to your published site.
5. Create your first admin by inserting the email you use to sign in into `public.app_admins`:

```sql
insert into public.app_admins(email) values ('YOUR-EMAIL@example.com');
```

Then open `admin.html` while signed in as that account.

## New game features

- Real cloud accounts: the same account can be signed in on phone and PC at the same time.
- Global leaderboard from real profiles only.
- Live level/progress updates after earning XP without refreshing.
- Unlocked badges appear first; expanded achievements are sorted by rarity.
- Scheduled double/triple/etc. XP events.
- Monthly #1 gets a special champion effect.
- Admin game-control page for scheduled XP events and playful XP effects.
- Click the profile picture in the desktop sidebar or mobile header to open the profile; the old Profile nav item is removed.
- Favicon/logo included in `logo.svg`.
