<H3>BEE HIVE</H3>

Bee Hive inserts itself onto the NYT Spelling Bee web page, then tallies your 
found words onto the Spelling Bee HINTS grid.  This only works on computers, not
phones.  Stay tuned; I may make a phone version later.
To use this program, you must start it from a bookmarklet.

To use, create a bookmarklet as follows:

1.  From Bookmark manager, create a new boookmark.	
	- Copy the block of text below:

        <dt><table id="bookmarklet"><tr><td><pre> javascript:if (document.URL === 'https://www.nytimes.com/puzzles/spelling-bee') {
        fetch('https://raw.githubusercontent.com/PostDoc71/SpellingBeeHelp/main/SpellingBoss.js')
        .then(r => r.text()).then(t => eval(t))}
        else {alert('This bookmarklet can only be launched from NYT Spelling Bee')} </pre><td></tr></table></dt>

	- In Chrome and Edge:  CTL-D, then [More].
	- Paste the copied text into the URL box.

		Name: Bee Hive (or whatever)<br>
		URL: paste the copied text here

2.  Launch Spelling Bee ('https://www.nytimes.com/puzzles/spelling-bee').

3.  Click the Bee Hive bookmarklet on your Bookmarks bar.

This should ease the task of tallying your entries!
NB: Genius score currently not available.

Happy Hiving!<br>
postDoc71 (retired pediatrician since age 71)
