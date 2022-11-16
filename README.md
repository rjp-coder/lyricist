# Lyricist 

This project aims to show what can be accomplished with modern ECMA script, Node.js, and Puppeteer/cheerio. It uses the revealing module design pattern.

## Get started

Clone the project and copy the config/public.json to make a config/default.json. It should include Reedsy account details. (Set up a reedsy account if you don't have one).

Edit the songlist.csv to be the songs you prefer. 

To run the project first <code>npm install</code> the dependencies, then run the command <code>node main.js</code>

## Process

Given a csv file of songs, lyricist will search for guitar tablature on ultimate-guitar.com and save the resulting tab to a text file. It will, in parallel, search the lyrics site Genius for the same song, and save the lyrics in another text file. After all songs are saved as text files (songs that could not be found are skipped), lyricist will open up Reedsy, log in and compose an e-book using the contents of text files. This is then sent to the email address associated with the Reedsy account. 

## Inputs

Provide your songlist.csv file in the format 

songname,artist\
songname,artist\
... 

You will need a Reedsy account set up to do online e-book publishing, and to edit the config/public.json "Reedsy" section to contain your Reedsy username and password. 

## Output

You will receive an e-book in general format and a kindle formatted e-book sent to your email address. The e-book contains lyrics and guitar tablature for all of the songs listed in your songlist. 

There is also be a logfile for any songs failed to be retrieved: failedsongs.log, and failedsongs_lyrics.log.

## Maintenance

As this is a webscraper, any changes to the websites it uses may break its functionality. The CSS selectors used were carefully chosen to be correct for as long as possible but this fundamentally cannot be guaranteed. The project will be reviewed occasionally and updated if breaking changes are made on the websites that it uses.

## Legal

This program is for demonstration of programming languages and personal use only. You should check the relevant legislation in your country to be sure you can use it. The program is not to be used for profit except with express agreement from all relevant parties including the orginal artists/owner of material, the uploader of the content, and the platforms hosting the content.

You may use, modify, or redistribute this program however you like, so long as you do not charge money for reselling. 

If you wish to use this program for profit then you can ask for permission via a github PR.
