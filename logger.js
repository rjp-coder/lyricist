const io = require ('./fileIO.js');

function logger() {

  let _path;
  

  function setPath(p) {
    _path = p;
  }

  function getPath() {
    return _path;
  }

  function log(str) {
    console.log(str);
    if (_path)
      io.write(_path, str);
  }

  return {getPath,setPath,log}

}

module.exports = logger();