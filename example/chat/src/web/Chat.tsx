import * as React from 'react'
import { Pub, Sub } from 'jszmq'
import * as cuid from 'cuid'
import { style } from 'typestyle'

import {
  encodeActionEvent,
  decodeActionEvent,
  formatPrefix,
  Endpoint,
  Topic,
  ChatMessage,
  PORT,
} from 'shared'
import { textColors } from 'web/colors'
import { styles } from 'web/styles'

// Styles
const colorClasses = [
  textColors.green1,
  textColors.green2,
  textColors.green3,
  textColors.green4,
  textColors.blue1,
  textColors.blue2,
  textColors.blue3,
  textColors.blue4,
  textColors.purple1,
  textColors.purple2,
  textColors.yellow1,
  textColors.orange1,
  textColors.orange2,
  textColors.orange3,
  textColors.red1,
  textColors.red2,
]

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

  const usernameInput = React.createRef<HTMLTextAreaElement>()

  const usernameHandler = (evt: React.FormEvent) => {
    const value = usernameInput.current?.value || ''
    setUsername(value)

    const chatMessage = encodeActionEvent(Endpoint.Server, Topic.Chat_Message, {
      id: cuid(),
      user: value,
      text: `has entered the chat`,
      time: Date.now(),
    })

    if (usernameInput.current) {
      usernameInput.current.value = ''
      usernameInput.current.focus()
    }

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
      <div className={styles.chat}>
        <div className={styles.header}>Turtle Chat</div>
        <form
          className={styles.form}
          autoComplete="false"
          onSubmit={usernameHandler}
        >
          <textarea
            className={styles.input}
            ref={usernameInput}
            placeholder="Your Username"
          />
          <input type="submit" className={styles.submit} value="Set Username" />
        </form>
      </div>
    )
  }

  const text = React.createRef<HTMLTextAreaElement>()

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
      text.current.focus()
    }

    evt.preventDefault()
  }

  return (
    <div className={styles.chat}>
      <div className={styles.header}>Turtle Chat</div>
      <form
        className={styles.form}
        autoComplete="false"
        onSubmit={submitHandler}
      >
        <textarea className={styles.input} ref={text} />
        <input className={styles.submit} type="submit" value="Send" />
      </form>
      <div className={styles.log}>
        {messages.map((message: ChatMessage) => {
          const { id, user, text } = message
          return (
            <div key={id}>
              <span className={style(colorClassHash(user))}>{user}</span>
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
