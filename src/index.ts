import type { KVNamespace } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { html } from "hono/html";
import { secureHeaders } from "hono/secure-headers";
import { validator } from "hono/validator";
import { z } from "zod";
const schema = z.object({
	url: z.string().url(),
	key: z.union([z.literal(""), z.string().min(2).max(30)]).nullish(),
	length: z.union([z.literal(0), z.number().int().min(2).max(30)]).nullish(),
});
type Bindings = {
	KANADE: KVNamespace;
};

function generateRandomHiragana(length: number): string {
	const hiragana =
		"あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
	let result = "";
	for (let i = 0; i < length; i++) {
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
	    <label>文字数</label>
	    <input value="4" type='number' name='length' />
	    <label>カスタム文字列</label>
	    <input name="key" type="text" maxlength="30" minlength="2">
            <button>短縮</button>
          </div>
        </form>
      </body>
    </html>`,
	);
});

app.post(
	"/api/short",
	validator("json", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.text("Invalid!", 401);
		}
		return parsed.data;
	}),
	async (c) => {
		const body = c.req.valid("json");
		const url = encodeURI(body.url);
		const length = body.length || 4;
		const key = body.key || generateRandomHiragana(length);
		const check: string | null = await c.env.KANADE.get(key);
		if (check === null) {
			await c.env.KANADE.put(key, url);
			const shorten = `https://xn--s7y.xn--tckwe/${key}`;
			return c.json({ success: true, shortend: shorten });
		}
		return c.json({ success: false, key: "" });
	},
);

app.post(
	"/short",
	validator("form", (value, c) => {
		const parsed = schema.safeParse(value);
		if (!parsed.success) {
			return c.text("Invalid!", 401);
		}
		return parsed.data;
	}),
	async (c) => {
		const body = c.req.valid("form");
		const url: string = encodeURI(body.url);
		const length = body.length || 4;
const key = body.key || generateRandomHiragana(length);
		const check: string | null = await c.env.KANADE.get(key);

		if (check === null) {
			await c.env.KANADE.put(key, url);
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
            var element = document.getElementById(elementId);
            navigator.clipboard.writeText(element.value)
          }
        </script>
      </html>`,
			);
		}
		return c.json({ success: false });
	},
);

app.get("/:key", async (c) => {
	const keyy = c.req.param("key");
	if (keyy !== undefined) {
		const key = encodeURIComponent(keyy);
		const value: string | null = await c.env.KANADE.get(key, { type: "text" });
		if (value === null) {
			return c.notFound();
		}
		return c.redirect(value, 301);
	}
	return c.notFound();
});

export default app;
