import { Buffer } from 'buffer'

// Endpoints
export const PORT = process.env.EXPRESS_PORT || 3000

export const endpoint = {
  browser: `ws://localhost:${PORT}/browser`,
  server: `ws://localhost:${PORT}/server`
}

// Serialization
export enum Topic {
  Chat_Message = 'chat/message',
}

export enum Endpoint {
  Browser = 'Browser',
  Server = 'Server',
}

export interface ActionEvent<T> {
  endpoint: Endpoint
  topic: Topic
  payload: T
}

export const formatPrefix = (endpoint: Endpoint, topic: Topic) =>
  Buffer.from(JSON.stringify([endpoint, topic])).slice(0, -2) // removes "] for topic generalization

export const encodeActionEvent = <T>(
  endpoint: Endpoint,
  topic: Topic,
  payload: T,
) => JSON.stringify([endpoint, topic, payload])

export const decodeActionEvent = <T>(msg: Buffer): ActionEvent<T> => {
  const [endpoint, topic, payload] = JSON.parse(msg.toString('utf-8')) as [
    Endpoint,
    Topic,
    T,
  ]
  return { endpoint, topic, payload }
}

// Message Types
export interface ChatMessage {
  id: string
  user: string
  text: string
  time: number
}
