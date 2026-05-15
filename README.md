# Doorlist

A web app for creating and sharing events. [Live demo →](https://doorlist-gamma.vercel.app/create)

My Example Event Link 
[My Example Event Link ](https://doorlist-gamma.vercel.app/events/9phYN0fDn4)

---

## What it is

Doorlist has two pages: a Create Event form where you fill in the details, pick a cover photo, add hosts, set dates, choose an effect, and write a description — and an Event page where guests can see event details and RSVP.

---

## Design Engineering Decisions

**Background & visual feel**

I noticed that in Luma and Partiful, the cover image helps set the visual tone of the page. I used that idea here by turning the cover photo into a soft blurred background, then adjusted the opacity and blur so it added depth without distracting from the event details.

**Date & time picker**

I used a custom calendar with react-day-picker, styled to match the rest of the form, and placed the time picker side-by-side on the right instead of stacking it below. This avoids forcing users through a long dropdown inside an overlay - they can pick the date on the left and the time on the right in one flow. I also noticed Partiful uses a similar side-by-side pattern. When users add an optional end time, I default it to 3 hours after the start time as a reasonable starting point, so they can adjust it if needed instead of setting everything from scratch. I also added frontend validation that blocks submission if the end time is set but isn't after the start time.

**Emoji effects**

The Figma mentioned 5-10 emojis, but I added a few more because the floating effect felt too sparse across the screen with fewer elements. I randomized the size, rotation, timing, and movement so the emojis felt more natural and less uniform. I also added a subtle scale and opacity change on hover to make the circles feel more interactive.

**Delete button consistency**

Once I built the delete button for removing a host, I reused the same interaction for removing the optional end time. I extracted it into a DeleteButton component so both actions looked and behaved consistently.

**Cover photo entry points**

I noticed that Luma and Partiful both let users click directly on the cover image to change it, instead of only relying on a separate button. I added the same secondary entry point because it felt more intuitive: if a user is looking at the image they want to change, they should be able to interact with it directly. I also included an upload option in the side panel so users can add their own image instead of being limited to the preset covers.

**Map**

I used Mapbox instead of a Google Maps embed because the iframe felt visually heavy and included UI elements that didn’t fit the rest of the page. A Mapbox static image gave me more control over the visual style and matched the app’s design better. I also optimized the load flow: when a user creates an event and navigates to the event page, the location is passed through router state, so geocoding can start immediately on mount instead of waiting for the Supabase fetch to finish. This helps the map render sooner and makes the event page feel faster.

**RSVP**

I wanted the RSVP interaction to give users clear feedback after they made a selection. When a status is selected, the emoji uses a spring-pop keyframe animation, and the label below the button updates in real time from “RSVP” to the selected status, like “Going,” “Maybe,” or “Can’t Go.” This makes the selected state visible without requiring users to reopen the picker.

**Description flow**

On the create form, I used a modal for longer descriptions because writing/editing needs more focused space away from the rest of the fields. On the event page, I used an inline “See More” expansion instead of another modal because the user is reading, not editing. Keeping the description on the page avoids interrupting the browsing flow.

**See More logic**

I only show the “See More” button when the description is actually overflowing. Instead of relying on a character count, I use a ResizeObserver to check whether the paragraph is clamped inside its container. If the full description already fits, the button never appears, which avoids showing an action that doesn’t do anything.

**Responsiveness**

The desktop layout uses two columns, with event details on the left and the cover image plus RSVP actions on the right. On smaller screens, it collapses into a single centered column so the page stays easy to scan and doesn’t feel cramped.

**Share / invite**

Clicking the invite button copies the event link to the clipboard and shows a toast confirmation. It’s a small interaction, but the feedback matters because users need to know the link was actually copied.

---

## Tech choices

**React + TypeScript + Vite** — fast iteration, good tooling, what I'm most comfortable with.

**CSS Modules** — component-scoped styles with no accidental overrides. Color tokens are defined as plain CSS custom properties in a global `:root` block and referenced throughout — no utility framework needed.

**Supabase** — I've used it on personal projects before so I could move quickly. It handles both the Postgres database and image storage for custom cover uploads.

**Vercel** — straightforward deployment with a `vercel.json` rewrite rule so that direct links to event pages (e.g. pasting a link in a new tab) don't 404. Without it, Vercel looks for a static file that doesn't exist instead of letting React Router handle the route.

**Mapbox** — static map images via their geocoding API. Better visual fit than the Google Maps embed.

**Figma MCP** — I pulled icons and assets directly from the Figma file as CDN URLs using Figma's MCP server. They all live in `src/figmaAssets.ts` as a single source of truth, so swapping an icon means updating one line.

---

## Running locally

```bash
npm install
npm run dev
```

You'll need the following environment variables:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MAPBOX_TOKEN=   # optional — falls back to a Google Maps embed
```
