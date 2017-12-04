# TDE Webpack SVG Plugin 

Webpack plugin for converting SVG files to HTML

## Install

```bash
npm install --save-dev tde-webpack-svg-plugin
```

## Usage

In your `webpack.config.js`

```javascript
var SvgPlugin = require('tde-webpack-svg-plugin');

module.exports = {
    // ...
    plugins: [
        new SvgPlugin(paths.SVG, {
            mode: {
                symbol: {
                    inline: true,
                },
            },
            dest: paths.DIST_PRIVATE + '/svg'
        }),
    ]
};
```

## API:

```js
// webpack.config.js

module.exports = {
    plugins: [
        new SvgPlugin(inputPath, options)
    ]
}
```

### `inputPath`

Type: `String`

The path where SVG files are located

### `options`

Type: `Object`<br>

See https://github.com/jkphl/svg-sprite/blob/master/docs/configuration.md

## License

MIT © [TDE](https://github.com/tdeNL)
