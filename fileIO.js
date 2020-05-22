const csv = require('csv-parser');
const csvw = require('csv-writer');
const fs = require('fs');

function fileIO() {

  let readCsv = fname => {
    return new Promise((resolve, reject) => {

      let rows = [];
      fs.createReadStream(fname)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          resolve(rows);
        });
    })

  }

  let writeCsv = (fname, data) => {
    return csvw.createArrayCsvWriter({ path: fname, header: ['key', 'value'] }).writeRecords(data);
  }

  let write = (fname, data) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(fname, data, (err) => {
        if (err) { reject(err); }
        else { console.log("Successfully Written to File: " + fname); resolve(); }
      });

    })
  }

  let read = function (filename) { return readFileAsync(filename) };
  let readFileAsync = function (filename) {
    return new Promise(function (resolve, reject) {
      fs.readFile(filename, 'utf-8', function (err, data) {
        if (err)
          reject(err);
        else
          resolve(data);
      });
    });
  };


  let convert = function (arrayOfObjects) {
    return arrayOfObjects.map(a => [a.key, a.value]);
  }

  async function fileExists(fname) {
    try {
      await fs.promises.access(fname);
      return true;
      // The check succeeded
    } catch (error) {
      return false;
    }
  }

  return { read, write, readCsv, writeCsv, convert,fileExists }
}

module.exports = fileIO();