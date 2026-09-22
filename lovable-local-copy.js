/* Lovable Local Copy
 * Paste this entire file into the DevTools console on your Lovable project
 * while the Code tab is open. It collects files you can already view and
 * lets you save them to a folder or download a zip.
 */
(() => {
  const PANEL_ID = "llc-panel";
  const LOCAL_WRITER = "http://127.0.0.1:43147";
  const API = "https://api.lovable.dev";

  if (document.getElementById(PANEL_ID)) {
    document.getElementById(PANEL_ID).style.display = "flex";
    return;
  }

  const state = {
    files: [],
    log: [],
    status: "Ready",
    writer: false,
    busy: false,
  };

  function projectIdFromUrl() {
    const m = String(location.pathname).match(
      /\/projects\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    return m ? m[1].toLowerCase() : null;
  }

  function projectNameFromPage() {
    const title = document.title.replace(/\s*[|–—-]\s*Lovable.*$/i, "").trim();
    if (title && title.toLowerCase() !== "lovable") return title;
    const hub = document.querySelector("header button, [class*='workspace']");
    const text = hub && hub.textContent ? hub.textContent.trim() : "";
    return text || "lovable-project";
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function log(line) {
    state.log.push(line);
    if (state.log.length > 80) state.log.shift();
    render();
  }

  function setStatus(status) {
    state.status = status;
    render();
  }

  function extractAccessTokenFromFirebaseRow(row) {
    if (!row || typeof row !== "object") return null;
    const user = row.value && typeof row.value === "object" ? row.value : row;
    const token = user && user.stsTokenManager && user.stsTokenManager.accessToken;
    return typeof token === "string" && token.length ? token : null;
  }

  function readLovableToken() {
    return new Promise((resolve) => {
      if (typeof indexedDB === "undefined") return resolve(null);
      let openReq;
      try {
        openReq = indexedDB.open("firebaseLocalStorageDb");
      } catch {
        return resolve(null);
      }
      openReq.onerror = () => resolve(null);
      openReq.onsuccess = () => {
        const db = openReq.result;
        if (!db.objectStoreNames.contains("firebaseLocalStorage")) {
          try {
            db.close();
          } catch {}
          return resolve(null);
        }
        let tx;
        try {
          tx = db.transaction("firebaseLocalStorage", "readonly");
        } catch {
          try {
            db.close();
          } catch {}
          return resolve(null);
        }
        const store = tx.objectStore("firebaseLocalStorage");
        const cursorReq = store.openCursor();
        let done = false;
        const finish = (value) => {
          if (done) return;
          done = true;
          try {
            db.close();
          } catch {}
          resolve(value);
        };
        cursorReq.onerror = () => finish(null);
        cursorReq.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) return finish(null);
          const key = cursor.key;
          if (typeof key === "string" && /^firebase:authUser:.+:\[DEFAULT\]$/.test(key)) {
            const token = extractAccessTokenFromFirebaseRow(cursor.value);
            if (token) return finish(token);
          }
          cursor.continue();
        };
      };
    });
  }

  async function fetchJson(url, token) {
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(res.status + " " + url);
    return res.json();
  }

  async function fetchBytes(url, token) {
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error(res.status + " " + url);
    return new Uint8Array(await res.arrayBuffer());
  }

  function looksLikeFileList(data) {
    const list = data && (data.files || data.data);
    return Array.isArray(list) ? list : null;
  }

  async function listFilesViaApi(token, projectId) {
    const urls = [
      API + "/v1/git/files?project_id=" + encodeURIComponent(projectId) + "&limit=200",
      API + "/projects/" + encodeURIComponent(projectId) + "/git/files?ref=main",
      API + "/v1/projects/" + encodeURIComponent(projectId) + "/git/files?ref=main",
    ];
    let lastError = null;
    for (const url of urls) {
      try {
        const first = await fetchJson(url, token);
        let items = looksLikeFileList(first);
        if (!items) continue;
        let cursor = first.pagination && first.pagination.next_cursor;
        if (!cursor && first.next_cursor) cursor = first.next_cursor;
        while (cursor) {
          const nextUrl =
            url + (url.includes("?") ? "&" : "?") + "cursor=" + encodeURIComponent(cursor);
          const page = await fetchJson(nextUrl, token);
          const more = looksLikeFileList(page) || [];
          items = items.concat(more);
          cursor =
            (page.pagination && page.pagination.next_cursor) || page.next_cursor || null;
        }
        return { endpoint: url, items };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("No file-list endpoint accepted this session.");
  }

  function filePathFromItem(item) {
    if (!item) return null;
    if (typeof item === "string") return item;
    return item.path || item.name || item.file_path || null;
  }

  function encodePathSegment(filePath) {
    return filePath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
  }

  async function readFileViaApi(token, projectId, filePath, listEndpoint) {
    const encoded = encodePathSegment(filePath);
    const urls = [];
    if (listEndpoint && listEndpoint.includes("/v1/git/files?")) {
      urls.push(
        API +
          "/v1/git/files/" +
          encoded +
          "?project_id=" +
          encodeURIComponent(projectId),
      );
    }
    urls.push(
      API +
        "/projects/" +
        encodeURIComponent(projectId) +
        "/git/file?path=" +
        encodeURIComponent(filePath) +
        "&ref=main",
      API +
        "/v1/projects/" +
        encodeURIComponent(projectId) +
        "/git/file?path=" +
        encodeURIComponent(filePath) +
        "&ref=main",
      API +
        "/v1/git/files/" +
        encoded +
        "?project_id=" +
        encodeURIComponent(projectId),
    );
    let lastError = null;
    for (const url of urls) {
      try {
        return await fetchBytes(url, token);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Could not read " + filePath);
  }

  async function mapPool(items, limit, worker) {
    const out = new Array(items.length);
    let i = 0;
    async function run() {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await worker(items[idx], idx);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return out;
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function isProbablyText(bytes, filePath) {
    if (/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot|mp4|mp3|pdf|zip|gz)$/i.test(filePath)) {
      return false;
    }
    const n = Math.min(bytes.length, 800);
    let odd = 0;
    for (let i = 0; i < n; i++) {
      if (bytes[i] === 0) return false;
      if (bytes[i] < 9) odd++;
    }
    return odd < 3;
  }

  async function collectFromApi() {
    const projectId = projectIdFromUrl();
    if (!projectId) throw new Error("Open a Lovable project URL first.");
    setStatus("Reading session…");
    const token = await readLovableToken();
    if (!token) throw new Error("Not signed in (no Lovable session token in this browser).");
    setStatus("Listing files…");
    const { endpoint, items } = await listFilesViaApi(token, projectId);
    const paths = items
      .map(filePathFromItem)
      .filter((p) => p && !String(p).endsWith("/"));
    log("API listed " + paths.length + " files.");
    const files = [];
    let done = 0;
    await mapPool(paths, 6, async (filePath) => {
      try {
        const bytes = await readFileViaApi(token, projectId, filePath, endpoint);
        const text = isProbablyText(bytes, filePath)
          ? new TextDecoder("utf-8", { fatal: false }).decode(bytes)
          : null;
        files.push(
          text !== null
            ? { path: filePath, content: text, encoding: "utf8" }
            : { path: filePath, content: bytesToBase64(bytes), encoding: "base64" },
        );
      } catch (error) {
        log("Skip " + filePath + " — " + (error && error.message));
      }
      done += 1;
      if (done % 8 === 0 || done === paths.length) {
        setStatus("Downloading " + done + "/" + paths.length);
      }
    });
    return files;
  }

  function monacoFiles() {
    const monaco = window.monaco;
    if (!monaco || !monaco.editor || !monaco.editor.getModels) return [];
    const models = monaco.editor.getModels();
    const out = [];
    for (const model of models) {
      try {
        const uri = String(model.uri);
        let filePath = uri.replace(/^file:\/\//, "").replace(/^\//, "");
        if (!filePath || filePath.startsWith("inmemory:") || filePath.includes("node_modules")) {
          continue;
        }
        out.push({ path: filePath, content: model.getValue(), encoding: "utf8" });
      } catch {}
    }
    return out;
  }

  function editorText() {
    const cm = document.querySelector(".cm-content");
    if (cm) {
      const view =
        cm.cmView ||
        cm.cmTile ||
        (cm.parentNode && (cm.parentNode.cmView || cm.parentNode.cmTile));
      const state = view && view.view && view.view.state;
      if (state && state.doc) return String(state.doc);
      if (cm.innerText) return cm.innerText;
    }
    const monaco = window.monaco;
    if (monaco && monaco.editor && monaco.editor.getEditors) {
      const editors = monaco.editor.getEditors();
      if (editors[0]) return editors[0].getValue();
    }
    const textarea = document.querySelector("textarea");
    return textarea ? textarea.value : "";
  }

  function isFileLabel(text) {
    return /\.[A-Za-z0-9]{1,12}$/.test(text.trim());
  }

  async function expandFolders() {
    const buttons = [...document.querySelectorAll("button, [role='button']")];
    const expand = buttons.find((el) => /expand all/i.test(el.textContent || ""));
    if (expand) {
      expand.click();
      await sleep(400);
      return;
    }
    for (let pass = 0; pass < 6; pass++) {
      const nodes = [...document.querySelectorAll("[class*='cursor-pointer']")];
      let clicked = 0;
      for (const el of nodes) {
        const label = (el.textContent || "").trim().split("\n")[0];
        if (!label || isFileLabel(label)) continue;
        const collapsed = el.querySelector("[class*='chevron-right'], [data-state='closed']");
        if (collapsed || /▶|▸/.test(el.textContent || "")) {
          el.click();
          clicked += 1;
          await sleep(40);
        }
      }
      if (!clicked) break;
      await sleep(120);
    }
  }

  async function collectFromEditor() {
    const fromMonaco = monacoFiles();
    if (fromMonaco.length > 3) {
      log("Read " + fromMonaco.length + " open editor models.");
      return fromMonaco;
    }
    setStatus("Expanding folders…");
    await expandFolders();
    const panel =
      document.querySelector("[class*='min-w-64']") ||
      document.querySelector("[class*='file-tree']") ||
      document.querySelector("input[placeholder*='Search' i]")?.closest("div");
    if (!panel) throw new Error("Could not find the Code file tree. Open the Code tab first.");
    const items = [...panel.querySelectorAll("div[class*='cursor-pointer'], button, [role='treeitem']")];
    const dirStack = [];
    const files = [];
    for (const el of items) {
      const text = (el.textContent || "").trim().split("\n")[0].trim();
      if (!text) continue;
      const mlDiv = el.querySelector("div[class*='ml-'], div[class*='mr-1']");
      let depth = dirStack.length;
      if (mlDiv && mlDiv.style && mlDiv.style.marginLeft) {
        depth = Math.round(parseInt(mlDiv.style.marginLeft, 10) / 12) || 0;
      }
      while (dirStack.length > depth) dirStack.pop();
      if (isFileLabel(text)) {
        files.push({ el, path: [...dirStack, text].join("/") });
      } else if (!/search code/i.test(text)) {
        dirStack.push(text);
      }
    }
    const unique = [];
    const seen = new Set();
    for (const file of files) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      unique.push(file);
    }
    log("File tree shows " + unique.length + " files. Opening each…");
    let previous = "";
    const out = [];
    for (let i = 0; i < unique.length; i++) {
      const file = unique[i];
      setStatus("Opening " + (i + 1) + "/" + unique.length);
      file.el.click();
      let content = "";
      let stable = 0;
      let last = "";
      for (let t = 0; t < 40; t++) {
        await sleep(120);
        content = editorText();
        if (content === previous && t < 30) continue;
        if (content && content === last && content !== previous) {
          stable += 1;
          if (stable >= 2) break;
        } else {
          stable = 0;
          last = content;
        }
      }
      if (content && content !== previous) {
        out.push({ path: file.path, content, encoding: "utf8" });
        previous = content;
        log("Saved " + file.path);
      } else {
        log("Skip " + file.path);
      }
    }
    return out;
  }

  function crc32(u8) {
    let c = ~0 >>> 0;
    for (let i = 0; i < u8.length; i++) {
      c ^= u8[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }

  function u16(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255]);
  }
  function u32(n) {
    return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
  }
  function concat(parts) {
    const len = parts.reduce((a, b) => a + b.length, 0);
    const out = new Uint8Array(len);
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  }

  function fileBytes(file) {
    if (file.encoding === "base64") {
      const bin = atob(file.content || "");
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new TextEncoder().encode(file.content || "");
  }

  function makeZip(files) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const file of files) {
      const name = new TextEncoder().encode(file.path);
      const data = fileBytes(file);
      const crc = crc32(data);
      const local = concat([
        u32(0x04034b50),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        name,
        data,
      ]);
      const central = concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]);
      locals.push(local);
      centrals.push(central);
      offset += local.length;
    }
    const localBlob = concat(locals);
    const centralBlob = concat(centrals);
    const eocd = concat([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(files.length),
      u16(files.length),
      u32(centralBlob.length),
      u32(localBlob.length),
      u16(0),
    ]);
    return concat([localBlob, centralBlob, eocd]);
  }

  function downloadBlob(bytes, filename, type) {
    const blob = new Blob([bytes], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function writeToDirectory(files) {
    if (!window.showDirectoryPicker) {
      throw new Error("This browser cannot pick a folder. Download the zip instead.");
    }
    const root = await window.showDirectoryPicker({ mode: "readwrite" });
    for (const file of files) {
      const parts = file.path.split("/").filter(Boolean);
      let dir = root;
      for (let i = 0; i < parts.length - 1; i++) {
        dir = await dir.getDirectoryHandle(parts[i], { create: true });
      }
      const handle = await dir.getFileHandle(parts[parts.length - 1], { create: true });
      const writable = await handle.createWritable();
      await writable.write(fileBytes(file));
      await writable.close();
    }
  }

  async function probeWriter() {
    try {
      const res = await fetch(LOCAL_WRITER + "/api/health", { mode: "cors" });
      state.writer = res.ok;
    } catch {
      state.writer = false;
    }
    render();
  }

  async function collect() {
    if (state.busy) return;
    state.busy = true;
    state.files = [];
    try {
      let files = [];
      try {
        files = await collectFromApi();
      } catch (error) {
        log("API path failed: " + (error && error.message));
        log("Falling back to the Code panel…");
        files = await collectFromEditor();
      }
      state.files = files.filter((f) => f && f.path);
      log("Collected " + state.files.length + " files.");
      setStatus(state.files.length ? "Ready to save" : "No files found");
    } catch (error) {
      setStatus("Failed");
      log(String(error && error.message ? error.message : error));
    } finally {
      state.busy = false;
      render();
    }
  }

  function needFiles() {
    if (!state.files.length) {
      log("Collect files first.");
      return false;
    }
    return true;
  }

  function slugName() {
    return projectNameFromPage()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "lovable-project";
  }

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:2147483646;width:min(380px,calc(100vw - 24px));max-height:min(72vh,640px);display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:16px;background:#16141c;color:#f4f0ff;font:13px/1.45 ui-sans-serif,system-ui,sans-serif;box-shadow:0 18px 50px rgba(0,0,0,.45);border:1px solid rgba(196,160,255,.25)";

  function btn(label, primary) {
    const el = document.createElement("button");
    el.textContent = label;
    el.style.cssText = primary
      ? "border:0;border-radius:10px;padding:8px 10px;background:#a855f7;color:#fff;font-weight:600;cursor:pointer"
      : "border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:8px 10px;background:#221e2c;color:#f4f0ff;cursor:pointer";
    return el;
  }

  function render() {
    panel.innerHTML = "";
    const head = document.createElement("div");
    head.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px";
    const title = document.createElement("strong");
    title.textContent = "Lovable Local Copy";
    const close = document.createElement("button");
    close.textContent = "×";
    close.style.cssText =
      "border:0;background:transparent;color:#c4b5fd;font-size:20px;cursor:pointer;line-height:1";
    close.onclick = () => panel.remove();
    head.append(title, close);

    const status = document.createElement("div");
    status.style.color = "#c4b5fd";
    status.textContent = state.status + (state.files.length ? " · " + state.files.length + " files" : "");

    const logBox = document.createElement("pre");
    logBox.style.cssText =
      "margin:0;padding:8px;border-radius:10px;background:#0e0c14;color:#ddd6fe;max-height:180px;overflow:auto;white-space:pre-wrap;font:11px/1.4 ui-monospace,monospace";
    logBox.textContent = state.log.join("\n") || "Open the Code tab, then collect files.";

    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";

    const collectBtn = btn(state.busy ? "Collecting…" : "Collect files", true);
    collectBtn.disabled = state.busy;
    collectBtn.onclick = collect;

    const folderBtn = btn("Save to folder");
    folderBtn.onclick = async () => {
      if (!needFiles()) return;
      try {
        await writeToDirectory(state.files);
        log("Wrote files to the folder you picked.");
        setStatus("Saved to folder");
      } catch (error) {
        log(String(error && error.message ? error.message : error));
      }
    };

    const zipBtn = btn("Download zip");
    zipBtn.onclick = () => {
      if (!needFiles()) return;
      downloadBlob(makeZip(state.files), slugName() + ".zip", "application/zip");
      log("Zip download started.");
    };

    const jsonBtn = btn("Download JSON");
    jsonBtn.onclick = () => {
      if (!needFiles()) return;
      const payload = JSON.stringify(
        { projectName: projectNameFromPage(), files: state.files },
        null,
        2,
      );
      downloadBlob(new TextEncoder().encode(payload), slugName() + ".json", "application/json");
    };

    row.append(collectBtn, folderBtn, zipBtn, jsonBtn);

    if (state.writer) {
      const localBtn = btn("Write via local app");
      localBtn.onclick = async () => {
        if (!needFiles()) return;
        try {
          const res = await fetch(LOCAL_WRITER + "/api/export", {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectName: projectNameFromPage(),
              files: state.files,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || "Local writer failed");
          log("Wrote " + data.written + " files to " + data.path);
          setStatus("Saved locally");
        } catch (error) {
          log(String(error && error.message ? error.message : error));
        }
      };
      row.append(localBtn);
    }

    const hint = document.createElement("div");
    hint.style.cssText = "color:#a78bfa;font-size:11px";
    hint.textContent = state.writer
      ? "Local writer is online at 127.0.0.1:43147."
      : "This copies files you can already open in Code. It does not unlock paid Lovable edits.";

    panel.append(head, status, logBox, row, hint);
  }

  document.documentElement.appendChild(panel);
  render();
  probeWriter();
  log("On " + location.host + (projectIdFromUrl() ? "" : " — open a project URL."));
})();
