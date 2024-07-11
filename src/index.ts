import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import type { FrameSignaturePacket } from './types'

const app = new Hono()

const moonbeam_endpoint = 'https://api.subquery.network/sq/kumawallet/kuma-moonbeam'
let FRAME_URL=""
const DEFAULT_IMAGE = 'https://imageplaceholder.net/600x400/7b68ee/ffffff?text='

function returnResponsePage(imageLink: string, inputText: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta name="fc:frame:post_url" content="${FRAME_URL}/home?hash=${inputText}" />
        <meta property="fc:frame:button:1" content="Go Back" />
        <meta property="fc:frame:button:2" content="View on explorer" />
        <meta name="fc:frame:button:2:action" content="post_redirect" />
        <meta http-equiv="refresh" content="0; url=https://moonscan.io/tx/${inputText}" />
        <title>Farcaster Frames</title>
      </head>
    </html>
  `
}

function returnHomePage(imageLink: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:input:text" content="Enter the txn hash" />
        <meta property="fc:frame:button:1" content="Search" />
        <meta http-equiv="refresh" content="0; url=https://moonscan.io/txs" />
        <title>Farcaster Frames</title>
      </head>
    </html>
  `
}

async function fetchGraphQL(query: string) {
  const response = await fetch(moonbeam_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error('Network response was not ok')
  }

  const data = await response.json()
  return data
}

app.get('/', async (c) => {
  console.log("in get /")
  const frameImage = `${DEFAULT_IMAGE}Search+txns+on+Moonbeam+by+txn+hash`
  return c.html(returnHomePage(frameImage))
})

app.post('/redirect', (c) => {
  console.log("Reached here!!")
  return c.redirect('https://moonscan.io/txs')
})

app.get('/ping', (c) => {
  console.log("in ping")
  return c.text(FRAME_URL)
})

app.get('/seturl', (c) => {
  console.log("in /seturl")
  const _frameUrl = c.req.query('url')
  if(_frameUrl !== undefined)
    FRAME_URL = _frameUrl
  return c.text('success')
})

app.post('/', async (c) => {
  console.log("in /")
  try {
    const body = await c.req.json<FrameSignaturePacket>()
    const { inputText } = body.untrustedData

    console.log("Input is: " + inputText)

    const query = `query {
      transaction(id: "${inputText}") {
        blockNumber
        status
      }
    }`

    const data = await fetchGraphQL(query)
    const txnData = data.data.transaction

    if (!txnData) {
      const frameImage = `${DEFAULT_IMAGE}txn+with+specified+hash+was+not+found`
      return c.html(returnResponsePage(frameImage, inputText))
    }

    const frameImage = `${DEFAULT_IMAGE}Txn+is+included+in+block: ${txnData["blockNumber"]} with+status: ${txnData["status"].toUpperCase()}`
    return c.html(returnResponsePage(frameImage, inputText))
  } catch (error) {
    console.error('Fetch error:', error)
    const frameImage = `${DEFAULT_IMAGE}Error+during+moonbeam+data+fetching`
    return c.html(returnResponsePage(frameImage, ""))
  }
})

app.post('/home', async (c) => {
  console.log("in home")

  const body = await c.req.json<FrameSignaturePacket>()
  const buttonIndex = body.untrustedData.buttonIndex

  const hash = c.req.query('hash')

  console.log(buttonIndex)

  if(buttonIndex == 1) {
    const frameImage = `${DEFAULT_IMAGE}Search+txns+on+Moonbeam+by+txn+hash`
    return c.html(returnHomePage(frameImage))
  } else {
    return c.redirect(`https://moonscan.io/tx/${hash}`)
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
