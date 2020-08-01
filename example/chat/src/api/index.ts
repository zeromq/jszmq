import * as path from 'path'
import * as http from 'http'
import * as express from 'express'
import { Pub, Sub } from 'jszmq'

import { HTML } from 'api/html'
import {
  encodeActionEvent,
  decodeActionEvent,
  formatPrefix,
  Topic,
  Endpoint,
  PORT,
  endpoint,
} from 'shared'

const { NODE_ENV } = process.env

// HTTP Server
const app = express()

const dist = path.resolve(__dirname, '..', '..', 'dist')

const serveFile = (file: string, mime: string) =>
  app.get(file, (_req, res) => {
    res.set({ 'Content-Type': mime })
    res.sendFile(path.join(dist, file), mime)
  })

serveFile('/main.js', 'text/javascript')

app.get('*', (req, res) => {
  const { path } = req
  console.info(path)
  res.send(HTML(NODE_ENV))
})

const server = http.createServer(app)

// Serialization

// ZeroMQ Connections
const pub = new Pub()
const sub = new Sub()

pub.bind(endpoint.browser, server)

sub.subscribe(formatPrefix(Endpoint.Server, Topic.Chat_Message))
sub.bind(endpoint.server, server)

// Relay Browser Events
sub.on('message', (msg: Buffer) => {
  const { endpoint, topic, payload } = decodeActionEvent(msg)
  if (endpoint === Endpoint.Server && topic === Topic.Chat_Message) {
    pub.send(encodeActionEvent(Endpoint.Browser, topic, payload))
  }
})

// Run Server
server.listen(PORT, () => {
  console.info('listening on port', PORT)
})
