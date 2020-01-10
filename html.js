#!/usr/bin/env node

var     html    = require('simple-html-index')
const   path    = require('path');
const   args    = process.argv.slice(2);

if(process.argv.length <= 2) {
    console.log("ENV: [node]   = %s", process.argv[0]);
    console.log("ENV: [script] = %s", process.argv[1])
    console.log("\nSYNOPSIS:\n");
    console.log("\t[%s] %s <pageTitle> <jsScript> [> <outputFile>.html]\n", 
                path.basename(process.argv[0]), 
                path.basename(process.argv[1]));
    console.log("DESC:");
    console.log("\tThis script can be used to quickly create a simple html page");
    console.log("\tthat loads a <jsScript> javascript source file.\n");
    process.exit(1);
}

html({ title: args[0], entry: args[1] })
  .pipe(process.stdout)

