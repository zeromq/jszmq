import { media, style } from 'typestyle'
import { calc, percent, px } from 'csx'
import {
  margin,
  padding,
  height,
  width,
  flexRoot,
  vertical,
  center,
} from 'csstips'

const mobileWidth = media({ maxWidth: 'calc(100% - 60px)' })

export const styles = {
  chat: style(
    flexRoot,
    vertical,
    center,
    width(percent(100)),
    height(percent(100)),
  ),
  header: style(padding(px(5))),
  log: style(
    height(calc('100% - 86px - 29px - 100px')),
    width(percent(50)),
    mobileWidth,
    padding(px(5)),
    { border: '1px solid black' },
  ),
  form: style(vertical, center, width(percent(50)), mobileWidth),
  input: style(width(percent(100)), height(px(30)), margin(0), padding(px(5))),
  submit: style(
    width(percent(100)),
    height(px(30)),
    padding(px(5)),
    margin(px(10), 0),
  ),
}
