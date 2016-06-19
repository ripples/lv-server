"use strict"
import * as Fs from'fs';
import path from 'path';

export default class QueryLoader{
    constructor(pathName){
        console.log(pathName + "in the constructor");
        this.Queries ={}

        Fs.readdir(pathName, function (err, files) {
            for (let file of files) {
                this.Queries[file] = Fs.readFileSync(path.join(pathName,file)).toString();
            }

        });

    }
    get(fileName){
        return this.Queries[fileName];
    }
}