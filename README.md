# public

Sample project for troubleshooting Azure Communication Services React Library bundling.

To build and analyze this project, run

```
pnpm i
pnpm run build
```
(Recommended) To analyze bundle and see dependencies that cause Calling SDK to be included run
```
pnpm run analize3
```

To see the package bundle with BundleAnalyzer, uncomment it in `webpack.config.js`` and run
```
pnpm run analize2
```

(Original approach from the Customer) To simply see bundle size, run
```
pnpm run analize
```

If you run the application and browse to "Patient List", clicking "Start" against any patient will invoke the chat console where Azure Communication Services React Library has been used.