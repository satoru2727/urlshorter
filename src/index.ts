import { Hono } from 'hono'
import { KVNamespace } from '@cloudflare/workers-types'

type Bindings = {
  KANADE: KVNamespace
}

type ShortUrlRequest = {
  value: string
}

type ShortUrlResponse = {
  success: boolean
  short?: string
}

type GetUrlResponse = {
  success: boolean
  url?: string
  error? : string
}

function generateRandomHiragana(): string {
  const hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
  let result = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * hiragana.length);
    result += hiragana[randomIndex];
  }
  return result;
}

const app = new Hono<{Bindings: Bindings}>()

app.post('/api/short', async (c) => {
  const { value } = await c.req.json<ShortUrlRequest>()
  const url = encodeURI(value)
  const hiragana = generateRandomHiragana()
  const key = encodeURIComponent(hiragana)
  const check = await c.env.KANADE.get(key)
  
  if (check === null) {
    await c.env.KANADE.put(key, url)
    return c.json<ShortUrlResponse>({ success: true, short: key })
  } else {
    return c.json<ShortUrlResponse>({ success: false })
  }
})

app.get('/:key', async (c) => {
  const keyy = c.req.param('key')
  if (keyy !== undefined) {
  const key = encodeURIComponent(keyy)
    const value = await c.env.KANADE.get(key,{type:"text"})
    if (value === null) {
	return c.notFound()
    } else {
	    return c.redirect(value,301)
    }
  }else {
	  return c.notFound()
  }
})
	

export default app
