(async () => {            // OUTER SHELL
    'use strict';
    
//======================================
// LOAD PROGRAM AFTER CONDITIONS MET
//======================================

    /* ----- Do not allow to launch more than once ----- */
    if (window.hiveLoaded) {
        alert('Bee Hive program has already been loaded.\nPlease buzz on by (apian for continue).');
        return;
    }
    window.hiveLoaded = true;

    /* ----- Do not launch while on Welcome or Queen Bee pages ----- */
    await waitForCondition(document.getElementById('js-hook-pz-moment__welcome'),
        document.getElementById('js-hook-pz-moment__congrats'));
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

    const HintsHTML = await getHints();     // data from Spelling Bee page
    const hintDiv = setUpHintDiv();         // initialize DOM

    const El = {
        MetaStats1: document.getElementById('metastats1'),
        MetaStats2: document.getElementById('metastats2'),
        MetaStats3: document.getElementById('metastats3'),
        MetaStats4: document.getElementById('metastats4'),
        Table: document.getElementById('table0'),
        HideBlankCells: document.getElementById('hideEmptyCells'),
        WordList: document.querySelector('.sb-wordlist-items-pag'),
        OpeningPage: document.querySelector('.pz-moment__button.primary'),
        QueenBeePage: document.querySelector('.pz-moment__close'),
     }

    // Table data
    let Char1Obj = {            // Char1List obj
        char1: '',
        rowStart: 0,            // letter subtotals row in Table
        rowEnd: 0,              // last data row in Table, not col totals
        count: [],              // word length subtotals
        total: 0,               // total number of words
        sums() {
            for (let j = ColStart - 2; j <= ColEnd; j++) {  // summate columns
                if (j == ColStart - 1) continue;
                let sum = 0;
                for (let i = this.rowStart + 1; i <= this.rowEnd; i++) {
                    sum += Table[i][j];
                }
                Table[this.rowEnd + 1][j] = sum;
            }
            for (let i = this.rowStart + 1; i <= this.rowEnd + 1; i++) {    //summate rows
                let sum = 0;
                for (let j = ColStart; j <= ColEnd; j++) {
                    sum += Table[i][j];
                }
                Table[i][2] = sum;
            }
        },
    };
    let Char2Obj = {            // Char2List obj
        char2: '',
        count: 0,               // count of each Char2
        row: 0,                 // Table row
    };
    let Table = [];             // Main Table array
    let Cell = [];              // element references for Table
    const ColStart = 4;         // table data
    let ColEnd = 0;
    let ColIndex = [0, 0, 0, 3];
    let TableTotalRows = 0;
    let HideBlankCells = false;
    let Char1List = [];         // Pointers into Table
    let Char2List = [];
    let Char2Row = {};          // hash table: Char2 -> row

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

    /* ----- Insert our HTML and data into Spelling Bee ----- */
    InitializeHints ();

    /* ----- Detect addition to Word List ----- */
    //       main activity during game play
    const observer = new MutationObserver(() => {
        UpdateList();
    });
    observer.observe(El.WordList, {childList: true});

    /* ----- Toggle hiding blank cells ----- */
    El.HideBlankCells.addEventListener('click', ToggleHiddenCells);

//======================================
// GET DATA FROM SPELLING BEE PAGE
//======================================

    async function getHints() {
        const hintsUrl = 'https://www.nytimes.com/' +
        window.gameData.today.printDate.replaceAll('-', '/') +
            '/crosswords/spelling-bee-forum.html';

        const hints = await fetch(hintsUrl).then(response => response.text()).then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;                                       // translates string to DOM
            return div.querySelector('.interactive-body > div');        // . = css selector; # = id selector
        });
        return hints;
    }

    async function getGeniusScore() {
        [...document.querySelectorAll(".pz-dropdown__menu-item")][1].click();
        let element = await waitForElement('.sb-modal-list');
        let score = element.querySelectorAll('li')[8].innerText.replace(/\D/g, '');        
        document.querySelector('.sb-modal-close').click();
        return score;
    }

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

    /* ----- Create DOM for our added HTML ----- */
    function setUpHintDiv() {
        const gameScreen = document.querySelector('.pz-game-screen');
        const parent = gameScreen.parentElement;

        const container = document.createElement('div');
        container.style.display = 'flex';
        container.append(gameScreen);
        parent.append(container);

        const hintDiv = document.createElement('div');
        hintDiv.style.padding = '12px';
        container.append(hintDiv);

        // Our added HTML
        hintDiv.innerHTML = `
        <table>
            <td id="metastats1">Total points:&nbsp<br>Total words:&nbsp<br>Words Found:&nbsp</td>
            <td id="metastats2"></td>
            <td id="metastats3">Genius level:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp</td>
            <td id="metastats4"></td>
        </table><table id="table0"></table><br>
        <input id="hideEmptyCells" type="checkbox">Hide empty data cells</input>
        <br><br>Σ = total words&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp# = words found
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
            }
        </style>
        `;
        return hintDiv;
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

        // MetaStats
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

       // Char1List, Char2List, Char2Row, and Table (permanent data)
        GetCharLists(char1Table, char2Table, header, spacer);

        CreateHTMLTable();           
        UpdateList();
            return;
    }

    // Permanent data: Char1List, Char2List, Char2Row, and Table
    function GetCharLists (char1Table, char2Table, header, spacer) {
        let temp;
        let ch2Indx = 0;                            // iterates through Char2List
        let chTableIndx = 0;                        // iterates through Char1List and char1Table/char2Table
        let row = 3;
        for (let i = 0; i < char1Table.length; i++) {     // iterate over each char1Table row
            Table.push(spacer);
            Table.push(spacer);
            Table.push(header);
            Char1List[chTableIndx] = Object.assign({}, Char1Obj);   // Char1 line
            Char1List[chTableIndx].char1 = char1Table[chTableIndx][0];
            Char1List[chTableIndx].rowStart = row;
            Char1List[chTableIndx].rowEnd = row + (char2Table[chTableIndx].length / 2);
            Char1List[chTableIndx].total = Number(char1Table[chTableIndx][char1Table[chTableIndx].length - 1]);
            temp = ['', 'Σ', '#', 'Σ>'];
            temp.length = ColEnd + 1;
            for (let j = 4; j <=  ColEnd; j++) {                    // Char1 stats line
                temp[j] = char1Table[chTableIndx][j - 3];
            }
            Table.push(temp);
            row++;
            for (let j = 0; j < char2Table[chTableIndx].length; j++) {  // Char2 lines
                Char2List[ch2Indx] = Object.assign({}, Char2Obj);
                Char2List[ch2Indx].row = row;
                Char2List[ch2Indx].char2 = char2Table[chTableIndx][j];
                j++;
                Char2List[ch2Indx].count = char2Table[chTableIndx][j];
                temp = [Char2List[ch2Indx].char2, Char2List[ch2Indx].count, 0, ''];
                Table.push(temp);
                ch2Indx++;
                row++;
            }
            temp = ['Σ', Char1List[chTableIndx].total, 0, '#>'];
            temp.length = ColEnd + 1;
            Table.push(temp);
            row +=4;
            chTableIndx++;
        }
        Char2List.forEach(item => Char2Row[item.char2] = item.row); // hash table: Char2 -> Row
        TableTotalRows = Char2List.length + (Char1List.length * 5);
        zeroOutCounts();
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
        for (let i = 0; i < Char1List.length; i++) {    // cell colors
            for (let j = ColStart; j <= ColEnd; j++) {
                let row = Char1List[i].rowStart;
                Cell[row][j].element.style.color = 'mediumvioletred';
                Cell[row][j].element.style.fontWeight = 'bold';
            }
            for (let j = ColStart; j <= ColEnd; j++) {
                Cell[Char1List[i].rowEnd + 1][j].element.style.fontWeight = 'bold';
            }
            for (let j = Char1List[i].rowStart + 1; j <= Char1List[i].rowEnd + 1; j++) {
                Cell[j][1].element.style.color = 'mediumvioletred';
                Cell[j][1].element.style.fontWeight = 'bold';
                Cell[j][2].element.style.fontWeight = 'bold';
            }
            for (let j = Char1List[i].rowStart + 1; j <= Char1List[i].rowEnd; j++) {
                for (let k = ColStart; k <= ColEnd; k++) {
                    Cell[j][k].element.style.backgroundColor = "whitesmoke";
                }
            }
            for (let j = 0; j <= ColEnd; j++) {
                let row = Char1List[i].rowStart - 3;
                Cell[row][j].element.style.borderBottom = "1px solid black";
            }
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
        Char1List.forEach(item => {item.sums()});             // summate columns and rows
        DisplayMetaStats();
        DisplayTable();
        return;
    }
    
    function zeroOutCounts() {
        Char1List.forEach(item => {
            for (let row = item.rowStart + 1; row <= item.rowEnd; row++) {
                for (let col = ColStart; col <= ColEnd; col++) {
                    Table[row][col] = 0;
                }
            }
        });
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

        // Display helpful "0"s by filtering out unhelpful "0"s into "".
        Char1List.forEach(item => {
            for (let col = ColStart; col <= ColEnd; col ++) {
                if (Table[item.rowStart][col] == 0) {
                    for (let row = item.rowStart - 1; row <= item.rowEnd + 1; row++)
                        Cell[row][col].element.innerText = '';
                }
            }
        });

        // Gray out and hide completed rows and columns
        Char1List.forEach(item => {
            if (item.total === Table[item.rowEnd + 1][2]) {         // No Char1 -> do the entire section
                for (let row = item.rowStart - 3; row <= item.rowEnd + 1; row++) {
                    for (let col = 0; col <= ColEnd; col++) {
                        Cell[row][col].element.style.color = "lightsteelblue";
                        if (HideBlankCells) Cell[row][col].element.setAttribute("hidden", "");
                    }
                }
                } else {                                            // otherwise check for individual rows and columns
                // check for completed rows
                for (let row = item.rowStart + 1; row <= item.rowEnd + 1; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++) {
                            Cell[row][col].element.style.color = "lightsteelblue";
                            if (HideBlankCells) Cell[row][col].element.setAttribute("hidden", "");
                        }
                    }
                }
                // check for completed columns
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowStart][col] === Table[item.rowEnd + 1][col]) {
                        for (let row = item.rowStart - 1; row <= item.rowEnd + 1; row++) {
                            Cell[row][col].element.style.color = "lightsteelblue";
                            if (HideBlankCells) Cell[row][col].element.setAttribute("hidden", "");
                        }
                    }
                }
            }
        });

        return;
    }

    function ToggleHiddenCells () {
        HideBlankCells = HideBlankCells ? false : true; 
        Char1List.forEach(item => {
            if (item.total === Table[item.rowEnd + 1][2]) {         // No Char1
                for (let row = item.rowStart - 3; row <= item.rowEnd + 1; row++) {
                    for (let col = 0; col <= ColEnd; col++) 
                        HideBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                }
            } else {        // otherwise check for individual rows and columns
                // toggle rows
                for (let row = item.rowStart + 1; row <= item.rowEnd + 1; row++) {
                    if (Table[row][1] === Table[row][2]) {
                        for (let col =0; col <= ColEnd; col++)
                            HideBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                    }
                }
                // toggle columns
                for (let col = ColStart; col <= ColEnd; col++) {
                    if (Table[item.rowStart][col] === Table[item.rowEnd + 1][col]) {
                        for (let row = item.rowStart - 1; row <= item.rowEnd + 1; row++)
                            HideBlankCells ? Cell[row][col].element.setAttribute("hidden", "") : Cell[row][col].element.removeAttribute("hidden");
                    }
                }
            }
        });
        return;
    }

}       // end of main function
})();   // end of outer shell function
