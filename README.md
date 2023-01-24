BEE HIVE

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
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta autocomplete="off">
    <meta font-family="Arial, Helvetica, sans-serif">
    <title>Bee Hive</title>
</head>

<body>
<H3>BEE HIVE</H3>
<p>Bee Hive inserts itself onto the NYT Spelling Bee web page, then tallies your <br>
found words onto the Spelling Bee HINTS grid.  This only works on computers, not<br>
phones.  Stay tuned; I may make a phone version later.<br>
To use this program, you must start it from a bookmarklet.</p>
<p>To use, create a bookmarklet as follows:</p>
<ol>
	<li>From Bookmark manager, create a new bookmark.<br>
        <ul>
            <li>Press the Copy button below.<br>
                <input type="text" value="javascript:if (document.URL === 'https://www.nytimes.com/puzzles/spelling-bee') {
                    fetch('https://raw.githubusercontent.com/PostDoc71/SpellingBeeHelp/main/SpellingBoss.js')
                    .then(r => r.text()).then(t => eval(t))}
                    else {alert('This bookmarklet can only be launched from NYT Spelling Bee')}" id="myInput">
                <button title="Copy text for URL" onclick="copyURL('myInput')">Copy</button><br>
            <li>In Chrome and Edge: CTL-D, then [More].<br>
            <li>Paste the copied text into the URL box.</li>
        </ul>
        
        <dt>&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;Name:  Bee Hive (or whatever)</dt>
        <dt>&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;&ensp;URL: copied text</dt><br>
    <li>Launch <button title="Click to start Spelling Bee" onclick="document.location='https://www.nytimes.com/puzzles/spelling-bee'">Spelling Bee</button></li><br>
    <li>Click the Bee Hive bookmarklet on your Bookmarks bar.</li>
</ol>

<p>This should ease the task of tallying your entries!</p>

<p>Happy Hiving!<br>postDoc71 (ie retired pediatrician as of age 71)</p>
<p>NB: Genius score currently not available.</p>
  
<script>
    function copyURL(input) {
      var copyText = document.getElementById(input);
      copyText.select();
//   copyText.setSelectionRange(0, 99999); // For mobile devices
      // Copy the text inside the text field
      navigator.clipboard.writeText(copyText.value);
      return;
    }
</script>

<style>
    #bookmarklet {
        border: 1px solid black;
        width: 40ch;
        padding: 4px;
    }
    #lnk:link {
        color:darkblue;
        background-color: whitesmoke;;
        text-decoration: none;
    }
    #lnk:hover {
        color: darkred;
        background-color: whitesmoke;
        text-decoration: none;
    }
</style>

</body>
</html>
