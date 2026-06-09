export default {
  "*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix --cache --max-warnings 0 --no-warn-ignored",
  ],
  "*.{json,css,md,mdx}": [
    "prettier --write",
  ],
};
