export const HTML = (env?: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Example</title>
</head>
<body>
  <div id="root"></div>
  <script src="/main.js"></script>${
    env === 'development'
      ? `<script>
    document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
  </script> `
      : ''
  }
</body>
</html>`
