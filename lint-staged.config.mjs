export default {
  "*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix --cache",
  ],
  "*.{json,css,md,mdx}": [
    "prettier --write",
  ],
};
