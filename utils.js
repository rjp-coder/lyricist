function utils(){

    function getGeniusUrlFromSongAndArtist(song,artist){
        return `https://genius.com/` + (artist + "-" + song+"-lyrics").trim().replace(/ /g,"-");
    }

    function getFilenameFromSongArtistAndType(song,artist,type){
        return (artist + "-" + song + (type? "-"+type:"") ).trim().replace(/ /g,"-")+".txt";
    }

    function getPathToSongs(){
        return "./outputs/lyrics/";
    }

    return {getGeniusUrlFromSongAndArtist,getFilenameFromSongArtistAndType,getPathToSongs};
}

module.exports = utils();