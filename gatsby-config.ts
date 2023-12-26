import * as path from 'path';
// Get paths of Gatsby's required rules, which as of writing is located at:
// https://github.com/gatsbyjs/gatsby/tree/fbfe3f63dec23d279a27b54b4057dd611dce74bb/packages/
// gatsby/src/utils/eslint-rules
const gatsbyRequiredRules = path.join(
  process.cwd(),
  "node_modules",
  "gatsby",
  "dist",
  "utils",
  "eslint-rules",
);

module.exports = {
    pathPrefix:"/",
    siteMetadata: {
      title: `Datavisualisation - Projet - Quentin CHAPEL`,
    },
    plugins: [
    ],
  }

require('ts-node').register({
    compilerOptions: {
        module: 'commonjs',
        target: 'es2017',
    },
})