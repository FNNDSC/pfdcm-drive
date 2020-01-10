#!/bin/bash
":" //# comment; exec /usr/bin/env node --experimental-modules "$0" "$@"

import {readFileSync, writeFileSync}	from 'fs';
import	posthtml			from 'posthtml';
import 	beautify 			from 'posthtml-beautify';

import  *       as path                 from 'path';

const   args    = process.argv.slice(2);
 
if(process.argv.length <= 2) {
    console.log("ENV: [node]   = %s", process.argv[0]);
    console.log("ENV: [script] = %s", process.argv[1])
    console.log("\nSYNOPSIS:\n");
    console.log("\t[%s] %s <inputFile> <outputFile>\n", 
                path.basename(process.argv[0]), 
                path.basename(process.argv[1]));
    console.log("DESC:");
    console.log("\tThis script beautifies an ugly <inputFile>");
    console.log("\tand saves the pretty results to <outputFile>.\n");
    process.exit(1);
}

const   html    = readFileSync(args[0], 'utf8');
 
posthtml()
    .use(beautify({rules: {indent: 4}}))
    .process(html)
    .then(result => {
        writeFileSync(args[1], result.html);
    });
