import type { KVNamespace } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { html } from "hono/html";
import { secureHeaders } from "hono/secure-headers";
import { validator } from "hono/validator";
import { z } from "zod";
const schema = z.object({
	url: z.string().url(),
	key: z.string().min(2).max(30).nullish(),
	length: z.coerce.number().min(2).max(30).nullish()
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
		<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>短.コム</title>
    <style>
        :root {
            --bg-color: #ffffff;
            --text-color: #333333;
            --input-bg: #f0f0f0;
            --button-bg: #4CAF50;
            --button-text: #ffffff;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #333333;
                --text-color: #ffffff;
                --input-bg: #555555;
                --button-bg: #45a049;
                --button-text: #ffffff;
            }
        }

        body {
            font-family: Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            text-align: center;
        }

        .container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .form-section {
            background-color: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 5px;
        }

        .form-section h2 {
            margin-top: 0;
        }

        form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        label {
            font-weight: bold;
        }

        input {
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: var(--input-bg);
            color: var(--text-color);
        }

        button {
            background-color: var(--button-bg);
            color: var(--button-text);
            padding: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }

        button:hover {
            opacity: 0.9;
        }

        ul {
            padding-left: 20px;
        }

        @media (max-width: 600px) {
            body {
                padding: 10px;
            }

            .form-section {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <h1>URL短縮サービス</h1>
    <div class="container">
        <div class="form-section">
            <h2>ランダム文字列</h2>
            <form action='/short' method='post'>
                <label for="random-url">URL</label>
                <input type='url' id="random-url" name='url' required />
                <label for="random-length">文字数</label>
                <input value="4" type='number' id="random-length" name='length' />
                <button type="submit">短縮</button>
            </form>
        </div>
        <div class="form-section">
            <h2>カスタム文字列</h2>
            <form action='/short' method='post'>
                <label for="custom-url">URL</label>
                <input type='url' id="custom-url" name='url' required />
                <label for="custom-key">カスタム文字列</label>
                <input id="custom-key" name="key" type="text" maxlength="30" minlength="2">
                <button type="submit">短縮</button>
            </form>
        </div>
    </div>
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
		const key = encodeURIComponent(body.key || generateRandomHiragana(length));
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
const key = encodeURIComponent(body.key || generateRandomHiragana(length));
		const check: string | null = await c.env.KANADE.get(key);

		if (check === null) {
			await c.env.KANADE.put(key, url);
			const decoded = decodeURIComponent(key);
			const me = new URL(`/${key}`, "https://xn--s7y.xn--tckwe");
			const you = `https://短.コム/${decoded}`;
			return c.html(
				html`
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL生成結果</title>
    <style>
      :root {
        --bg-color: #ffffff;
        --text-color: #333333;
        --input-bg: #f0f0f0;
        --button-bg: #4CAF50;
        --button-text: #ffffff;
        --notification-bg: #4CAF50;
        --notification-text: #ffffff;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg-color: #333333;
          --text-color: #ffffff;
          --input-bg: #555555;
          --button-bg: #45a049;
          --button-text: #ffffff;
          --notification-bg: #45a049;
          --notification-text: #ffffff;
        }
      }

      body {
        font-family: Arial, sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        line-height: 1.6;
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      }

      h1 {
        margin-bottom: 20px;
      }

      h2 {
        word-break: break-all;
        margin-bottom: 30px;
      }

      .copy-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 20px;
      }

      input[type="text"] {
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: var(--input-bg);
        color: var(--text-color);
      }

      button {
        background-color: var(--button-bg);
        color: var(--button-text);
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
      }

      button:hover {
        opacity: 0.9;
      }

      #notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--notification-bg);
        color: var(--notification-text);
        padding: 10px 20px;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.3s;
      }

      @media (max-width: 480px) {
        body {
          padding: 10px;
        }
      }
    </style>
  </head>
  <body>
    <h1>URLが生成されました</h1>
    <h2>https://短.コム${decoded}</h2>
    <div class="copy-container">
      <input id="copyTarget1" type="text" value=${you} readonly />
      <button onclick="copyButton('copyTarget1', '日本語URLがコピーされました')">日本語でURLをコピーする</button>
    </div>
    <div class="copy-container">
      <input id="copyTarget2" type="text" value=${me} readonly />
      <button onclick="copyButton('copyTarget2', 'English URL has been copied')">英語でURLをコピーする</button>
    </div>
    <div id="notification"></div>
  </body>
  <script>
    function copyButton(elementId, message) {
      var element = document.getElementById(elementId);
      navigator.clipboard.writeText(element.value)
        .then(() => {
          showNotification(message);
        })
        .catch(err => {
          console.error('コピーに失敗しました', err);
          showNotification('コピーに失敗しました。手動でコピーしてください。');
        });
    }

    function showNotification(message) {
      const notification = document.getElementById('notification');
      notification.textContent = message;
      notification.style.opacity = 1;
      setTimeout(() => {
        notification.style.opacity = 0;
      }, 2000);
    }
  </script>
</html>
`
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
