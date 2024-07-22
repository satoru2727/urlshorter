import { Hono } from "hono";
import { KVNamespace } from "@cloudflare/workers-types";
import { html } from "hono/html";
import { secureHeaders } from "hono/secure-headers";
import { z } from "zod";

type Bindings = {
	KANADE: KVNamespace;
};

function generateRandomHiragana(): string {
	const hiragana =
		"あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
	let result = "";
	for (let i = 0; i < 4; i++) {
		const randomIndex = Math.floor(Math.random() * hiragana.length);
		result += hiragana[randomIndex];
	}
	return result;
}

const app = new Hono<{ Bindings: Bindings }>();

app.use(secureHeaders());

app.get("/", (c) => {
	return c.html(
		html`<!doctype html>
    <html>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
      </head>
      <body>
        <h1>URL短縮サービス</h1>
        <div>
          <span>短縮したいURLを入力してください</span>
        </div>
        <form action='/short' method='post'>
          <div>
            <label>URL</label>
            <input type='url' name='url' required />
            <button>短縮</button>
          </div>
        </form>
      </body>
    </html>`,
	);
});

app.post("/api/short", async (c) => {
	const body: { url: string; key: string } = await c.req.json();
	const url = encodeURI(body.url);
	const key = body.key;
	const check: string | null = await c.env.KANADE.get(key);
	if (check === null) {
		await c.env.KANADE.put(key, url);
		const shorten = `https://xn--s7y.xn--tckwe/${key}`;
		return c.json({ success: true, shortend: shorten });
	} else {
		return c.json({ success: false, key: "" });
	}
});

app.post("/short", async (c) => {
	const Body = await c.req.parseBody();
	const url2 = encodeURI(Body.url as string);
	const hiragana = generateRandomHiragana();
	const key = encodeURIComponent(hiragana);
	const check: string | null = await c.env.KANADE.get(key);

	if (check === null) {
		await c.env.KANADE.put(key, url2);
		const decoded = decodeURIComponent(key);
		const me = new URL(`/${key}`, "https://xn--s7y.xn--tckwe");
		const you = `https://短.コム/${decoded}`;
		return c.html(
			html`
      <html>
        <head>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
        </head>
        <body>
          <h1>URLが生成されました</h1>
          <h2>https://短.コム${decoded}</h2>
          <input id="copyTarget1" type="text" value=${you} readonly />
          <button onclick="copyButton('copyTarget1')">日本語でURLをコピーする</button>
          <input id="coppyTarget2" type="text" value=${me} readonly />
          <button onclick="copyButton('copyTarget2')">英語でURLをコピーする</button>
        </body>
        <script>
          function copyButton(elementId: string) {
            var element = document.getElementById(elementId) as HTMLInputElement;
            navigator.clipboard.writeText(element.value)
          }
        </script>
      </html>`,
		);
	} else {
		return c.json({ success: false });
	}
});

app.get("/:key", async (c) => {
	const keyy = c.req.param("key");
	if (keyy !== undefined) {
		const key = encodeURIComponent(keyy);
		const value: string | null = await c.env.KANADE.get(key, { type: "text" });
		if (value === null) {
			return c.notFound();
		} else {
			return c.redirect(value, 301);
		}
	} else {
		return c.notFound();
	}
});

export default app;
