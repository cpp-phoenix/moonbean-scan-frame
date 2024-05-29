import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import type { FrameSignaturePacket } from './types'

const app = new Hono()

const endpoint = 'https://api.subquery.network/sq/subquery/subquery-mainnet' // Replace with your actual URL
const DEFAULT_IMAGE = 'https://imageplaceholder.net/600x400/7b68ee/ffffff?text='

interface Era {
  id: number
  createdBlock: number
}

function numberToHexByte(num: number): string {
  if (num < 0 || num > 255) {
    throw new Error('Number out of byte range (0-255)')
  }
  return `0x${num.toString(16).padStart(2, '0')}`
}

function returnHTML(imageLink: string) {
  return html`
    <html lang="en">
      <head>
        <meta property="og:image" content="${imageLink}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageLink}" />
        <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
        <meta property="fc:frame:input:text" content="Check SubQuery Era" />
        <meta property="fc:frame:button:1" content="Submit" />
        <title>Farcaster Frames</title>
      </head>
      <body>
        <h1>Hello Farcaster!</h1>
        <p className="mb-10">Refresh browser to refresh image</p>
      </body>
    </html>
  `
}

async function fetchGraphQL(query: string) {
  const response = await fetch(endpoint, {
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
  try {
    const query = `query {
      eras (orderBy: ID_DESC first: 1) {
        nodes {
          id
          startTime
          endTime
          createdBlock
          lastEvent
        }
      }
    }`
    const data = await fetchGraphQL(query)
    const node = data.data.eras.nodes[0]

    if (node) {
      const era: Era = {
        id: parseInt(node.id, 16),
        createdBlock: node.createdBlock,
      }

      const frameImage = `${DEFAULT_IMAGE}Current++SubQuery+Era:+${era.id}`
      return c.html(returnHTML(frameImage))
    } else {
      const frameImage = `${DEFAULT_IMAGE}Invalid+response`
      return c.html(returnHTML(frameImage))
    }
  } catch (error) {
    console.error('Fetch error:', error)
    const frameImage = `${DEFAULT_IMAGE}Error+while+fetching`
    return c.html(returnHTML(frameImage))
  }
})

app.post('/', async (c) => {
  try {
    const body = await c.req.json<FrameSignaturePacket>()
    const { inputText } = body.untrustedData

    if (!Number.isInteger(Number(inputText))) {
      const frameImage = `${DEFAULT_IMAGE}Invalid+value+entered`
      return c.html(returnHTML(frameImage))
    }

    const query = `query {
      era(id: "${numberToHexByte(Number(inputText))}") {
        startTime
        nodeId
        lastEvent
        id
        endTime
        createdBlock
      }
    }`

    const data = await fetchGraphQL(query)
    const node = data.data.era

    if (!node) {
      const frameImage = `${DEFAULT_IMAGE}Era+with+specified+id+was+not+found`
      return c.html(returnHTML(frameImage))
    }

    const frameImage = `${DEFAULT_IMAGE}Era+${Number(inputText)}+started+on+block+${node.createdBlock}`
    return c.html(returnHTML(frameImage))
  } catch (error) {
    console.error('Fetch error:', error)
    const frameImage = `${DEFAULT_IMAGE}Error+during+Era+data+fetching`
    return c.html(returnHTML(frameImage))
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
