import * as React from 'react'
import { Pub, Sub } from 'jszmq'
import cuid from 'cuid'

import {
  encodeActionEvent,
  decodeActionEvent,
  formatPrefix,
  Endpoint,
  Topic,
  ChatMessage,
  PORT
} from './shared'

// Styles
const colorClasses = [
  'flat-green-1',
  'flat-green-2',
  'flat-green-3',
  'flat-green-4',
  'flat-blue-1',
  'flat-blue-2',
  'flat-blue-3',
  'flat-blue-4',
  'flat-purple-1',
  'flat-purple-2',
  'flat-yellow-1',
  'flat-orange-1',
  'flat-orange-2',
  'flat-orange-3',
  'flat-red-1',
  'flat-red-2',
]

const classNames = (...classes: string[]): string => {
  return classes.join(' ')
}

const colorClassHash = (str: string) => {
  const total = str
    .split('')
    .reduce((acc, char: string) => acc + char.charCodeAt(0), 0)

  return colorClasses[total % colorClasses.length]
}

// Component
interface ChatProps {
  pub: Pub
  sub: Sub
  topic: Topic
}

type MessageReducer = React.Reducer<ChatMessage[], ChatMessage>
const messageReducer = (
  state: ChatMessage[],
  action: React.ReducerAction<MessageReducer>,
) => {
  return [...state, action]
}

export const ChatLog: React.FC<ChatProps> = ({ pub, sub, topic }) => {
  const [messages, dispatchMessage] = React.useReducer<MessageReducer>(
    messageReducer,
    [],
  )

  const [username, setUsername] = React.useState<string>('')

  const usernameInput = React.createRef<HTMLInputElement>()

  const usernameHandler = (evt: React.FormEvent) => {
    const value = usernameInput.current?.value || ''
    setUsername(value)

    const chatMessage = encodeActionEvent(Endpoint.Server, Topic.Chat_Message, {
      id: cuid(),
      user: value,
      text: `has entered the chat`,
      time: Date.now(),
    })

    pub.send(chatMessage)
    evt.preventDefault()
  }

  const messageHandler = (msg: Buffer) => {
    const actionEvent = decodeActionEvent<ChatMessage>(msg)
    if (
      actionEvent.endpoint === Endpoint.Browser &&
      topic === actionEvent.topic
    ) {
      dispatchMessage(actionEvent.payload)
    }
  }

  React.useEffect(() => {
    sub.subscribe(formatPrefix(Endpoint.Browser, Topic.Chat_Message))
    sub.on('message', messageHandler)

    return () => {
      sub.removeListener('message', messageHandler)
      sub.unsubscribe(formatPrefix(Endpoint.Browser, Topic.Chat_Message))
    }
  }, [true])

  if (!username.length) {
    return (
      <div className="chat">
        <form autoComplete="false" onSubmit={usernameHandler}>
          <input
            type="text"
            ref={usernameInput}
            className={classNames('username', username)}
            placeholder="Your Username"
          />
          <input type="submit" value="Set Username" />
        </form>
      </div>
    )
  }

  const text = React.createRef<HTMLInputElement>()

  const submitHandler = (evt: React.FormEvent) => {
    const value = text.current?.value || ''

    const chatMessage = encodeActionEvent<ChatMessage>(
      Endpoint.Server,
      Topic.Chat_Message,
      {
        id: cuid(),
        user: username,
        text: value,
        time: Date.now(),
      },
    )

    pub.send(chatMessage)

    if (text.current) {
      text.current.value = ''
    }

    evt.preventDefault()
  }

  return (
    <div className="chat">
      <div className="chat-header">Turtle Chat</div>
      <form autoComplete="false" onSubmit={submitHandler}>
        <input type="text" ref={text} />
        <input type="submit" value="Send" />
      </form>
      <div className="chat-log">
        {messages.map((message: ChatMessage) => {
          const { id, user, text } = message
          return (
            <div key={id} className="chat-message">
              <span className={colorClassHash(user)}>{user}</span>
              &nbsp;
              <span>{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const Chat: React.FC = () => {
  const pub = new Pub()
  const sub = new Sub()

  React.useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

    pub.connect(`${protocol}//localhost:${PORT}/server`)
    sub.connect(`${protocol}//localhost:${PORT}/browser`)

    return () => {
      pub.close()
      sub.close()
    }
  })

  return <ChatLog pub={pub} sub={sub} topic={Topic.Chat_Message} />
}
