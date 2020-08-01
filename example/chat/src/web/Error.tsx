import * as React from 'react'

interface Props {}

interface State {
  hasError: boolean
}

export const Error = () => (
  <h1>Something went wrong. Check the logs for more.</h1>
)

export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false }

  static getDerivedStateFromError(err: string) {
    console.error(err)
    return { hasError: true }
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error(err, info)
  }

  render() {
    if (this.state.hasError) {
      return <Error />
    }

    return this.props.children
  }
}
