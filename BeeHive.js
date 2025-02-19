(async () => {            // OUTER SHELL
    'use strict';
    
//======================================
// LOAD PROGRAM AFTER CONDITIONS MET
//======================================

    /* ----- Do not allow to launch more than once ----- */
    // if (window.hiveLoaded) {
    //     // alert('Bee Hive program has already been loaded.\nPlease buzz on by (apian for continue).');
    //     customAlert ('The Bee Hive program has already been loaded.  Please buzz on by (Apian language for continue).', 'PLEASE NOTE', 'Continue')
    //     return;
    // }
    window.hiveLoaded = true;

    /* ----- Do not launch while on Welcome or Queen Bee pages ----- */
    await waitForCondition(
        document.getElementById('js-hook-pz-moment__welcome'),      // Welcome page
        document.getElementById('js-hook-pz-moment__congrats'));    // Queen Bee page
    main();

    function waitForCondition(welcome, queenBee) {
        return new Promise(resolveElement => {
            const checkForCondition = () => {           // both frames invisible
                if (welcome.clientHeight + queenBee.clientHeight === 0) {
                    resolveElement(true);
                } else {
                    setTimeout(checkForCondition, 10);
                }
            };
            checkForCondition();
        });
    }
      
//======================================
// MAIN FUNCTION
//======================================

async function main() {

    //--------------------------------------
    // MAIN CONSTANTS AND VARIABLES
    //--------------------------------------

    /* ----- System data ----- */
    const devicePhone = detectPhoneDevice();    // DEBUG: either should work, but .orientation will lose support
    // const devicePhone = (window.orientation === 'undefined') ? false : true;
    const HintsHTML = await getHints();         // data from Spelling Bee page
    const hintDiv = setUpHintDiv();             // initialize DOM

    // Settings
    let ShowBlankCells = false;                 // toggle: show/hide empty data cells           
    let ShowRemaining = false;                  // toggle: show remaining vs found words
    let SubTotalsAtTop = false;                 // toggle: placement of subtotal line
    let SaveSetting = false;                    // toggle: save above in cookie
    let KLUDGE = true;                          // DEBUG

    const El = {
        MetaStats1: document.getElementById('metastats1'),
        MetaStats2: document.getElementById('metastats2'),
        MetaStats3: document.getElementById('metastats3'),
        MetaStats4: document.getElementById('metastats4'),
        Legend: document.getElementById('legend'),
        Table: document.getElementById('table0'),
        TableHeader: document.getElementById('header'),
        ShowBlankCells: document.getElementById('hideEmptyCells'),
        ShowRemaining: document.getElementById('showRemaining'),
        SubTotalsAtTop: document.getElementById('subTotalsAtTop'),
        SaveSettings: document.getElementById('saveSettings'),
        WordList: document.querySelector('.sb-wordlist-items-pag'),
        OpeningPage: document.querySelector('.pz-moment__button.primary'),
        QueenBeePage: document.querySelector('.pz-moment__close'),
     }

    // Table data
    let tblPtrObj = {           // TablePtrs obj
        rowHeader: 0,           // header row
        rowTotal: 0,            // total words in each column
        rowFound: 0,            // words found on each column
        rowStartData: 0,        // letter subtotals (in gray)
        rowEndData: 0,
        rowEndChar1: 0,         // last line
        total: 0,               // total number of words
        found: 0,               // found words
        sums() {
            for (let col = ColStart - 2; col <= ColEnd; col++) {  // summate columns
                if (col == ColStart - 1) continue;
                let sum = 0;
                for (let row = this.rowStartData; row <= this.rowEndData; row++) {
                    sum += Table[row][col];
                }
                Table[this.rowFound][col] = sum;
            }
            for (let row = this.rowStartData; row <= this.rowEndData; row++) {    //summate rows
                let sum = 0;
                for (let col = ColStart; col <= ColEnd; col++) {
                    sum += Table[row][col];
                }
                Table[row][2] = sum;
            }
            let row = this.rowFound;
            let sum = 0;
            for (let col = ColStart; col <= ColEnd; col++) {
                sum += Table[row][col];
            }
            Table[row][2] = sum;
        },
    };
    let Table = [];             // Main Table array
    let TablePtrs = [];         // Pointers into Table
    let Char2Row = {};          // hash table: Char2 -> row
    const ColStart = 4;         // table data
    let ColEnd = 0;
    let ColIndex = [0, 0, 0, 3];
    let TableTotalRows = 0;
    let Cell = [];              // element references for Table

    // Metastats
    let WordsTotal = 0;
    let WordsFound = 0;
    let PangramsTotal = 0;
    let PangramsFound = 0;
    let TotalPoints = 0;
    let GeniusScore = await getGeniusScore();
    
    // Words data
    let LetterList = "";        // needed to find pangrams
    let ProcessedWords = [];    // list of already tabulated words

    // -------------------------------------
    // MAIN PROGRAM
    // -------------------------------------

    /* ----- Retrieve saved settings ----- */
    RetrieveSavedSettings();

    /* ----- Insert our HTML and data into Spelling Bee ----- */
    InitializeHints ();

    /* ----- Detect addition to Word List ----- */
    //       main activity during game play
    const observer = new MutationObserver(() => {
        UpdateList();
    });
    observer.observe(El.WordList, {childList: true});

    /* ----- Toggle hiding blank cells ----- */
    El.ShowBlankCells.addEventListener('click', ToggleHiddenCells);

    /* ----- Toggle remaining vs found words ----- */
    El.ShowRemaining.addEventListener('click', ToggleFoundRemaining);


    /* ----- Toggle placement of subtotal line ----- */
    El.SubTotalsAtTop.addEventListener('click', ToggleSubtotals);

    /* ----- Save settings ----- */
    El.SaveSettings.addEventListener('click', SaveSettings);

//======================================
// GET SYSTEM DATA
//======================================

    /* ----- Open Today's Hints page for data ----- */
    async function getHints() {
        const hintsUrl = 'https://www.nytimes.com/' +
        window.gameData.today.printDate.replaceAll('-', '/') +
            '/crosswords/spelling-bee-forum.html';

        const hints = await fetch(hintsUrl).then(response => response.text()).then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;                                       // translates string to DOM
            return div.querySelector('.interactive-body > div');
        });
        return hints;
    }

    /* ----- Detect device ----- */
    function detectPhoneDevice () {
        return false;
        // if (navigator.userAgent.match(/Android/i)
        // || navigator.userAgent.match(/webOS/i)
        // || navigator.userAgent.match(/iPhone/i)
        // || navigator.userAgent.match(/iPad/i)
        // || navigator.userAgent.match(/iPod/i)
        // || navigator.userAgent.match(/BlackBerry/i)
        // || navigator.userAgent.match(/Windows Phone/i)) {
        //    return true ;
        // } else {
        //    return false ;
        // }
     }
    /* ----- Open Rankings pop-up for data ----- */
    async function getGeniusScore() {
        [...document.querySelectorAll(".pz-dropdown__menu-item")][1].click();
        let element = await waitForElement('.sb-modal-ranks__list');
        let score = element.querySelectorAll('td')[3].innerText.replace(/\D/g, '');        
        document.querySelector('.sb-modal-close').click();
        return score;

        function waitForElement(selector) {
            return new Promise(resolveElement => {
                const checkForElement = () => {
                    let element = document.querySelector(selector);
                    if (element) {
                        resolveElement(element);
                    } else {
                        setTimeout(checkForElement, 10);
                    }
                };
                checkForElement();
            });
        }
    }

    /* ----- Create DOM for added HTML ----- */
    function setUpHintDiv() {
        let gameScreen;
        if (devicePhone) {
            gameScreen = document.querySelector('#portal-game-moments');
        } else { 
            gameScreen = document.querySelector('.pz-game-screen');
        }
        const parent = gameScreen.parentElement;
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.append(gameScreen);
        parent.append(container);

        const hintDiv = document.createElement('div');
        hintDiv.style.padding = '10px';
        container.append(hintDiv);

        // Our added HTML
        hintDiv.innerHTML = `
        <table>
            <td id="metastats1">Total points:&nbsp<br>Total words:&nbsp<br>Words Found:&nbsp</td>
            <td id="metastats2"></td>
            <td id="metastats3">Genius level:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp</td>
            <td id="metastats4"></td>
        </table>
        <br><table id="header"><tr>
            <td id="legend">Σ = <font color="mediumvioletred"><b>TOTAL words</b>
            <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <b>words FOUND</b></td>
            </tr></table>
        <table id="table0">
        </table>
        <br><input id="hideEmptyCells" type="checkbox">&nbspShow completed rows and columns</input>
        <br><input id="showRemaining" type="checkbox">&nbspShow number of words remaining</input>
        <br><input id="subTotalsAtTop" type="checkbox">&nbspPlace subtotal line above letter tallies</input>
        <br><input id="saveSettings" type="checkbox">&nbspSave settings</input>
        <br><br>Bee Hive Release 1.2
        <style>
            #metastats1 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
                width: 16ch;
                margin-left: 1ch;
                text-align: right;
            }
            #metastats2 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
                text-align: right;
            }
            #metastats3 {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
                width: 21ch;
                margin-left: 1ch;
                text-align: right;
            }
            #metastats4 {
                font-family: Arial, Helvetica, sans-serif;
                margin-left: 1ch;
                font-size: 90%;
                text-align: left;
                width: 14ch;
            }
            #table0 {
                margin-left: 3ch;
                font-family: Arial, Helvetica, sans-serif;
                font-size: medium;
            }
            #table0 td {
                height: 1ch;
                width: 3ch;
                margin-left: 5ch;
                margin-right: 5ch;
                text-align: center;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
            }
            #header td {
                font-family: Arial, Helvetica, sans-serif;
                font-size: 90%;
            }
            </style>
                   `;
        return hintDiv;
    }

/* ----- Saved Settings Cookie ----- */
    function RetrieveSavedSettings () {
        let setting = getCookie("beehiveSetting");
        if (setting === "true") { 
            let blank = getCookie("beehiveBlank");
            let remain = getCookie("beehiveRemaining");
            let subTot = getCookie("beehiveSubtotal");
            El.SaveSettings.click();
            SaveSettings();
            if (blank === "true") {
                El.ShowBlankCells.click();
                ToggleHiddenCells();
                setCookie("beehiveBlank=true");
            } else {
                setCookie("beehiveBlank=false");
            }
            if (remain === "true") {
                El.ShowRemaining.click();
                ToggleFoundRemaining();
                setCookie("beehiveRemaining=true");
            } else {
                setCookie("beehiveRemaining=false");
            }
            if (subTot === "true") {
                El.SubTotalsAtTop.click();
                SubTotalsAtTop = true;
                setCookie("beehiveSubtotal=true");
            } else {
                setCookie("beehiveSubtotal=false");
            }
         } else {
            setCookie("beehiveBlank=false");
            setCookie("beehiveRemaining=false");
            setCookie("beehiveSubtotal=false");
            setCookie("beehiveSetting=false");
         }
        return;
    }

    function SaveSettings () {
        SaveSetting = SaveSetting ? false : true;
        SaveSetting ? setCookie("beehiveSetting=true") : setCookie("beehiveSetting=false");
        return;
    }

    function setCookie (name) {
        document.cookie = name + "; max-age=700000";
        return;
    }

    function getCookie(name) {
        let matches = document.cookie.match(new RegExp(
          "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

//======================================
// MAIN SUPPORTING FUNCTION: INITIALIZE HINTS
//======================================

    // -------------------------------------
    // Read HINTS page and generate all tables/lists
    // -------------------------------------

    function InitializeHints () {
        let temp;
        let wordLengths = [];       // word lengths, appended to header
        const paragraphs  = HintsHTML.querySelectorAll('p');

        // MetaStats (permanent)
        LetterList = paragraphs[1].textContent.replace(/\s/g, '').toUpperCase();
        temp = paragraphs[2].textContent.split(/[^0-9]+/);
            WordsTotal = +temp[1];
            TotalPoints = temp[2];
            PangramsTotal = temp[3];
                if (temp[4] > 0) PangramsTotal = PangramsTotal + ' (' + temp[4] + ' Perfect)';

        // char1Table (temporary data)
        let char1Table = [...HintsHTML.querySelectorAll('table tr')]
            .map(tr => [...tr.querySelectorAll('td')].map(x => x.textContent));  // ... convert iterable to array
        temp = char1Table[0].slice(1, -1).map(x => Number(x));
        for (let i = 0; i < temp.length; i++ ) wordLengths.push(temp[i]);
        char1Table.pop();                               // eliminate first and last rows
        char1Table.shift();
        char1Table.forEach(item => {
            item[0] = item[0][0].toUpperCase();
            for (let i = 1; i < item.length; i++) {     // convert '-' to '0'
                if (item[i] === '-') {item[i] = 0}
                else {item[i] = +item[i]};
            }
        })

        // char2Table (temporary data)
        let char2Table = [];                        // char2Table (temporary data)
        let char2Raw = paragraphs[4].textContent.split(/[^A-Za-z0-9]+/);
        let index = 1;
        let temp1 = [];
        let char = char2Raw[index][0];
        while (char2Raw[index] != '') {
            char2Raw[index] = char2Raw[index].toUpperCase();
            temp1.push(char2Raw[index]);
            temp1.push(+char2Raw[index + 1]);
            index += 2;
            if (char2Raw[index][0] != char) {
                char2Table.push(temp1);
                char = char2Raw[index][0];
                temp1 = [];
            }
        }

        // Header and Spacer row templates
        ColEnd = wordLengths.length + 3;
        let header = ['', '', '', ''];
        wordLengths.forEach(item => header.push(item));
        let spacer = ['', '', '', '',];
        spacer.length = ColEnd + 1;
        spacer.fill('', 4, ColEnd + 1);
        for (let i = 4; i < wordLengths.length + 4; i++) {  // ColIndex accounts for empty columns
            ColIndex[wordLengths[i - 4]] = i;
        }

       // Create Table, TablePtrs, Char2Row (permanent data)
        CreateTableData(char1Table, char2Table, header, spacer);

        CreateHTMLTable();
        FormatCells();
        UpdateList();
        return;
    }

    // Permanent data: Table, TablePtrs, Char2Row 
    function CreateTableData (char1Table, char2Table, header, spacer) {
        let temp;
        let ch2Tally = 0;           // tally Char2 rows
        let indx = 0;               // iterates through TablePtrs and char1Table/char2Table
        let row = 3;
        for (let i = 0; i < char1Table.length; i++) {     // iterate over each char1Table row
            TablePtrs[indx] = Object.assign({}, tblPtrObj);      // Spacers and header
            TablePtrs[indx].total = Number(char1Table[indx][char1Table[indx].length - 1]);
            Table.push(spacer);
            Table.push(spacer);
            Table.push(header);
            TablePtrs[indx].rowHeader = row - 1;

            temp = ['', 'Σ', '#', 'Σ>'];                // Section stats line (rowTotal)
            temp.length = ColEnd + 1;
            for (let j = 4; j <=  ColEnd; j++) {
                temp[j] = char1Table[indx][j - 3];
            }
            Table.push(temp);
            TablePtrs[indx].rowTotal = row;
            row++;

            if (SubTotalsAtTop) {                       // TablePtrs.rowFound
                temp = ['Σ', TablePtrs[indx].total, 0, '#>'];
                temp.length = ColEnd + 1;
                Table.push(temp);
                TablePtrs[indx].rowFound = row;
                row++;
            }

            TablePtrs[indx].rowStartData = row;          // Char2 lines
            for (let j = 0; j < char2Table[indx].length; j++) {
                Char2Row[char2Table[indx][j]] = row;
                temp = [char2Table[indx][j], char2Table[indx][j + 1], 0, '#>'];
                Table.push(temp);
                ch2Tally++;
                row++;
                j++;
            }
            TablePtrs[indx].rowEndData = row -1;

            if (!SubTotalsAtTop) {                      // TablePtrs.rowFound
                temp = ['Σ', TablePtrs[indx].total, 0, '#>'];
                temp.length = ColEnd + 1;
                Table.push(temp);
                TablePtrs[indx].rowFound = row;
                row++;
            }

            TablePtrs[i].rowEndChar1 = row - 1;         // end of section

            // zero out tally area
            for (let row = TablePtrs[i].rowStartData; row <= TablePtrs[i].rowEndData; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    Table[row][col] = 0;
                }
            }

            row +=3;
            indx++;
        }

        Table.push(spacer);         // terminal line

        TableTotalRows = ch2Tally + (TablePtrs.length * 5) + 1;
        return;
    }

    function CreateHTMLTable() {
        for (let y = 0; y < TableTotalRows; y++) {
            let rowObj = [];
            let rowEl = document.createElement('tr');
            for (let x = 0; x <= ColEnd; x++) {
                let cellEl = document.createElement('td');
                rowObj.push({element: cellEl});
                rowEl.appendChild(cellEl);
            }
            Cell.push(rowObj);
            El.Table.appendChild(rowEl);
        }
        return;
    }
    
    function FormatCells() {
        let row;
        TablePtrs.forEach(item => {
            row = item.rowTotal;
            for (let col = ColStart; col <= ColEnd; col++) {        // Total words
                Cell[row][col].element.style.color = 'mediumvioletred';
                Cell[row][col].element.style.fontWeight = 'bold';
            }
            row = item.rowFound;
            for (let col = ColStart; col <= ColEnd; col++) {        // Found words
                Cell[row][col].element.style.fontWeight = 'bold';
            }
                                                                    // Total & Found columns
            for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                Cell[row][1].element.style.color = 'mediumvioletred';
                Cell[row][1].element.style.fontWeight = 'bold';
                Cell[row][2].element.style.fontWeight = 'bold';
            }
            Cell[item.rowFound][1].element.style.color = 'mediumvioletred';
            Cell[item.rowFound][1].element.style.fontWeight = 'bold';
            Cell[item.rowFound][2].element.style.fontWeight = 'bold';
                                                                    // center of table to gray
            for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    Cell[row][col].element.style.backgroundColor = "whitesmoke";
                }
            }
            row = item.rowHeader - 2;
            for (let col = 0; col <= ColEnd; col++) {
                Cell[row][col].element.style.borderBottom = "1px solid black";
            }
        })
        for (let col = 0; col <= ColEnd; col++) {
            Cell[TableTotalRows - 1][col].element.style.borderBottom = "1px solid black";
        }
        return;
    }

//======================================
// MAIN SUPPORTING FUNCTION:  UPDATE TABLES FROM FOUND WORDS
//======================================

    // -------------------------------------
    function UpdateList () {
    // -------------------------------------
        // Cull ProcessedWords from WordList => new words into processList
        let processList = [];
        let inputList = [...El.WordList.querySelectorAll('li')];
        if (inputList.length === 0) {
            inputList = [];
        } else {
            inputList = [...inputList].map(x => x.textContent.toUpperCase());
        }
        for (let i = 0; i < inputList.length; i++) {
            if (!ProcessedWords.includes(inputList[i])) {
                ProcessedWords.push(inputList[i]);
                processList.push(inputList[i]);
            }
        }
        // Tally new words
        for (let i = 0; i < processList.length; i++) {     // Tally input words
            Table[Char2Row[(processList[i].slice(0, 2))]][ColIndex[processList[i].length]]++;
            WordsFound++;
            let pangram = true;                            // check for Pangram
            for (let j = 0; j < LetterList.length; j++) {
                if (!processList[i].includes(LetterList[j])) {
                    pangram = false;
                    break;
                }
            }
            if (pangram) PangramsFound++;
        }
        TablePtrs.forEach(item => {                         // update sums
            item.sums();
            item.found = Table[item.rowFound][2];
        });             // summate columns and rows
        DisplayMetaStats();
        DisplayTable();
        return;
    }
    
//======================================
// DISPLAY FUNCTIONS
//======================================

    function DisplayMetaStats () {
        if (WordsTotal === WordsFound) {
            El.MetaStats3.innerHTML = 'QUEEN BEE:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp';
            GeniusScore = TotalPoints;
        }
        El.MetaStats2.innerHTML = TotalPoints + '<br>' + WordsTotal + `<br>` + WordsFound;
        El.MetaStats4.innerHTML = GeniusScore + '<br>' + PangramsTotal + `<br>` + PangramsFound;
        return;
    }

    function DisplayTable () {
        // Map Table to HTML
        for (let i = 0; i < TableTotalRows; i++) {
            for (let j = 0; j <= ColEnd; j++) Cell[i][j].element.innerText = Table[i][j];
        }

        // Gray out and hide completed rows and columns
        TablePtrs.forEach(item => {
            for (let col = ColStart; col <= ColEnd; col++) {
                for (let row = item.rowStartData; row <= item.rowEndData; row++)
                    Cell[row][col].element.removeAttribute("hidden", "");
            }

            // check for completed section
            if ((item.found === item.total) && (!Cell[item.rowHeader][0].element.hasAttribute("hidden"))) {
                for (let row = item.rowHeader - 2; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) {
                        Cell[row][col].element.style.color = "lightsteelblue";
                        if (!ShowBlankCells) Cell[row][col].element.setAttribute("hidden", "");
                    }
                }
            } else {
                // check for completed rows
                for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++) {
                            Cell[row][col].element.style.color = "lightsteelblue";
                            ShowBlankCells
                                ? Cell[row][col].element.removeAttribute("hidden")
                                : Cell[row][col].element.setAttribute("hidden", "");
                        }
                    }
                }
                // check for completed columns 
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowTotal][col] === Table[item.rowFound][col]) {
                        for (let row = item.rowHeader; row <= item.rowEndChar1; row++) {
                            Cell[row][col].element.style.color = "lightsteelblue";
                            ShowBlankCells
                                ? Cell[row][col].element.removeAttribute("hidden")
                                : Cell[row][col].element.setAttribute("hidden", "");
                    }
                    }
                }
            }
            // check for empty columns
            for (let col = ColStart; col <= ColEnd; col++) {
                if ((Table[item.rowTotal][col] === 0)) {
                    for (let row = item.rowHeader; row <= item.rowEndChar1; row++)
                    Cell[row][col].element.setAttribute("hidden", "");
                }
            }
            // Display FOUND vs REMAINING words
            if (ShowRemaining) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    for (let row = item.rowStartData; row <= item.rowEndData; row++)
                        Cell[row][col].element.setAttribute("hidden", "");
                }
                for (let col = ColStart; col <= ColEnd; col++)
                    Cell[item.rowFound][col].element.innerText = Table[item.rowTotal][col] - Table[item.rowFound][col];
                for (let row = item.rowStartData; row <= item.rowEndData; row++)
                    Cell[row][2].element.innerText = Table[row][1] - Table[row][2];
                Cell[item.rowFound][2].element.innerText = Table[item.rowFound][1] - Table[item.rowFound][2];
            }
        });
    
        return;
    }

    function ToggleHiddenCells () {
        ShowBlankCells = !ShowBlankCells; 
        ShowBlankCells ? setCookie("beehiveBlank=true") : setCookie("beehiveBlank=false");
        TablePtrs.forEach(item => {
            if (item.total === item.found) {         // No Char1
                for (let row = item.rowHeader - 2; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) 
                        ShowBlankCells ? Cell[row][col].element.removeAttribute("hidden") : Cell[row][col].element.setAttribute("hidden", "");
                }
            } else {        // Oherwise check for individual rows and columns
                // reset all cells to visible
                for (let row = item.rowTotal + 1; row <= item.rowEndChar1; row++) {
                    for (let col = 0; col <= ColEnd; col++) {
                        Cell[row][col].element.removeAttribute("hidden");
                    }
                }
                // toggle rows
                for (let row = item.rowStartData; row <= item.rowEndData; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++)
                            ShowBlankCells ? Cell[row][col].element.removeAttribute("hidden") : Cell[row][col].element.setAttribute("hidden", "");
                    }
                }
                // toggle columns
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowFound][col] === Table[item.rowTotal][col]) {
                        for (let row = item.rowHeader; row <= item.rowEndChar1; row++)
                            ShowBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                    }
                }
            }
        });
        if (KLUDGE) DisplayTable();
        return;
    }

    function ToggleFoundRemaining () {
        ShowRemaining = !ShowRemaining;
        ShowRemaining ? setCookie("beehiveRemaining=true") : setCookie("beehiveRemaining=false");
        if (ShowRemaining) {
            El.Legend.innerHTML = `Σ = <font color="mediumvioletred"><b>TOTAL words</b>
            <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <strong><b>REMAINING words</b></strong>`;
        } else {
            El.Legend.innerHTML = `Σ = <font color="mediumvioletred"><b><strong>TOTAL</strong> words</b>
            <font color="black">&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = <b>words FOUND</b>`;
        }
        DisplayTable ();
    return;
    }

    function ToggleSubtotals () {
        let chr;            // row increment/decrement
        let rowstart;
        let rowend;
        SubTotalsAtTop = !SubTotalsAtTop;
        SubTotalsAtTop ? setCookie("beehiveSubtotal=true") : setCookie("beehiveSubtotal=false");

        // Table and TablePtrs
        TablePtrs.forEach(item => {
            if (SubTotalsAtTop) {
                chr = -1;
                rowstart = item.rowEndChar1;
                rowend = item.rowStartData;
            } else {
                chr = 1;
                rowstart = item.rowFound;
                rowend = item.rowEndChar1;
            }
            
            // Move data rows
            const temp = Table[item.rowFound]
            for (let row = rowstart; row != rowend; row += chr) {
                Table[row] = Table[row + chr];
            }
            item.rowStartData -= chr;
            item.rowEndData -= chr;
            if (SubTotalsAtTop) {
                item.rowFound = item.rowTotal + 1;
            } else {
                item.rowFound = item.rowEndChar1;
            }
            Table[item.rowFound] = temp;

            // Fix format rowFound and tally area
            let datarow;
            SubTotalsAtTop ? datarow = item.rowEndChar1 : datarow = item.rowTotal + 1;
            for (let col = ColStart; col <= ColEnd; col++) {
                Cell[datarow][col].element.style.fontWeight = 'normal';
                Cell[datarow][col].element.style.backgroundColor = "whitesmoke";
                Cell[item.rowFound][col].element.style.fontWeight = 'bold';
                Cell[item.rowFound][col].element.style.backgroundColor = "white";
            }

            // Reset colors
            for (let row = item.rowTotal + 1; row <= item.rowEndChar1; row++) {
                for (let col = 2; col <= ColEnd; col++) {
                    Cell[row][col].element.style.color = 'black';
                }
            }
            for (let row = item.rowHeader + 1; row <= item.rowEndChar1; row++) {
                Cell[row][0].element.style.color = 'black';
                Cell[row][1].element.style.color = 'mediumvioletred';
                // Cell[row][2].element.style.color = 'black';
                // Cell[row][3].element.style.color = 'black';
            }
         })

        // Char2Row
        for (const char in Char2Row) {
            Char2Row[char] -= chr;
        }

        // DEBUG - patch
        Kludge();
        // DisplayTable ();
        return;
    }

    function Kludge () {    // DEBUG - patch
        KLUDGE = false;
        ToggleHiddenCells ();
        KLUDGE = true;
        ToggleHiddenCells ();
        return;
    }
}       // end of main function
})();   // end of outer shell function
