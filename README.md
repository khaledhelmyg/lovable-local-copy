# How to download your Lovable project

This repo has two files:

- [`lovable-local-copy.js`](./lovable-local-copy.js) — paste this into the Lovable console
- This README — how to use it

Lovable’s **Download codebase** zip is a paid feature. You can still open **Code** and read every file. This script copies that tree onto your computer so you do not copy files one by one.

Use it only on a project you can already open while signed in. It does not restore credits or unlock paid editing.

**Official free option:** GitHub sync works on every Lovable plan, including Free. Connect the project under **Project settings → Git → GitHub**, then clone it.

> **إخلاء مسؤولية:** هذا الملف للمساعدة في نسخ مشروعك الذي تستطيع فتحه أصلًا. إن كان في استخدامه شيء محرّم أو مخالف، فأنا بريء منه، والمسؤولية على من يستخدمه.
>
> **Disclaimer:** This is only for copying a project you can already open. If using it is forbidden or against the rules, I am not responsible. Anyone who uses it does so at their own responsibility.

---

## What you need

- Chrome or Edge (for **Save to folder**; zip works in any browser)
- Your Lovable project open and signed in
- [`lovable-local-copy.js`](./lovable-local-copy.js)

---

## Steps

### 1. Copy the script

Open [`lovable-local-copy.js`](./lovable-local-copy.js) on GitHub, click **Raw**, then copy the entire file.

### 2. Open Code in Lovable (not Preview)

In Lovable, open your project. In the top bar click **Code**.

You should see a file tree (`src/`, `package.json`). If you still see the live website, you are on **Preview**. Switch to **Code**.

### 3. Open the browser console

Press `F12` (Windows/Linux) or `⌘⌥J` (Mac).  
Click the **Console** tab (not Elements, not Network).

### 4. Allow paste (Chrome warning)

Chrome often shows a yellow warning and blocks paste. In the console type exactly:

```text
allow pasting
```

Press **Enter**. After that, paste works in this tab.

### 5. Paste the script

Click in the console, paste (`Ctrl+V` or `⌘V`), press **Enter**.

A purple panel named **Lovable Local Copy** should appear on the Lovable page.

If nothing appears, refresh Lovable, click **Code** again, type `allow pasting`, and paste once more.

### 6. Collect and save

On the purple panel:

1. Click **Collect files** and wait until it reports how many files it found.
2. Click **Save to folder** and pick an empty folder, **or** click **Download zip**.

**Save to folder** needs Chrome. **Download zip** works in any browser.

The saved tree should match the Code panel: `src/…`, `package.json`, and the rest.

---

## After you save the files

That folder is your Lovable app, not this repo. Most Lovable apps are Vite. Inside the folder you just saved:

```bash
npm install
npm run dev
```

If it has `bun.lock`:

```bash
bun install
bun run dev
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

---

## What this script does not do

- It does not log you into someone else’s project.
- It does not bypass Lovable billing or unpause a job that ran out of credits.
- It does not turn a read-only editor into a paid workspace.
- It only copies files you can already open in **Code**.

إن كان في هذا الأمر حرمانية، فأنا بريء منها.
