# How to download your Lovable project

**Files in this repo**

- [`lovable-local-copy.js`](./lovable-local-copy.js) — collector script (paste this into the Lovable console)
- This README — step-by-step guide

Lovable’s **Download codebase** zip is a paid feature. You can still open **Code** and read every file. The script copies that tree onto your computer so you do not paste files one by one.

You do **not** need the local web app if you already have the script. Open the script, copy all of it, and follow the steps below.

Use it only on a project you can already open while signed in. It does not restore credits or unlock paid editing.

**Official free option:** GitHub sync works on every Lovable plan, including Free. If you have a GitHub account, connect the project and clone it. Use this script when you want a folder now without GitHub.

---

## What you need

- A browser (Chrome or Edge work best)
- Your Lovable project open and signed in
- The file [`lovable-local-copy.js`](./lovable-local-copy.js)

Optional: run this repo locally if you want the helper pages at [http://127.0.0.1:43147](http://127.0.0.1:43147) (`npm install` then `npm run dev`). The script itself does not need that.

---

## Download the project (main method)

Do these steps in order.

### 1. Copy the collector

Open [`lovable-local-copy.js`](./lovable-local-copy.js) and copy the entire file.

### 2. Open Code in Lovable (not Preview)

In Lovable, open your project. In the top bar click **Code**.

You should see a file tree (`src/`, `package.json`, and so on). If you still see the live website, you are on **Preview**. Switch to **Code**.

### 3. Open the browser console

Press `F12` (Windows/Linux) or `⌘⌥J` (Mac).  
Click the **Console** tab (not Elements, not Network).

### 4. Allow paste (Chrome warning)

Chrome often shows a yellow warning:

> Don’t paste code into the DevTools Console…

In the console, type exactly:

```text
allow pasting
```

Press **Enter**. After that, paste is allowed in this tab.

### 5. Paste the collector

Click in the console, paste (`Ctrl+V` or `⌘V`), press **Enter**.

A purple panel named **Lovable Local Copy** should appear on the Lovable page.

If nothing appears, refresh Lovable, click **Code** again, type `allow pasting`, and paste once more.

### 6. Collect and save

On the purple panel:

1. Click **Collect files** and wait until it reports how many files it found.
2. Click **Save to folder** and pick an empty folder, **or** click **Download zip**.

**Save to folder** needs Chrome. **Download zip** works in any browser.

The saved tree should match the Code panel: `src/…`, `package.json`, `vite.config.ts`, and the rest.

---

## If you already have a zip or JSON

On [http://127.0.0.1:43147](http://127.0.0.1:43147):

1. Under **Unpack a dump**, choose the `.zip` or `.json` file.
2. Click **Write to exports/**.

Folders are written next to this project in `exports/`.

---

## Run the copied app

Most Lovable apps are Vite (or similar). In the folder you saved:

```bash
npm install
npm run dev
```

If the project has `bun.lock`:

```bash
bun install
bun run dev
```

---

## Official GitHub export (free on all plans)

1. Create a GitHub account if you do not have one.
2. In Lovable open **Project settings → Git → GitHub**.
3. Install the Lovable GitHub app and connect this project.
4. Clone the new repo:

```bash
git clone git@github.com:YOU/YOUR-APP.git
```

---

## Troubleshooting

| What you see | What to do |
| --- | --- |
| Yellow Chrome warning, paste does nothing | Type `allow pasting` in the Console, press Enter, then paste. |
| Paste still blocked | Refresh the Lovable tab, open Console, type `allow pasting` again. |
| You see the live website, not files | Click **Code** in the top bar. Do not stay on Preview. |
| No purple panel after paste | Confirm you pasted in **Console** on the Lovable tab, then press Enter. |
| Collect finds 0 files | Open **Code**, expand the file tree, click Collect again. |
| Save to folder does nothing | Use Chrome, or click **Download zip** instead. |
| Copy from the helper page does nothing | Open [`lovable-local-copy.js`](./lovable-local-copy.js) and copy the file contents. |

---

## What this tool does not do

- It does not log you into someone else’s project.
- It does not bypass Lovable billing or unpause a job that ran out of credits.
- It does not turn a read-only editor into a paid workspace.
- It only copies files you can already open in **Code**.
