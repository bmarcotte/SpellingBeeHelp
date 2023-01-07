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
    const GeniusScore = await getGeniusScore();
    const hintDiv = setUpHintDiv();         // initialize DOM

    const El = {
        MetaStats1: document.getElementById('metastats1'),
        MetaStats2: document.getElementById('metastats2'),
        MetaStats3: document.getElementById('metastats3'),
        MetaStats4: document.getElementById('metastats4'),
        Table: document.getElementById('table0'),
        WordList: document.querySelector('.sb-recent-words.sb-has-words'),
        OpeningPage: document.querySelector('.pz-moment__button.primary'),
     }

    let Char1Obj = {            // Char1List obj
        char1: '',
        rowStart: 0,            // letter subtotals row in Table
        rowEnd: 0,              // last data row in Table, not col totals
        count: [],              // word length subtotals
        total: 0,               // total number of words
        colSum() {
            for (let j = ColStart - 2; j <= ColEnd; j++) {
                if (j == ColStart - 1) continue;
                let sum = 0;
                for (let i = this.rowStart + 1; i <= this.rowEnd; i++) {
                    sum += Table[i][j];
                }
                Table[this.rowEnd + 1][j] = sum;
            }
            return;
            },
        rowSum() {
            for (let i = this.rowStart + 1; i <= this.rowEnd + 1; i++) {
                let sum = 0;
                for (let j = ColStart; j <= ColEnd; j++) {
                    sum += Table[i][j];
                }
                Table[i][2] = sum;
            }
            return;
        },
    };
    let Char2Obj = {            // Char2List obj
        char2: '',
        count: 0,               // count of each Char2
        row: 0,                 // Table row
    };
    let Paragraphs;
    let Char1List = [];         // holds index pointers into Table
    let Char2List = [];
    let Char1Table = {};        // temporary raw data tables
    let Char2Table = [];

    let LineBreak = ['-', '-', '-', '-'];
    let Spacer = ['', '', '', '',];
    let Header = ['', '', '', ''];
    let Cell = [];              // holds element references for Table
    let Table = [];             // holds display data
    const ColStart = 4;         // table dimensions
    let ColEnd = 0;
    let ColIndex = [0, 0, 0, 3];
    let TableTotalRows = 0;
    let WordLengths = [];        // word lengths, appended to Header

    let WordsTotal = 0;         // Metastats
    let WordsFound = 0;
    let Pangrams = 0;
    let PangramsFound = 0;
    let Points = 0;
    let LetterList = "";        // needed to find pangrams
    let ProcessedWords = [];    // list of already tabulated words

    // -------------------------------------
    // MAIN PROGRAM
    // -------------------------------------

    InitializeHints ();

    // Update tables on event - addition to Word List
    const observer = new MutationObserver(() => {
        UpdateList();
    });
    observer.observe(El.WordList, {childList: true});

    // Detect if bookmarklet starts from opening page
    El.OpeningPage.addEventListener('click', openingPage);

//======================================
// GET DATA FROM SPELLING BEE PAGE
//======================================

// const date = new Date(document.querySelector('.pz-game-date').textContent);
// const hintsUrl = 'https://www.nytimes.com/' +
//     date.toISOString().slice(0, 10).replaceAll('-', '/') +
//     '/crosswords/spelling-bee-forum.html';

// fetch(hintsUrl).then(response => response.text()).then(html => {
//     const div = document.createElement('div');
//     div.innerHTML = html;                                         // translates string to DOM
//     const hints = div.querySelector('.interactive-body > div');   // . = css selector; # = id selector
//     main(hints);
// });

async function openingPage () {
    setTimeout(resetStats, 500);
return;
}

async function getHints() {
    const date = new Date(document.querySelector('.pz-game-date').textContent);
    const hintsUrl = 'https://www.nytimes.com/' +
        date.toISOString().slice(0, 10).replaceAll('-', '/') +
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

//======================================
// MAIN SUPPORTING FUNCTION: INITIALIZE HINTS
//======================================

    // -------------------------------------
    // Read HINTS page and generate all tables
    // -------------------------------------
    function InitializeHints () {
        let temp;
        // Convert raw data to Chap1Table
        Char1Table = [...HintsHTML.querySelectorAll('table tr')]
            .map(tr => [...tr.querySelectorAll('td')].map(x => x.textContent));
        temp = Char1Table[0].slice(1, -1).map(x => Number(x));
        for (let i = 0; i < temp.length; i++ ) WordLengths.push(temp[i]);
        Char1Table.pop();           // eliminate first and last rows
        Char1Table.shift();
        Char1Table.forEach(item => {
            item[0] = item[0][0].toUpperCase();
            for (let i = 1; i < item.length; i++) {
                if (item[i] === '-') {item[i] = 0}
                else {item[i] = +item[i]};
            }
        })
/*
// Char1Table references above were raw data
// This loop produces an object of clean data
// This technique could be used to reference row from Char2
for (let row of rawCharData.slice(1, -1)) {
    const letter = row[0][0].toUpperCase();
    let charCounts = [];
    for (let i = 0; i < WordLengths.length; i++) {
        const wordLength = WordLengths[i];
        charCounts[wordLength] = Number(row[i + 1]) || 0;
    }
    Char1Table[letter] = charCounts;
}
*/
        // MetaStats
        Paragraphs  = HintsHTML.querySelectorAll('p');
        LetterList = Paragraphs[1].textContent.replace(/\s/g, '').toUpperCase();
        temp = Paragraphs[2].textContent.split(/[^0-9]+/);
            WordsTotal = temp[1];
            Points = temp[2];
            Pangrams = temp[3];
                if (temp[4] > 0) Pangrams = Pangrams + ' (' + temp[4] + ' Perfect)';
        UpdateMetaStats();

        // Linebreak, Spacer, Header row templates
        ColEnd = WordLengths.length + 3;
        WordLengths.forEach(item => Header.push(item));
        LineBreak.length = ColEnd + 1;
        LineBreak.fill('-', 4, ColEnd + 1);
        Spacer.length = ColEnd + 1;
        Spacer.fill('', 4, ColEnd + 1);

        // ColIndex accounts for empty columns
        for (let i = 4; i < WordLengths.length + 4; i++) {
            ColIndex[WordLengths[i - 4]] = i;
        }

        GetCharLists();                 // returns Char2 table, Char1 and Char2 lists, Table
        TableTotalRows = Char2List.length + (Char1List.length * 5);

        CreateHTMLTable();              // print our HINTS on Spelling Bee page
        UpdateList();
        return;
    }

    function GetCharLists () {
    // Create Char2Table
    // Simultaneously create Char1List, Char2List, and Table

        let temp = Paragraphs[4].textContent.split(/[^A-Za-z0-9]+/);
        // Char2Table = [...Paragraphs[4].querySelectorAll('span')].map(x => x.textContent);    // ?????

        let char = temp[1][0];                        // create Char2Table
        let index = 1;
        let temp1 = [];
        while (temp[index] != '') {
            temp[index] = temp[index].toUpperCase();
            temp1.push(temp[index]);
            temp1.push(+temp[index + 1]);
            index += 2;
            if (temp[index][0] != char) {
                Char2Table.push(temp1);
                char = temp[index][0];
                temp1 = [];
            }
        }
        let ch2Indx = 0;                            // iterates through Char2List
        let chTableIndx = 0;                        // iterates through Char1List and Char1Table/Char2Table
        let row = 3;
        for (let i = 0; i < Char1Table.length; i++) {     // iterate over each Char1Table row
            Table.push(LineBreak);
            Table.push(Spacer);
            Table.push(Header);
            Char1List[chTableIndx] = Object.assign({}, Char1Obj);   // Char1 line
            Char1List[chTableIndx].char1 = Char1Table[chTableIndx][0];
            Char1List[chTableIndx].rowStart = row;
            Char1List[chTableIndx].rowEnd = row + (Char2Table[chTableIndx].length / 2);
            Char1List[chTableIndx].total = Number(Char1Table[chTableIndx][Char1Table[chTableIndx].length - 1]);
            temp = ['Letter', 'Σ', '#', 'Σ>'];
            temp.length = ColEnd + 1;
            // temp.fill(0, 4, ColEnd + 1);
            for (let j = 4; j <=  ColEnd; j++) {         // Char1 stats line
                temp[j] = Char1Table[chTableIndx][j - 3];
            }
            Table.push(temp);
            row++;
            for (let j = 0; j < Char2Table[chTableIndx].length; j++) {  // Char2 lines
                Char2List[ch2Indx] = Object.assign({}, Char2Obj);
                Char2List[ch2Indx].row = row;
                Char2List[ch2Indx].char2 = Char2Table[chTableIndx][j];
                j++;
                Char2List[ch2Indx].count = Char2Table[chTableIndx][j];
                temp = [Char2List[ch2Indx].char2, Char2List[ch2Indx].count, 0, ''];
                // temp.length = ColEnd + 1;
                // temp.fill(0, 4, ColEnd + 1);
                Table.push(temp);
                ch2Indx++;
                row++;
            }
            temp = ['Σ', Char1List[chTableIndx].total, 0, ''];
            temp.length = ColEnd + 1;
            temp.fill(0, 4, ColEnd + 1);
            Table.push(temp);
            row +=4;
            chTableIndx++;
        }
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
    // -------------------------------------
    // Create DOM for our added HTML
    // -------------------------------------
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
            <td id="metastats1">Total points:&nbsp<br>Total pangrams:&nbsp<br>Pangrams Found:&nbsp</td>
            <td id="metastats2"></td>
            <td id="metastats3">Genius:&nbsp<br>Total words:&nbsp<br>Words Found:&nbsp</td>
            <td id="metastats4"></td>
        </table>
        <table id="table0"></table><br>
        <style>
        #metastats1 {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 90%;
            width: 20ch;
            margin-left: 1ch;
            text-align: right;
        }
        #metastats2 {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 90%;
            text-align: left;
            width: 14ch;
        }
        #metastats3 {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 90%;
            width: 16ch;
            margin-left: 1ch;
            text-align: right;
        }
        #metastats4 {
            font-family: Arial, Helvetica, sans-serif;
            margin-left: 1ch;
            font-size: 90%;
            text-align: right;
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
        .separator {
            border-bottom: 1px solid black;
        }
        </style>
        `;
        return hintDiv;
    }

//======================================
// MAIN SUPPORTING FUNCTION:  UPDATE TABLES FROM FOUND WORDS
//======================================

    // -------------------------------------
    function UpdateList () {
    // -------------------------------------
    let ProcessList = CullList(El.WordList.innerText.toUpperCase().split('\n'));
    for (let i = 0; i < ProcessList.length; i++) {      // Tally input words
        Table[Char2ToRow(ProcessList[i])][ColIndex[ProcessList[i].length]]++;
        WordsFound++;
        let pangram = true;                             // check for Pangram
        for (let j = 0; j < LetterList.length; j++) {
            if (!ProcessList[i].includes(LetterList[j])) {
                pangram = false;
                break;
            }
        }
        if (pangram) PangramsFound++;
    }
    UpdateMetaStats();
    Char1List.forEach(item => {item.colSum(); item.rowSum();});
    DisplayTable();
    return;
    }

    function CullList(inputList) {       // returns list of unprocessed words
        let outputList = [];
        for (let i = 0; i < inputList.length; i++) {
            if (!ProcessedWords.includes(inputList[i])) {
                ProcessedWords.push(inputList[i]);
                outputList.push(inputList[i]);
            }
        }
        return outputList;
    }

    function resetStats() {    // needed if program is installed on opening SB page
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
    // GENERAL SUB-FUNCTIONS
    //======================================

    function UpdateMetaStats () {
        El.MetaStats2.innerHTML = Points + '<br>' + Pangrams + `<br>` + PangramsFound;
        El.MetaStats4.innerHTML = GeniusScore + '<br>' + WordsTotal + `<br>` + WordsFound;
        return;
    }

    function DisplayTable () {
        for (let i = 0; i < TableTotalRows; i++) {
            for (let j = 0; j <= ColEnd; j++) {
                Cell[i][j].element.innerHTML = Table[i][j];
            }
        }
        // code below displays helpful "0"s by filtering out unhelpful "0"s into "".
        Char1List.forEach(item => {
            for (let col = ColStart; col <= ColEnd; col ++) {
                if (Table[item.rowStart][col] == 0) {
                    for (let row = item.rowStart - 1; row <= item.rowEnd + 1; row++) {
                        Cell[row][col].element.innerHTML = '';
                    }
                }
            }
        });
        DoneIsGray();
        return;
    }

        // TO DO:  ONLY WORKS ON BOTTOM ROW OF EACH CHAR1 TABLE
        function DoneIsGray () {    // grays out completed rows and columns
            for (let i = 0; i < Char1List.length; i++) {
                // check for completed rows
                for (let j = Char1List[i].rowStart + 1; j <= Char1List[i].rowEnd + 1; j++) {
                    if (Table[j][1] === Table[j][2]) {
                        RowColor(j, 0, ColEnd, "lightsteelblue")
                    }
                }
                // check for completed columns
                for (let j = ColStart; j <= ColEnd; j++) {
                    if (Table[Char1List[i].rowStart][j] === Table[Char1List[i].rowEnd + 1][j]) {
                        ColColor(j, Char1List[i].rowStart - 1, Char1List[i].rowEnd + 1,"lightsteelblue");
                    }
                }
            }
        }

        function Char2ToRow (word) {            // returns row of char2
            return Char2List[Char2List.findIndex(item => item.char2 === word.slice(0, 2))].row;
        }

        function RowColor (row, colStart, colEnd, color) {
            for (let col = colStart; col <= colEnd; col++) {
                Cell[row][col].element.style.color = color;
            }
        }

        function ColColor (col, rowStart, rowEnd, color) {
            for (let row = rowStart; row <= rowEnd; row++) {
                Cell[row][col].element.style.color = color;
            }
        }

}       // end of main function

})();   // end of outer shell function

