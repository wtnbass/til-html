module.exports = function(config) {
  config.set({
    files: [
      { pattern: "src/**/*.js", type: "module" },
      { pattern: "test/**/*.js", type: "module" }
    ],
    browsers: ["ChromeHeadless"],
    frameworks: ["mocha", "sinon-chai"],
    preprocessors: {
      "src/**/*.js": ["karma-coverage-istanbul-instrumenter"]
    },
    reporters: ["mocha", "coverage"],
    mochaReporter: {
      showDiff: true
    },
    coveragePreprocessor: {
      options: {
        sourceType: "module"
      }
    },
    coverageIstanbulInstrumenter: {
      esModules: true
    },
    coverageReporter: {
      dir: "coverage/",
      reporters: [
        { type: "text-summary" },
        { type: "html", subdir: "html" },
        { type: "lcovonly", subdir: ".", file: "lcov.info" }
      ]
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    singleRun: true
  });
};
