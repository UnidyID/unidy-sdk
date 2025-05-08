/**
 * CSS transform for Jest
 * 
 * This is a custom transformer for Jest that returns an empty object for CSS imports.
 * It's used to mock CSS imports in Jest tests.
 */

'use strict';

// This is a custom Jest transformer turning style imports into empty objects.
// http://facebook.github.io/jest/docs/en/webpack.html

module.exports = {
  process() {
    return {
      code: 'module.exports = {};',
    };
  },
  getCacheKey() {
    // The output is always the same.
    return 'cssTransform';
  },
};