// CRA 5 ignores a standalone postcss.config.js because it inlines its own postcss
// options. `mode: 'file'` clears those so postcss-loader reads postcss.config.js,
// which is what wires Tailwind into the build.
module.exports = {
  style: {
    postcss: { mode: 'file' },
  },
};
