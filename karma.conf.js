module.exports = function(config) {
  config.set({
    files: [
      { pattern: "src/**/*.js", type: "module" },
      { pattern: "test/**/*.js", type: "module" }
    ],
    browsers: ["ChromeHeadless"],
    frameworks: ["mocha", "sinon-chai"],
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    singleRun: true
  });
};
