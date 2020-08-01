import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { normalize, setupPage } from 'csstips'

import { Chat } from 'web/Chat'
import { ErrorBoundary } from 'web/Error'

normalize()
setupPage('#root')

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Chat />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root'),
)
