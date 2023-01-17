(() => {            // OUTER SHELL
'use strict';

main();

//======================================
// MAIN FUNCTION
//======================================

async function main() {

    //--------------------------------------
    // MAIN CONSTANTS AND VARIABLES
    //--------------------------------------

    const HintsHTML = await getHints();     // data from Spelling Bee page
    const hintDiv = setUpHintDiv();         // initialize DOM
    // let openingPage = false;                // check if not on main page yet

    const El = {
        MetaStats1: document.getElementById('metastats1'),
        MetaStats2: document.getElementById('metastats2'),
        MetaStats3: document.getElementById('metastats3'),
        MetaStats4: document.getElementById('metastats4'),
        Table: document.getElementById('table0'),
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
    // debugger;
    // let temp = [...El.WordList.querySelectorAll('li')];

    // let word = El.WordList.innerText.toUpperCase().split('\n')[0];
    // let temp = [...El.WordList.querySelectorAll('li')].map(tr => [...tr.querySelectorAll('li')].map(x => x.textContent));

    // do {                // wait until off the opening pages
    //     if (window.gameData['today']['answers'].includes(word)) openingPage = false;
    // } while (openingPage);
    InitializeHints ();

    /* ----- Detect addition to Word List ----- */
    //       main activity during game pflay
    const observer = new MutationObserver(() => {
        UpdateList();
    });
    observer.observe(El.WordList, {childList: true});

    /* ----- Detect if bookmarklet starts from opening page ----- */
    El.OpeningPage.addEventListener('click', openingPages);

    /* ----- Detect if already Queen Bee on start up ----- */
    El.QueenBeePage.addEventListener('click', openingPages);

//======================================
// GET DATA FROM SPELLING BEE PAGE
//======================================

    async function getHints() {
        const hintsUrl = 'https://www.nytimes.com/' +
            window.gameData["today"]["printDate"].replaceAll('-', '/') +
            '/crosswords/spelling-bee-forum.html';

        const hints = await fetch(hintsUrl).then(response => response.text()).then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;                                       // translates string to DOM
            return div.querySelector('.interactive-body > div');        // . = css selector; # = id selector
        });
        return hints;
    }

    async function getGeniusScore() {
        document.querySelector('[title="Click to see today’s ranks"]').click();
        let element = await waitForElement('.sb-modal-list li:last-of-type');
        let score = element.innerText.replace(/\D/g, '');
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

    async function openingPages () {
        setTimeout(resetStats, 500);
        return;
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
            <td id="metastats3">Genius:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp</td>
            <td id="metastats4"></td>
        </table><table id="table0"></table><br>
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
    // Read HINTS page and generate all tablesHeader
    // -------------------------------------
    function InitializeHints () {
        let temp;
        let wordLengths = [];       // word lengths, appended to header
        const paragraphs  = HintsHTML.querySelectorAll('p');

        // MetaStats
        LetterList = paragraphs[1].textContent.replace(/\s/g, '').toUpperCase();
        temp = paragraphs[2].textContent.split(/[^0-9]+/);
            WordsTotal = +temp[1];
            TotalPoints = +temp[2];
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

        // Header, LineBreak, Spacer row templates
        ColEnd = wordLengths.length + 3;
        let header = ['', '', '', ''];
        wordLengths.forEach(item => header.push(item));
        let lineBreak = ['-', '-', '-', '-'];
        lineBreak.length = ColEnd + 1;
        lineBreak.fill('-', 4, ColEnd + 1);
        let spacer = ['', '', '', '',];
        spacer.length = ColEnd + 1;
        spacer.fill('', 4, ColEnd + 1);
        for (let i = 4; i < wordLengths.length + 4; i++) {  // ColIndex accounts for empty columns
            ColIndex[wordLengths[i - 4]] = i;
        }

       // Char1List, Char2List, Char2Row, and Table (permanent data)
        GetCharLists(char1Table, char2Table, header, lineBreak, spacer);

        CreateHTMLTable();              // print our HINTS on Spelling Bee page
        UpdateList();
        return;
    }

    function GetCharLists (char1Table, char2Table, header, lineBreak, spacer) {
    // Create Char1List, Char2List, Char2Row, and Table

        let temp;
        let ch2Indx = 0;                            // iterates through Char2List
        let chTableIndx = 0;                        // iterates through Char1List and char1Table/char2Table
        let row = 3;
        for (let i = 0; i < char1Table.length; i++) {     // iterate over each char1Table row
            Table.push(lineBreak);
            Table.push(spacer);
            Table.push(header);
            Char1List[chTableIndx] = Object.assign({}, Char1Obj);   // Char1 line
            Char1List[chTableIndx].char1 = char1Table[chTableIndx][0];
            Char1List[chTableIndx].rowStart = row;
            Char1List[chTableIndx].rowEnd = row + (char2Table[chTableIndx].length / 2);
            Char1List[chTableIndx].total = Number(char1Table[chTableIndx][char1Table[chTableIndx].length - 1]);
            temp = ['Letter', 'Σ', '#', 'Σ>'];
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
        }
        return;
    }
 //======================================
// MAIN SUPPORTING FUNCTION:  UPDATE TABLES FROM FOUND WORDS
//======================================

    // -------------------------------------
    function UpdateList () {    // DEBUG-THIS VERSION WORKS!!!
    // -------------------------------------
        // Cull ProcessedWords from WordList => new words into processList
        let processList = [];                              // Culled list
        let inputList = [];
        if (([...El.WordList.querySelectorAll('li')].length) === 0) {
            inputList = [];
        } else {
            inputList = El.WordList.innerText.toUpperCase().split('\n');
        }
        // if (El.WordList) {   // DEBUG - TRY THIS ONE OUT ALSO
        //     inputList = El.WordList.innerText.toUpperCase().split('\n');
        // } else {
        //     inputList = [];
        // }
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
    
    function resetStats() {    // needed if program is installed on Opening or Queen Bee page
        ProcessedWords = [];
        WordsFound = 0;
        PangramsFound = 0;
        zeroOutCounts();
        UpdateList();
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
            for (let j = 0; j <= ColEnd; j++) {
                Cell[i][j].element.innerHTML = Table[i][j];
            }
        }

        // Display helpful "0"s by filtering out unhelpful "0"s into "".
        Char1List.forEach(item => {
            for (let col = ColStart; col <= ColEnd; col ++) {
                if (Table[item.rowStart][col] == 0) {
                    for (let row = item.rowStart - 1; row <= item.rowEnd + 1; row++) {
                        Cell[row][col].element.innerHTML = '';
                    }
                }
            }
        });

        // Gray out completed rows and columns
        Char1List.forEach(item => {
            // check for completed rows
            for (let row = item.rowStart + 1; row <= item.rowEnd + 1; row++) {
                if (Table[row][1] === Table[row][2]) {
                    for (let col =0; col <= ColEnd; col++) {
                        Cell[row][col].element.style.color = "lightsteelblue";
                    }
                }
            }
            // check for completed columns
            for (let col = ColStart; col <= ColEnd; col++) {
                if (Table[item.rowStart][col] === Table[item.rowEnd + 1][col]) {
                    for (let row = item.rowStart; row <= item.rowEnd + 1; row++) {
                        Cell[row][col].element.style.color = "lightsteelblue";
                    }
                }
            }
        });

        return;
    }

}       // end of main function
})();   // end of outer shell function
// 