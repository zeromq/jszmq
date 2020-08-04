import * as path from 'path'

const entry = path.resolve(__dirname, 'web', 'index.js')
const output = path.resolve(__dirname, '..', 'dist')

export default {
  mode: 'development',
  entry,
  output: {
    filename: 'main.js',
    path: output,
  },
}
