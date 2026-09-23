# Trip Planner

A day-by-day trip planner for two, built as an installable web app (PWA) for Android and iPhone.

- **Today** screen with what's happening now, what's next, directions and tonight's stay
- **Itinerary** as a calendar-style day view (swipe between days), with stays shown as a band
- **Reminders** for things like bookings to cancel, with an overdue badge
- **Wishlist** of ideas that can be dropped onto a day
- **Packing** list per person, with a tropical starter template
- **Expenses**: prices on itinerary items flow in automatically, plus manual expenses, receipts and a running balance
- **Calendar export** (.ics) for Google Calendar
- Works **offline** and syncs between both phones in real time (Firebase Firestore)

Hosting is on GitHub Pages; login and data are on Firebase (free Spark plan is enough).

---

## Setup guide (about 20 minutes, no command line needed)

### Part A: Firebase (login and data)

1. Go to <https://console.firebase.google.com> and click **Create a project**. Name it `trip-planner`. You can switch Google Analytics off.
2. **Turn on email login.** In the left menu: **Build > Authentication > Get started**. Under *Sign-in method*, choose **Email/Password**, switch it on and save.
3. **Create the two accounts.** Still in Authentication, open the **Users** tab and click **Add user** twice: once for each person's email with a temporary password. (They can change it later with "Forgot password" on the login screen. There is deliberately no sign-up screen, so nobody else can make an account.)
4. **Create the database.** **Build > Firestore Database > Create database**. Choose **Standard edition**, location **eur3 (Europe)**, and **Start in production mode**.
5. **Lock the data down.** In Firestore, open the **Rules** tab, delete what's there, paste the whole contents of the `firestore.rules` file from this project and click **Publish**. This makes sure only the two people on a trip can read or change it.
6. **Get the web config.** Click the cog next to *Project Overview* > **Project settings**. Under *Your apps*, click the **`</>`** (web) icon, give it a nickname like `Trip Planner` and register (leave "Firebase Hosting" unticked). Firebase shows a `firebaseConfig` block: keep that page open for Part B.
7. **Allow the website address.** **Authentication > Settings > Authorized domains > Add domain** and add `YOUR-GITHUB-USERNAME.github.io`.

### Part B: GitHub (the code and the website)

1. Create a new repository called `trip-planner` at <https://github.com/new>. Make it **Public** (GitHub Pages is free for public repos; your trip data is not in the repo, it is in Firebase behind the rules above).
2. **Paste your Firebase config.** Open `src/firebase-config.js` in this project and replace each `PASTE_HERE` with the matching value from step A6.
3. **Upload the files.** On the new repo page, click **uploading an existing file** and drag in everything in this folder *except* `node_modules` and `dist` (if they exist). Commit to `main`.
   - The `.github` folder is hidden on a Mac. In Finder press **Cmd + Shift + .** to show hidden files, so you can drag it in too. If it doesn't come across, create it by hand: **Add file > Create new file**, name it `.github/workflows/deploy.yml` and paste in the contents of that file.
4. **Switch on Pages.** Repo **Settings > Pages**, under *Build and deployment* set **Source** to **GitHub Actions**.
5. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to go green (a minute or two). If it ran before step 4, click it and choose **Re-run all jobs**.
6. Your app is live at `https://YOUR-GITHUB-USERNAME.github.io/trip-planner/`.

### Part C: On the phones

1. Open the link in **Chrome** on Android (or Safari on iPhone) and sign in.
2. Install it: Chrome menu **⋮ > Add to Home screen > Install** (Safari: **Share > Add to Home Screen**). It then opens full screen like a normal app.
3. The first person to sign in creates the trip and enters the other person's email under *Partner's email*. The other person signs in and sees the same trip straight away.

---

## Changing things later

- Edit any file on GitHub (pencil icon) and commit: the site rebuilds itself automatically.
- Trip dates, names, currencies and the exchange rate are in the app under **Today > cog icon > Settings**.
- More trips: **Settings > Plan another trip**. All trips stay in the app.

## How the data is stored

```
trips/{tripId}                  name, dates, time zone, currencies, rate, members (emails), names
trips/{tripId}/items            itinerary items and stays (type "hotel" with check-in and check-out dates)
trips/{tripId}/reminders
trips/{tripId}/wishlist
trips/{tripId}/packing
trips/{tripId}/expenses         expenses added by hand (itinerary prices are read from items)
trips/{tripId}/attachments      ticket and receipt details
trips/{tripId}/files            the files themselves (photos are shrunk to fit; PDFs up to ~700 KB)
```

## For developers

```
npm install
npm run dev        # http://localhost:5173
npm run build
```

To test against the Firebase emulators instead of the real project, run `firebase emulators:start --only auth,firestore --project demo-trip` and open `http://localhost:5173/?emulator`.
