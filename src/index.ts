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

app.get('/api/get', async (c) => {
  const keyy = c.req.query('q')
  if (keyy !== undefined) {
  const key = encodeURIComponent(keyy)
    const value = await c.env.KANADE.get(key,{type:"text"})
    if (value === null) {
      return c.json<GetUrlResponse>({ success: false ,error:"undefined key"})
    } else {
      return c.json<GetUrlResponse>({ success: true, url: value })
    }
  }else {
	  return c.json<GetUrlResponse>({success:false, error:"query is not deined"})
  }
})
	

export default app
