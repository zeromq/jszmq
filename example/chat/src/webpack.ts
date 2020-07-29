import * as path from 'path'

const entry = path.resolve(__dirname, 'web.js')
const output = path.resolve(__dirname, '..', 'dist')

export default {
  mode: 'development',
  entry,
  output: {
    filename: 'main.js',
    path: output,
  },
}
