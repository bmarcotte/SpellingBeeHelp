BEE HIVE

This program inserts itself onto the NYT Spelling Bee web page (https://www.nytimes.com/puzzles/spelling-bee). It tallies the found words onto the Spelling Bee HINTS grid.

To use:

- Create a bookmarklet as follows:
	From Bookmark manager, create a new bookmark.
		Name:  Bee Hive (or whatever)
		URL: copy and paste the text below:

javascript:if (document.URL === 'https://www.nytimes.com/puzzles/spelling-bee') {    fetch('https://raw.githubusercontent.com/PostDoc71/SpellingBeeHelp/main/SpellingBoss.js').then(r => r.text()).then(t => eval(t))} else {alert('This bookmarklet can only be launched from NYT Spelling Bee')}

- Launch Spelling Bee.
- Click the bookmarklet on your Bookmarks bar.


Hope this eases the task of tallying your entries!

postDoc71 (ie retired pediatrician as of age 71)